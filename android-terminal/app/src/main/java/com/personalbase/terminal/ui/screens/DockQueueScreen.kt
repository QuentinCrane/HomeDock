/**
 * DockQueueScreen - 待回港队列屏幕
 * 
 * 屏幕功能：
 * - 显示所有待回港的胶囊列表
 * - 实时显示与主基地的连接状态
 * - 展示每个胶囊的同步状态（待发送/发送中/已送达/失败）
 * - 提供仪式感十足的"回港"按钮，一键上传所有胶囊
 * - 支持左滑删除胶囊
 * 
 * 状态管理：
 * - capsuleStates：追踪每个胶囊的同步状态
 * - syncState：整体同步状态（IDLE/SYNCING/PARTIAL_SUCCESS/ERROR）
 * 
 * 用户交互：
 * - 点击胶囊展开详情
 * - 左滑胶囊触发删除
 * - 点击"发起回港"按钮开始同步
 */
package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.SnackbarState
import com.personalbase.terminal.SnackbarType
import com.personalbase.terminal.CapsuleBottomSheet
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.ui.MainViewModel
import kotlinx.coroutines.delay
import kotlin.math.abs

// ============================================================================
// DOCK QUEUE SCREEN - Return to port queue management screen
// Refined per PLAN.md requirements:
// - Clear connection status at top
// - Prominent ritual-like return button
// - Individual capsule sync states
// ============================================================================

/**
 * DockQueueScreen 主Composable函数
 * 
 * 关键状态：
 * - baseIp：主基地 IP，为 null 表示未发现
 * - syncState：同步状态，用于控制 UI 显示和回港按钮状态
 * - pending：待回港的胶囊列表
 * - capsuleStates：每个胶囊的单独同步状态
 */
@Composable
fun DockQueueScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val baseIp by viewModel.baseIp.collectAsState()
    val syncState by viewModel.syncState.collectAsState()
    val pending by viewModel.pendingCapsules.collectAsState(initial = emptyList())

    // Track individual capsule sync states (capsuleId -> syncState)
    // 胶囊同步状态映射：每个胶囊 ID 对应其同步状态
    // States: PENDING, SYNCING, SUCCESS, FAILED
    var capsuleStates by remember { mutableStateOf<Map<Int, String>>(emptyMap()) }

    // Snackbar state
    var snackbarState by remember { mutableStateOf(SnackbarState()) }

    // Bottom sheet state
    var selectedCapsule by remember { mutableStateOf<CapsuleEntity?>(null) }
    var isBottomSheetVisible by remember { mutableStateOf(false) }

    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }

    // 屏幕入场动画延迟触发
    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
    }

    // 当待回港列表变化时，初始化所有胶囊状态为 PENDING
    LaunchedEffect(pending) {
        if (pending.isNotEmpty() && capsuleStates.isEmpty()) {
            capsuleStates = pending.associate { it.id to "PENDING" }
        }
    }

    // Show snackbar on sync state changes
    LaunchedEffect(syncState) {
        when (syncState) {
            "SUCCESS", "IDLE" -> {
                if (syncState == "IDLE" && capsuleStates.values.any { it == "SUCCESS" }) {
                    snackbarState = SnackbarState(
                        message = ">>> 归档完成 <<<",
                        type = SnackbarType.SUCCESS,
                        isVisible = true
                    )
                }
            }
            "PARTIAL_SUCCESS" -> {
                val failedCount = capsuleStates.values.count { it == "FAILED" }
                snackbarState = SnackbarState(
                    message = "!!! $failedCount 枚失败待重试 !!!",
                    type = SnackbarType.ERROR,
                    isVisible = true
                )
            }
            "ERROR" -> {
                snackbarState = SnackbarState(
                    message = "!!! 归档失败 !!!",
                    type = SnackbarType.ERROR,
                    isVisible = true
                )
            }
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AnimatedVisibility(
            visible = screenVisible,
            enter = fadeIn(tween(400)) + scaleIn(
                initialScale = 0.98f,
                animationSpec = tween(400)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "待回港",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )

                    ConnectionStatusDot(baseIp = baseIp, syncState = syncState)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Connection Status Banner
                ConnectionStatusBanner(
                    baseIp = baseIp,
                    syncState = syncState,
                    pendingCount = pending.size
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Queue count header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "待回港",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "${pending.size} 枚",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.secondary,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Capsule list or empty state
                if (pending.isEmpty()) {
                    QueueEmptyState(
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        itemsIndexed(
                            items = pending,
                            key = { _, capsule -> capsule.id }
                        ) { index, capsule ->
                            val capsuleState = capsuleStates[capsule.id] ?: "PENDING"

                            QueueSwipeToDismissItem(
                                capsule = capsule,
                                index = index,
                                capsuleState = capsuleState,
                                onCapsuleStateChange = { newState ->
                                    capsuleStates = capsuleStates + (capsule.id to newState)
                                },
                                onDismiss = {
                                    capsuleStates = capsuleStates - capsule.id
                                },
                                onShowDetails = {
                                    selectedCapsule = capsule
                                    isBottomSheetVisible = true
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Return to Port Button - Prominent and ritual-like
                DockSyncButton(
                    syncState = syncState,
                    pendingCount = pending.size,
                    baseIp = baseIp,
                    onSync = {
                        if (syncState != "SYNCING" && pending.isNotEmpty() && baseIp != null) {
                            // Set all capsules to SYNCING state
                            capsuleStates = pending.associate { it.id to "SYNCING" }
                            viewModel.returnToPort()
                        }
                    }
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Last result hint
                LastResultHint(syncState = syncState, capsuleStates = capsuleStates)
            }
        }

        // Snackbar overlay
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            DockQueueSnackbar(
                snackbarState = snackbarState,
                onDismiss = { snackbarState = snackbarState.copy(isVisible = false) }
            )
        }

        // Bottom Sheet overlay
        if (isBottomSheetVisible && selectedCapsule != null) {
            CapsuleBottomSheet(
                capsule = selectedCapsule!!,
                onDismiss = {
                    isBottomSheetVisible = false
                    selectedCapsule = null
                }
            )
        }
    }
}

// ============================================================================
// CONNECTION STATUS DOT - 动画状态指示器（位于标题栏右侧）
// 
// 功能说明：
// - 显示与主基地的连接状态
// - 根据状态不同呈现不同的颜色和动画速度
// 
// 状态表现：
// - 未发现基地（灰色）：缓慢脉冲动画
// - 已发现基地（青色）：较慢脉冲动画
// - 同步中（蓝色）：快速脉冲动画
// - 部分成功/失败（红色）：稳定显示
// 
// 动画参数：
// - 脉冲周期：同步中 400ms，已发现 1200ms，未发现 2000ms
// - 缩放范围：1.0 ~ 1.3
// - 光晕透明度：0.2 ~ 0.7
// ============================================================================

@Composable
private fun ConnectionStatusDot(baseIp: String?, syncState: String) {
    val infiniteTransition = rememberInfiniteTransition(label = "connection_dot")

    // Determine animation speed based on state
    val pulseDuration = when {
        syncState == "SYNCING" -> 400  // Fast pulse when syncing
        baseIp != null -> 1200          // Slow pulse when base discovered
        else -> 2000                    // Very slow or no pulse when no base
    }

    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (baseIp != null) 1.3f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(pulseDuration, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dot_scale"
    )

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = if (baseIp != null) 0.7f else 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(pulseDuration, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dot_glow"
    )

    // Color based on state
    val dotColor = when {
        syncState == "SYNCING" -> Color(0xFF3B82F6)  // Blue - syncing
        syncState == "PARTIAL_SUCCESS" || syncState == "ERROR" -> Color(0xFFEF4444)  // Red - error
        baseIp != null -> Color(0xFF06B6D4)  // Cyan - base discovered
        else -> Color(0xFF6B7280)  // Gray - no base
    }

    Row(verticalAlignment = Alignment.CenterVertically) {
        // Glow effect behind dot
        Box(
            modifier = Modifier
                .size(16.dp)
                .scale(scale)
                .background(
                    color = dotColor.copy(alpha = glowAlpha * 0.5f),
                    shape = androidx.compose.foundation.shape.CircleShape
                )
        )
        // Main dot
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(dotColor, shape = androidx.compose.foundation.shape.CircleShape)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = when {
                baseIp == null -> "未发现基地"
                syncState == "SYNCING" -> "同步中"
                else -> "已发现基地"
            },
            fontFamily = FontFamily.Monospace,
            color = dotColor,
            fontSize = 12.sp
        )
    }
}

// ============================================================================
// CONNECTION STATUS BANNER - 连接状态横幅
// 
// 功能说明：
// - 位于屏幕顶部，显著展示与主基地的连接状态
// - 根据不同状态显示不同颜色的背景和文字
// 
// 状态颜色方案：
// - 未发现（深灰背景）：未发现基地，请连接到基地网络
// - 同步中（深蓝背景）：正在回港...
// - 部分成功（深红背景）：部分胶囊送达失败
// - 失败（深红背景）：回港失败，请重试
// - 就绪（深青背景）：基地状态：已发现，可发起回港
// 
// 关键属性：
// - baseIp：主基地 IP，为 null 表示未发现
// - syncState：当前同步状态
// - pendingCount：待回港胶囊数量，显示时附带数量信息
// ============================================================================

@Composable
private fun ConnectionStatusBanner(
    baseIp: String?,
    syncState: String,
    pendingCount: Int
) {
    val backgroundColor = when {
        baseIp == null -> Color(0xFF374151)  // Dark gray - no base
        syncState == "SYNCING" -> Color(0xFF1E40AF)  // Deep blue - syncing
        syncState == "PARTIAL_SUCCESS" || syncState == "ERROR" -> Color(0xFF991B1B)  // Dark red - error
        else -> Color(0xFF134E4A)  // Dark teal - ready
    }

    val contentColor = when {
        baseIp == null -> Color(0xFF9CA3AF)  // Gray text
        syncState == "SYNCING" -> Color(0xFF93C5FD)  // Light blue text
        syncState == "PARTIAL_SUCCESS" || syncState == "ERROR" -> Color(0xFFFCA5A5)  // Light red text
        else -> Color(0xFF5EEAD4)  // Teal text
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = backgroundColor,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = when {
                    baseIp == null -> "未发现基地，请连接到基地网络"
                    syncState == "SYNCING" -> "正在回港..."
                    syncState == "PARTIAL_SUCCESS" -> "部分胶囊送达失败"
                    syncState == "ERROR" -> "回港失败，请重试"
                    pendingCount > 0 -> "基地状态：已发现，可发起回港"
                    else -> "基地状态：已连接"
                },
                fontFamily = FontFamily.Monospace,
                color = contentColor,
                fontSize = 13.sp
            )

            if (pendingCount > 0 && baseIp != null && syncState != "SYNCING") {
                Text(
                    text = "待回港 $pendingCount 枚",
                    fontFamily = FontFamily.Monospace,
                    color = contentColor.copy(alpha = 0.8f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// ============================================================================
// LAST RESULT HINT - 上次同步结果提示
// 
// 功能说明：
// - 在回港按钮下方显示上次同步的结果统计
// - 实时统计成功和失败的胶囊数量
// 
// 状态判断：
// - 同步中：显示"回港进行中..."
// - 全部成功：显示"上次成功送达 X 枚"
// - 部分失败：显示"本次成功送达 X 枚，X 枚失败"
// - 全部失败：显示"X 枚失败待重试"
// - 无记录：隐藏提示文本
// 
// 用户交互：
// - 仅作为信息展示，无交互元素
// ============================================================================

@Composable
private fun LastResultHint(syncState: String, capsuleStates: Map<Int, String>) {
    val successCount = capsuleStates.values.count { it == "SUCCESS" }
    val failedCount = capsuleStates.values.count { it == "FAILED" }

    val hintText = when {
        syncState == "SYNCING" -> "回港进行中..."
        successCount > 0 && failedCount > 0 -> "本次成功送达 $successCount 枚，$failedCount 枚失败"
        successCount > 0 -> "上次成功送达 $successCount 枚"
        failedCount > 0 -> "$failedCount 枚失败待重试"
        else -> ""
    }

    if (hintText.isNotEmpty()) {
        Text(
            text = hintText,
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            fontSize = 12.sp
        )
    }
}

// ============================================================================
// DOCK SYNC BUTTON - 仪式感回港按钮
// 
// 功能说明：
// - 整个界面的核心操作按钮，一键上传所有待回港胶囊
// - 根据状态呈现不同的视觉效果和交互反馈
// 
// 按钮状态：
// - 等待基地：显示"[ 等待基地 ]"，灰色，禁用点击
// - 无待回港：显示"[ 无待回港 ]"，灰色，禁用点击
// - 就绪：显示"[ 发起回港 ]"，带边缘光晕呼吸动画
// - 同步中：显示进度百分比 + 旋转图标 + "正在回港"
// 
// 动画系统：
// - 呼吸动画：就绪时低频缩放（1.0 ~ 1.02，周期 2000ms）
// - 边缘光晕：就绪时边缘发光呼吸（透明度 0.3 ~ 0.8，周期 1500ms）
// - 进度圆弧：同步中显示环形进度条 + 百分比
// - 旋转图标：同步中持续旋转（周期 1000ms）
// - 按压缩放：点击时收缩至 0.96
// 
// 用户交互：
// - 点击触发同步（需满足：有待回港、已发现基地、非同步中）
// - 点击后设置所有胶囊状态为 SYNCING
// ============================================================================

@Composable
private fun DockSyncButton(
    syncState: String,
    pendingCount: Int,
    baseIp: String?,
    onSync: () -> Unit
) {
    val isSyncing = syncState == "SYNCING"
    val isEmpty = pendingCount == 0
    val hasBase = baseIp != null
    val canSync = !isEmpty && hasBase && !isSyncing

    // Breathing animation when idle
    val infiniteTransition = rememberInfiniteTransition(label = "dock_sync_breathing")

    val breathingScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (canSync) 1.02f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (canSync) 2000 else 3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathing_scale"
    )

    // Edge glow when base discovered
    val edgeGlowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = if (canSync) 0.8f else 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (canSync) 1500 else 3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "edge_glow"
    )

    // Rotation for syncing
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (isSyncing) 1000 else 2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    // Progress animation
    var currentProgress by remember { mutableStateOf(0f) }

    LaunchedEffect(syncState) {
        if (syncState == "SYNCING") {
            val startTime = System.currentTimeMillis()
            while (currentProgress < 1f) {
                val elapsed = System.currentTimeMillis() - startTime
                currentProgress = (elapsed / 5000f).coerceAtMost(1f)
                delay(50)
            }
        } else {
            currentProgress = 0f
        }
    }

    // Button press scale animation
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val pressScale by animateFloatAsState(
        targetValue = if (isPressed && canSync) 0.96f else 1f,
        animationSpec = spring(dampingRatio = 0.4f, stiffness = 400f),
        label = "press_scale"
    )

    val buttonColor = when {
        isSyncing -> MaterialTheme.colorScheme.primary
        !hasBase -> Color(0xFF374151)
        else -> MaterialTheme.colorScheme.surface
    }

    val borderColor = when {
        isSyncing -> Color(0xFF60A5FA)
        !canSync -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
        else -> MaterialTheme.colorScheme.primary.copy(alpha = edgeGlowAlpha)
    }

    val textColor = when {
        isSyncing -> Color.White
        !hasBase -> Color(0xFF6B7280)
        else -> MaterialTheme.colorScheme.primary
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .scale(breathingScale * pressScale)
            .clip(RoundedCornerShape(4.dp))
            .background(buttonColor)
            .border(
                width = if (canSync) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(4.dp)
            )
            // Edge glow effect when base discovered
            .then(
                if (canSync) {
                    Modifier.background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary.copy(alpha = edgeGlowAlpha * 0.3f),
                                Color.Transparent,
                                MaterialTheme.colorScheme.primary.copy(alpha = edgeGlowAlpha * 0.3f)
                            )
                        )
                    )
                } else Modifier
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                if (canSync) {
                    onSync()
                }
            },
        contentAlignment = Alignment.Center
    ) {
        if (isSyncing) {
            // Circular progress indicator
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(48.dp)
            ) {
                Canvas(modifier = Modifier.size(48.dp)) {
                    drawArc(
                        color = Color.White.copy(alpha = 0.2f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = 3.dp.toPx())
                    )
                }
                Canvas(modifier = Modifier.size(48.dp)) {
                    val sweepAngle = currentProgress * 360f
                    drawArc(
                        color = Color.White,
                        startAngle = -90f,
                        sweepAngle = sweepAngle,
                        useCenter = false,
                        style = Stroke(width = 3.dp.toPx())
                    )
                }
                Text(
                    text = "${(currentProgress * 100).toInt()}%",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Rotating sync icon
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .rotate(rotation)
                    .background(
                        brush = Brush.sweepGradient(
                            colors = listOf(
                                Color.White,
                                Color.White.copy(alpha = 0.3f),
                                Color.White
                            )
                        )
                    )
            )

            Spacer(modifier = Modifier.width(12.dp))

            Text(
                text = "正在回港",
                fontFamily = FontFamily.Monospace,
                color = textColor,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
        } else {
            // Idle / ready state
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .rotate(rotation)
                    .background(
                        brush = Brush.sweepGradient(
                            colors = listOf(
                                textColor.copy(alpha = 0.6f),
                                Color.Transparent,
                                textColor.copy(alpha = 0.6f)
                            )
                        )
                    )
            )

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                text = when {
                    !hasBase -> "[ 等待基地 ]"
                    isEmpty -> "[ 无待回港 ]"
                    else -> "[ 发起回港 ]"
                },
                fontFamily = FontFamily.Monospace,
                color = textColor,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
        }
    }
}

// ============================================================================
// QUEUE EMPTY STATE - 队列为空状态
// 
// 功能说明：
// - 当待回港队列为空时显示的空状态提示
// - 传达"所有胶囊已安全回港"的积极信息
// 
// 视觉设计：
// - 绿色勾选图标，带浮动动画（上下浮动 + 缩放呼吸）
// - 主标题"[ 队列为空 ]" + 副标题"所有胶囊已回港"
// - 图标和文字分阶段淡入动画
// 
// 动画参数：
// - 浮动偏移：-6dp ~ 6dp，周期 2500ms
// - 缩放呼吸：0.95 ~ 1.05，周期 2500ms
// - 文字淡入：延迟 300ms 触发，500ms 渐变
// 
// 用户交互：
// - 纯展示，无交互元素
// ============================================================================

@Composable
private fun QueueEmptyState(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "queue_empty_state")

    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -6f,
        targetValue = 6f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale_breath"
    )

    var textVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(300)
        textVisible = true
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .offset(y = floatOffset.dp)
                .scale(scale)
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        AnimatedVisibility(
            visible = textVisible,
            enter = fadeIn(tween(500)) + slideInVertically(
                initialOffsetY = { it / 2 },
                animationSpec = tween(500)
            )
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "[ 队列为空 ]",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "所有胶囊已回港",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// ============================================================================
// DOCK QUEUE SNACKBAR - 通知横幅
// 
// 功能说明：
// - 显示同步操作的结果通知
// - 自动 3 秒后消失
// 
// 通知类型：
// - 成功（绿色）：">>> 归档完成 <<<"，显示勾选图标
// - 错误（红色）："!!! X 枚失败待重试 !!!" 或 "!!! 归档失败 !!!"，显示关闭图标
// 
// 动画效果：
// - 入场：从底部滑入 + 淡入（弹簧阻尼 0.6）
// - 出场：横向滑出 + 淡出
// - 错误状态：横向抖动动画（增强警告感）
// 
// 用户交互：
// - 点击任意位置可手动关闭
// ============================================================================

@Composable
private fun DockQueueSnackbar(
    snackbarState: SnackbarState,
    onDismiss: () -> Unit
) {
    val isVisible = snackbarState.isVisible
    val snackbarType = snackbarState.type

    val shakeTransition = rememberInfiniteTransition(label = "dock_shake")
    val shakeOffset by shakeTransition.animateFloat(
        initialValue = -6f,
        targetValue = 6f,
        animationSpec = infiniteRepeatable(
            animation = tween(50, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shake_offset"
    )

    LaunchedEffect(isVisible) {
        if (isVisible) {
            delay(3000)
            onDismiss()
        }
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(
            initialOffsetY = { it },
            animationSpec = spring(dampingRatio = 0.6f, stiffness = 300f)
        ) + fadeIn(animationSpec = tween(200)),
        exit = slideOutHorizontally(
            targetOffsetX = { it },
            animationSpec = tween(200)
        ) + fadeOut(animationSpec = tween(200)),
        modifier = Modifier.padding(16.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = if (snackbarType == SnackbarType.SUCCESS)
                Color(0xFF10B981).copy(alpha = 0.95f)
            else
                Color(0xFFEF4444).copy(alpha = 0.95f),
            shadowElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = if (snackbarType == SnackbarType.ERROR) shakeOffset.dp else 0.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = if (snackbarType == SnackbarType.SUCCESS)
                        Icons.Default.Check
                    else
                        Icons.Default.Close,
                    contentDescription = null,
                    tint = Color.White
                )
                Text(
                    text = snackbarState.message,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

// ============================================================================
// QUEUE SWIPE TO DISMISS ITEM - 左滑删除胶囊项
// 
// 功能说明：
// - 封装单个胶囊项，提供左滑删除功能
// - 滑动超过阈值（200dp）触发删除回调
// 
// 手势处理：
// - 向左滑：显示红色删除背景，阈值 200dp
// - 最大滑动：300dp（防止过度拉伸）
// - 滑动释放：超过阈值执行删除，未超过则回弹
// 
// 视觉反馈：
// - 滑动背景：红色渐变，从透明到 30% 透明度
// - 删除图标：随滑动进度渐变出现
// - 胶쇄项：根据 capsuleState 显示对应边框颜色
// 
// 动画参数：
// - 回弹动画：弹簧阻尼 0.6，刚度 400
// - 滑动进度：offsetX / dismissThreshold (0 ~ 1)
// 
// 用户交互：
// - 左滑触发 onDismiss
// - 点击胶囊项触发 onShowDetails
// ============================================================================

@Composable
private fun QueueSwipeToDismissItem(
    capsule: CapsuleEntity,
    index: Int,
    capsuleState: String,
    onCapsuleStateChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onShowDetails: () -> Unit
) {
    var offsetX by remember { mutableStateOf(0f) }
    val dismissThreshold = 200f

    val animatedOffset by animateFloatAsState(
        targetValue = offsetX,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
        label = "swipe_offset"
    )

    val swipeProgress by remember {
        derivedStateOf { (offsetX / dismissThreshold).coerceIn(0f, 1f) }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .offset(x = animatedOffset.dp)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        if (abs(offsetX) > dismissThreshold) {
                            onDismiss()
                        }
                        offsetX = 0f
                    },
                    onDragCancel = {
                        offsetX = 0f
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        offsetX = (offsetX + dragAmount).coerceIn(-dismissThreshold * 1.5f, 0f)
                    }
                )
            }
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(Color(0xFFEF4444).copy(alpha = swipeProgress))
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = "Delete",
                tint = Color.White.copy(alpha = swipeProgress),
                modifier = Modifier.size(24.dp)
            )
        }

        QueueAnimatedCapsuleItem(
            capsule = capsule,
            index = index,
            capsuleState = capsuleState,
            onShowDetails = onShowDetails
        )
    }
}

// ============================================================================
// QUEUE ANIMATED CAPSULE ITEM - 动画胶 쇽单项
// 
// 功能说明：
// - 为胶囊项提供入场和出场动画
// - 列表中的每个胶囊依次延迟入场
// 
// 入场动画：
// - 延迟：index * 50ms（实现依次入场效果）
// - 淡入：300ms，FastOutSlowInEasing
// - 向上滑入：初始偏移为自身高度的一半，弹簧阻尼 0.8
// 
// 出场动画：
// - 淡出：200ms
// 
// 用户交互：
// - 点击事件传递给内部的 QueueCapsuleItem
// ============================================================================

@Composable
private fun QueueAnimatedCapsuleItem(
    capsule: CapsuleEntity,
    index: Int,
    capsuleState: String,
    onShowDetails: () -> Unit
) {
    var visible by remember { mutableStateOf(false) }

    LaunchedEffect(capsule.id) {
        delay(index * 50L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(
            animationSpec = tween(300, easing = FastOutSlowInEasing)
        ) + slideInVertically(
            initialOffsetY = { it / 2 },
            animationSpec = spring(dampingRatio = 0.8f, stiffness = 300f)
        ),
        exit = fadeOut(tween(200))
    ) {
        QueueCapsuleItem(
            capsule = capsule,
            capsuleState = capsuleState,
            onShowDetails = onShowDetails
        )
    }
}

// ============================================================================
// QUEUE CAPSULE ITEM - 胶囊单项（带同步状态指示）
// 
// 功能说明：
// - 显示单个胶囊的内容预览和同步状态
// - 支持展开查看详情
// - 根据 capsuleState 显示不同的视觉反馈
// 
// 胶囊状态及表现：
// - PENDING（待发送）：灰色边框，稳定显示
// - SYNCING（发送中）：蓝色边框 + 边框脉冲动画
// - SUCCESS（已送达）：绿色边框 + 短暂成功光晕
// - FAILED（失败）：红色边框 + 抖动动画 + 重试按钮
// 
// 按压缩放反馈：
// - 按下：缩放至 0.98，阴影高度 8dp
// - 释放：恢复缩放至 1.0，阴影高度 2dp
// - 动画：弹簧阻尼 0.6，刚度 500
// 
// 展开行为：
// - 点击切换展开状态
// - 展开显示"查看详情"按钮
// - 失败状态不显示详情按钮
// 
// 状态指示器动画：
// - 同步脉冲：透明度 0.3 ~ 0.8，周期 600ms
// - 失败抖动：偏移 -4dp ~ 4dp，周期 50ms
// - 成功光晕：1500ms 后淡出，周期 300ms
// 
// 用户交互：
// - 点击：展开/收起详情
// - 失败状态点击重试：触发重试回调
// ============================================================================

@Composable
private fun QueueCapsuleItem(
    capsule: CapsuleEntity,
    capsuleState: String,
    onShowDetails: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    var isExpanded by remember { mutableStateOf(false) }

    // Press feedback animations
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
        label = "press_scale"
    )

    val elevation by animateDpAsState(
        targetValue = if (isPressed) 8.dp else 2.dp,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
        label = "press_elevation"
    )

    // Border color based on capsule state
    val stateBorderColor = when (capsuleState) {
        "SYNCING" -> Color(0xFF3B82F6)  // Blue
        "SUCCESS" -> Color(0xFF10B981)  // Green
        "FAILED" -> Color(0xFFEF4444)  // Red
        else -> Color(0xFF2A2E37)  // Dark gray
    }

    // State indicator animations
    val infiniteTransition = rememberInfiniteTransition(label = "capsule_state")

    val syncPulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sync_pulse"
    )

    // Shake animation for failed state
    val shakeOffset by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(50, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shake"
    )

    val borderAlpha by animateFloatAsState(
        targetValue = if (isPressed) 1f else if (capsuleState == "SYNCING") syncPulseAlpha else 0.7f,
        animationSpec = tween(200),
        label = "border_alpha"
    )

    val borderColor by animateColorAsState(
        targetValue = if (isPressed) MaterialTheme.colorScheme.primary else stateBorderColor,
        animationSpec = tween(200),
        label = "state_border_color"
    )

    val arrowRotation by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        animationSpec = spring(dampingRatio = 0.7f, stiffness = 300f),
        label = "arrow_rotation"
    )

    // Success glow animation
    var showSuccessGlow by remember { mutableStateOf(false) }

    LaunchedEffect(capsuleState) {
        if (capsuleState == "SUCCESS") {
            showSuccessGlow = true
            delay(1500)
            showSuccessGlow = false
        }
    }

    val successGlowAlpha by animateFloatAsState(
        targetValue = if (showSuccessGlow) 0.4f else 0f,
        animationSpec = tween(300),
        label = "success_glow"
    )

    Surface(
        shape = RoundedCornerShape(4.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = elevation,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .border(
                width = if (capsuleState == "SYNCING" || capsuleState == "FAILED") 1.5.dp else 1.dp,
                color = borderColor.copy(alpha = borderAlpha),
                shape = RoundedCornerShape(4.dp)
            )
            // Success glow effect
            .then(
                if (showSuccessGlow) {
                    Modifier.background(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                Color(0xFF10B981).copy(alpha = successGlowAlpha),
                                Color.Transparent
                            )
                        )
                    )
                } else Modifier
            )
            .scale(scale)
            .animateContentSize()
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) {
                isExpanded = !isExpanded
            }
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Capsule type with state indicator
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // State indicator dot
                    CapsuleStateIndicator(
                        state = capsuleState,
                        syncPulseAlpha = syncPulseAlpha,
                        shakeOffset = shakeOffset
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "[${capsule.type.uppercase()}]",
                        color = MaterialTheme.colorScheme.secondary,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Capsule state text
                    CapsuleStateText(state = capsuleState)

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "ID:#${capsule.id}",
                        color = Color.Gray,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.ExpandMore,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        modifier = Modifier
                            .size(20.dp)
                            .rotate(arrowRotation),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = capsule.content ?: "Media File",
                color = MaterialTheme.colorScheme.onSurface,
                fontFamily = FontFamily.Monospace,
                maxLines = if (isExpanded) Int.MAX_VALUE else 2,
                overflow = if (isExpanded) TextOverflow.Clip else TextOverflow.Ellipsis
            )

            // Failed state retry button
            if (capsuleState == "FAILED") {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = { /* Retry this capsule */ },
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = Color(0xFFEF4444)
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "重试",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = isExpanded && capsuleState != "FAILED",
                enter = fadeIn(tween(200)) + slideInVertically(
                    initialOffsetY = { -it / 4 },
                    animationSpec = tween(200)
                ),
                exit = fadeOut(tween(150)) + slideOutVertically(
                    targetOffsetY = { -it / 4 },
                    animationSpec = tween(150)
                )
            ) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(
                        color = Color(0xFF2A2E37),
                        thickness = 1.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onShowDetails) {
                            Icon(
                                imageVector = Icons.Default.ExpandLess,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "查看详情",
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// CAPSULE STATE INDICATOR - 胶囊状态指示点
// 
// 功能说明：
// - 显示一个小圆点，反映胶囊当前的同步状态
// - 位于胶囊类型标签左侧
// 
// 状态颜色：
// - PENDING：灰色（0xFF6B7280），60% 透明度
// - SYNCING：蓝色（0xFF3B82F6），带 syncPulseAlpha 动画的光晕
// - SUCCESS：绿色（0xFF10B981），纯色
// - FAILED：红色（0xFFEF4444），带 shakeOffset 抖动
// 
// 动画参数：
// - syncPulseAlpha：控制 SYNCING 状态的光晕透明度
// - shakeOffset：控制 FAILED 状态的水平抖动偏移
// 
// 用户交互：
// - 无交互，纯展示
// ============================================================================

@Composable
private fun CapsuleStateIndicator(
    state: String,
    syncPulseAlpha: Float,
    shakeOffset: Float
) {
    val size = 8.dp
    val dotColor = when (state) {
        "SYNCING" -> Color(0xFF3B82F6)
        "SUCCESS" -> Color(0xFF10B981)
        "FAILED" -> Color(0xFFEF4444)
        else -> Color(0xFF6B7280)
    }

    val modifier = when (state) {
        "SYNCING" -> Modifier
            .size(size)
            .background(
                color = dotColor.copy(alpha = syncPulseAlpha),
                shape = androidx.compose.foundation.shape.CircleShape
            )
        "FAILED" -> Modifier
            .offset(x = shakeOffset.dp)
            .size(size)
            .background(dotColor, shape = androidx.compose.foundation.shape.CircleShape)
        "SUCCESS" -> Modifier
            .size(size)
            .background(dotColor, shape = androidx.compose.foundation.shape.CircleShape)
        else -> Modifier
            .size(size)
            .background(dotColor.copy(alpha = 0.6f), shape = androidx.compose.foundation.shape.CircleShape)
    }

    Box(modifier = modifier)
}

// ============================================================================
// CAPSULE STATE TEXT - 胶囊状态文字
// 
// 功能说明：
// - 显示胶囊同步状态的中文文本
// - 位于胶囊 ID 右侧
// 
// 状态文本及颜色：
// - PENDING：待发送（灰色 0xFF6B7280）
// - SYNCING：发送中（蓝色 0xFF3B82F6）
// - SUCCESS：已送达（绿色 0xFF10B981）
// - FAILED：失败（红色 0xFFEF4444）
// 
// 用户交互：
// - 无交互，纯展示
// ============================================================================

@Composable
private fun CapsuleStateText(state: String) {
    val (text, color) = when (state) {
        "SYNCING" -> "发送中" to Color(0xFF3B82F6)
        "SUCCESS" -> "已送达" to Color(0xFF10B981)
        "FAILED" -> "失败" to Color(0xFFEF4444)
        else -> "待发送" to Color(0xFF6B7280)
    }

    Text(
        text = text,
        fontFamily = FontFamily.Monospace,
        color = color,
        fontSize = 11.sp
    )
}
