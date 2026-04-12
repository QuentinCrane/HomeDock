package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.CapsuleDetailChip
import com.personalbase.terminal.ui.MainViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs

// ============================================================================
// CAPSULES SCREEN - 胶囊库屏幕
// 
// 屏幕功能：
// - 浏览本地所有胶囊（草稿、待回港、已归档）
// - 支持按类型筛选（文字、图片、音频）
// - 支持按状态筛选（草稿、待回港、已归档、收藏）
// - 支持关键词搜索
// - 左滑删除/归档，右滑收藏/重新提交
// - 长按弹出快捷操作菜单
// - 点击查看胶囊详情（底部弹窗）
// 
// 状态管理：
// - selectedTypeFilter：类型筛选（null=全部）
// - selectedStatusFilter：状态筛选（null=全部）
// - showFavoritesOnly：仅显示收藏
// - searchQuery：搜索关键词
// 
// 用户交互：
// - 搜索图标：切换搜索功能
// - 筛选图标：切换筛选面板
// - 胶囊项点击：展开详情底部弹窗
// - 胶囊项长按：显示快捷操作菜单
// - 左右滑动：触发对应操作
// ============================================================================

@Composable
fun CapsulesScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val drafts by viewModel.draftCapsules.collectAsState(initial = emptyList())
    val pending by viewModel.pendingCapsules.collectAsState(initial = emptyList())
    val archived by viewModel.archivedCapsules.collectAsState(initial = emptyList())

    // Combine all capsules
    val allCapsules = remember(drafts, pending, archived) {
        (drafts + pending + archived).sortedByDescending { it.timestamp }
    }

    // Filter state
    var selectedTypeFilter by remember { mutableStateOf<String?>(null) } // null = all, "text", "image", "audio"
    var selectedStatusFilter by remember { mutableStateOf<String?>(null) } // null = all, "DRAFT", "PENDING", "ARCHIVED"
    var showFavoritesOnly by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    // Bottom sheet state
    var selectedCapsule by remember { mutableStateOf<CapsuleEntity?>(null) }
    var isBottomSheetVisible by remember { mutableStateOf(false) }

    // Quick action menu state
    var quickActionMenuVisible by remember { mutableStateOf(false) }
    var quickActionCapsule by remember { mutableStateOf<CapsuleEntity?>(null) }
    var quickActionPosition by remember { mutableStateOf(Offset(0f, 0f)) }

    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
    }

    // Apply filters
    val filteredCapsules = remember(allCapsules, selectedTypeFilter, selectedStatusFilter, showFavoritesOnly, searchQuery) {
        allCapsules.filter { capsule ->
            val matchesType = selectedTypeFilter == null || capsule.type == selectedTypeFilter
            val matchesStatus = selectedStatusFilter == null || capsule.status == selectedStatusFilter
            val matchesFavorite = !showFavoritesOnly // For MVP, favorites not persisted
            val matchesSearch = searchQuery.isEmpty() ||
                (capsule.content?.contains(searchQuery, ignoreCase = true) == true)
            matchesType && matchesStatus && matchesFavorite && matchesSearch
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
                        text = "胶囊",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Search icon
                        IconButton(
                            onClick = { /* Toggle search */ }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "搜索",
                                tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                            )
                        }
                        // Filter icon
                        IconButton(
                            onClick = { /* Toggle filter */ }
                        ) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = "筛选",
                                tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Filter chips - Type
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            label = "全部",
                            isSelected = selectedTypeFilter == null,
                            onClick = { selectedTypeFilter = null }
                        )
                    }
                    item {
                        FilterChip(
                            label = "文字",
                            isSelected = selectedTypeFilter == "text",
                            onClick = { selectedTypeFilter = if (selectedTypeFilter == "text") null else "text" }
                        )
                    }
                    item {
                        FilterChip(
                            label = "图片",
                            isSelected = selectedTypeFilter == "image",
                            onClick = { selectedTypeFilter = if (selectedTypeFilter == "image") null else "image" }
                        )
                    }
                    item {
                        FilterChip(
                            label = "音频",
                            isSelected = selectedTypeFilter == "audio",
                            onClick = { selectedTypeFilter = if (selectedTypeFilter == "audio") null else "audio" }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Filter chips - Status
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            label = "草稿",
                            isSelected = selectedStatusFilter == "DRAFT",
                            onClick = { selectedStatusFilter = if (selectedStatusFilter == "DRAFT") null else "DRAFT" },
                            accentColor = Color(0xFF6B7280)
                        )
                    }
                    item {
                        FilterChip(
                            label = "待回港",
                            isSelected = selectedStatusFilter == "PENDING",
                            onClick = { selectedStatusFilter = if (selectedStatusFilter == "PENDING") null else "PENDING" },
                            accentColor = Color(0xFF3B82F6)
                        )
                    }
                    item {
                        FilterChip(
                            label = "已归档",
                            isSelected = selectedStatusFilter == "ARCHIVED",
                            onClick = { selectedStatusFilter = if (selectedStatusFilter == "ARCHIVED") null else "ARCHIVED" },
                            accentColor = Color(0xFF10B981)
                        )
                    }
                    item {
                        FilterChip(
                            label = "收藏",
                            isSelected = showFavoritesOnly,
                            onClick = { showFavoritesOnly = !showFavoritesOnly },
                            accentColor = Color(0xFFD97706)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Capsule count
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "共 ${filteredCapsules.size} 个胶囊",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Capsule list or empty state
                if (filteredCapsules.isEmpty()) {
                    CapsulesEmptyState(
                        hasFilters = selectedTypeFilter != null || selectedStatusFilter != null || showFavoritesOnly,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        itemsIndexed(
                            items = filteredCapsules,
                            key = { _, capsule -> capsule.id }
                        ) { index, capsule ->
                            SwipeableCapsuleItem(
                                capsule = capsule,
                                index = index,
                                onShowDetails = {
                                    selectedCapsule = capsule
                                    isBottomSheetVisible = true
                                },
                                onLongPress = { offset ->
                                    quickActionCapsule = capsule
                                    quickActionPosition = offset
                                    quickActionMenuVisible = true
                                },
                                onSwipeLeft = { /* Delete or Archive */ },
                                onSwipeRight = { /* Favorite or Resubmit */ }
                            )
                        }
                    }
                }
            }
        }

        // Bottom Sheet overlay
        if (isBottomSheetVisible && selectedCapsule != null) {
            CapsuleBottomSheet(
                capsule = selectedCapsule!!,
                onDismiss = {
                    isBottomSheetVisible = false
                    selectedCapsule = null
                },
                onDelete = { /* Handle delete */ },
                onFavorite = { /* Handle favorite */ },
                onChangeStatus = { /* Handle status change */ }
            )
        }

        // Quick Action Menu
        if (quickActionMenuVisible && quickActionCapsule != null) {
            QuickActionMenu(
                capsule = quickActionCapsule!!,
                position = quickActionPosition,
                onDismiss = {
                    quickActionMenuVisible = false
                    quickActionCapsule = null
                },
                onEdit = { /* Handle edit */ },
                onFavorite = { /* Handle favorite */ },
                onDelete = { /* Handle delete */ },
                onChangeStatus = { /* Handle status change */ }
            )
        }
    }
}

// ============================================================================
// FILTER CHIP - 筛选标签
// 
// 功能说明：
// - 用于筛选胶囊列表的标签按钮
// - 支持自定义强调色
// 
// 视觉状态：
// - 未选中：透明背景 + 深灰边框 + 深灰文字
// - 选中：强调色淡背景（20% 透明度）+ 强调色边框（50% 透明度）+ 强调色文字
// 
// 关键属性：
// - label：标签显示文字
// - isSelected：是否选中
// - onClick：点击回调
// - accentColor：自定义强调色，null 时使用主题色
// 
// 用户交互：
// - 点击切换选中状态
// ============================================================================

@Composable
private fun FilterChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    accentColor: Color? = null
) {
    val backgroundColor = if (isSelected) {
        (accentColor ?: MaterialTheme.colorScheme.primary).copy(alpha = 0.2f)
    } else {
        MaterialTheme.colorScheme.surface
    }

    val borderColor = if (isSelected) {
        (accentColor ?: MaterialTheme.colorScheme.primary).copy(alpha = 0.5f)
    } else {
        Color(0xFF2A2E37)
    }

    val textColor = if (isSelected) {
        accentColor ?: MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = backgroundColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            color = textColor,
            fontSize = 12.sp,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

// ============================================================================
// CAPSULES EMPTY STATE - 胶囊库空状态
// 
// 功能说明：
// - 当没有胶囊或筛选结果为空时显示的空状态
// - 根据是否有筛选条件显示不同提示
// 
// 两种状态：
// - 无筛选：[ 胶囊库空 ]，图标为收件箱，提示"创建你的第一枚胶囊"
// - 有筛选：[ 无匹配胶囊 ]，图标为筛选关闭，提示"没有胶囊符合当前筛选条件"
// 
// 动画效果：
// - 浮动动画：-8dp ~ 8dp，周期 2000ms
// - 缩放呼吸：0.95 ~ 1.05，周期 2000ms
// - 文字淡入：延迟 300ms，500ms 渐变
// 
// 用户交互：
// - 纯展示，无交互元素
// ============================================================================

@Composable
private fun CapsulesEmptyState(
    hasFilters: Boolean,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "capsules_empty_state")

    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
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
                imageVector = if (hasFilters) Icons.Default.FilterListOff else Icons.Default.Inbox,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f)
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
                    text = if (hasFilters) "[ 无匹配胶囊 ]" else "[ 胶囊库空 ]",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (hasFilters) "没有胶囊符合当前筛选条件" else "创建你的第一枚胶囊",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// ============================================================================
// SWIPEABLE CAPSULE ITEM - 可滑动的胶囊项
// 
// 功能说明：
// - 封装胶囊项，提供左右滑动操作
// - 支持长按和单击两种交互
// 
// 滑动操作：
// - 左滑（阈值 150dp）：删除或归档（取决于胶囊当前状态）
// - 右滑（阈值 150dp）：收藏或重新提交（取决于胶囊当前状态）
// - 最大滑动：225dp（1.5 倍阈值）
// 
// 滑动背景视觉：
// - 左滑背景：红色渐变（透明到 30% 红色），左侧显示删除/归档图标
// - 右滑背景：橙色渐变（透明到 30% 橙色），右侧显示收藏/提交图标
// - 图标和背景透明度随滑动进度渐变
// 
// 动画参数：
// - 回弹动画：弹簧阻尼 0.6，刚度 400
// - 滑动进度：offsetX / swipeThreshold，范围 -1 ~ 1
// 
// 手势冲突处理：
// - 水平拖拽和点击共存
// - 长按优先于单击
// 
// 用户交互：
// - 左滑：触发 onSwipeLeft
// - 右滑：触发 onSwipeRight
// - 长按：触发 onLongPress，传递按压坐标
// - 单击：触发 onShowDetails
// ============================================================================

@Composable
private fun SwipeableCapsuleItem(
    capsule: CapsuleEntity,
    index: Int,
    onShowDetails: () -> Unit,
    onLongPress: (Offset) -> Unit,
    onSwipeLeft: () -> Unit,
    onSwipeRight: () -> Unit
) {
    var offsetX by remember { mutableStateOf(0f) }
    val swipeThreshold = 150f

    val animatedOffset by animateFloatAsState(
        targetValue = offsetX,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
        label = "swipe_offset"
    )

    val swipeProgress by remember {
        derivedStateOf { (offsetX / swipeThreshold).coerceIn(-1f, 1f) }
    }

    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .offset(x = animatedOffset.dp)
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        when {
                            offsetX < -swipeThreshold -> {
                                // Swipe left - Delete or Archive
                                scope.launch {
                                    offsetX = -300f
                                    onSwipeLeft()
                                    offsetX = 0f
                                }
                            }
                            offsetX > swipeThreshold -> {
                                // Swipe right - Favorite or Resubmit
                                scope.launch {
                                    offsetX = 300f
                                    onSwipeRight()
                                    offsetX = 0f
                                }
                            }
                            else -> offsetX = 0f
                        }
                    },
                    onDragCancel = { offsetX = 0f },
                    onHorizontalDrag = { _, dragAmount ->
                        offsetX = (offsetX + dragAmount).coerceIn(-swipeThreshold * 1.5f, swipeThreshold * 1.5f)
                    }
                )
            }
                .pointerInput(Unit) {
                detectTapGestures(
                    onLongPress = { offset ->
                        onLongPress(offset)
                    },
                    onTap = { onShowDetails() }
                )
            }
    ) {
        // Left swipe background (Delete/Archive)
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            Color(0xFFEF4444).copy(alpha = swipeProgress.coerceIn(0f, 1f) * 0.3f),
                            Color.Transparent
                        )
                    )
                )
                .padding(start = 16.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            if (offsetX < 0) {
                Icon(
                    imageVector = if (capsule.status == "ARCHIVED") Icons.Default.Delete else Icons.Default.Archive,
                    contentDescription = if (capsule.status == "ARCHIVED") "删除" else "归档",
                    tint = Color(0xFFEF4444).copy(alpha = swipeProgress.coerceIn(0f, 1f)),
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        // Right swipe background (Favorite/Resubmit)
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color(0xFFD97706).copy(alpha = swipeProgress.coerceIn(0f, 1f) * 0.3f)
                        )
                    )
                )
                .padding(end = 16.dp),
            contentAlignment = Alignment.CenterEnd
        ) {
            if (offsetX > 0) {
                Icon(
                    imageVector = if (capsule.status == "PENDING") Icons.Default.Favorite else Icons.Default.Send,
                    contentDescription = if (capsule.status == "PENDING") "收藏" else "重新提交",
                    tint = Color(0xFFD97706).copy(alpha = swipeProgress.coerceIn(0f, 1f)),
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        AnimatedCapsuleItem(
            capsule = capsule,
            index = index
        )
    }
}

// ============================================================================
// ANIMATED CAPSULE ITEM - 动画胶囊项
// 
// 功能说明：
// - 为胶囊项提供入场和出场动画
// - 列表中的每个胶囊依次延迟入场，形成瀑布效果
// 
// 入场动画：
// - 延迟：index * 40ms（比 DockQueueScreen 的 50ms 更快）
// - 淡入：300ms，FastOutSlowInEasing
// - 向上滑入：初始偏移为自身高度的 1/3，弹簧阻尼 0.8
// 
// 出场动画：
// - 淡出：200ms
// 
// 用户交互：
// - 无，直接使用内部 CapsuleCard
// ============================================================================

@Composable
private fun AnimatedCapsuleItem(
    capsule: CapsuleEntity,
    index: Int
) {
    var visible by remember { mutableStateOf(false) }

    LaunchedEffect(capsule.id) {
        delay(index * 40L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(
            animationSpec = tween(300, easing = FastOutSlowInEasing)
        ) + slideInVertically(
            initialOffsetY = { it / 3 },
            animationSpec = spring(dampingRatio = 0.8f, stiffness = 300f)
        ),
        exit = fadeOut(tween(200))
    ) {
        CapsuleCard(capsule = capsule)
    }
}

// ============================================================================
// CAPSULE CARD - 胶囊卡片
// 
// 功能说明：
// - 以卡片形式展示胶囊的摘要信息
// - 显示类型图标、内容预览、时间戳、状态标签和同步状态
// 
// 视觉元素：
// - 左侧：类型图标（40dp 圆角背景）
//   - 文字：文档图标
//   - 图片：图片图标
//   - 音频：麦克风图标
// - 内容：最多两行文本，超出省略
// - 元数据行：时间戳 + 状态徽章 + 同步图标
// - 右侧： chevron 图标
// 
// 状态颜色：
// - DRAFT（草稿）：灰色（0xFF6B7280）
// - PENDING（待回港）：蓝色（0xFF3B82F6）
// - ARCHIVED（已归档）：绿色（0xFF10B981）
// 
// 按压缩放反馈：
// - 按下：缩放至 0.98，阴影高度 8dp
// - 释放：恢复缩放至 1.0，阴影高度 2dp
// - 动画：弹簧阻尼 0.6，刚度 500
// 
// 同步状态图标：
// - 已归档（ARCHIVED）：CloudDone 图标，绿色
// - 其他状态：CloudOff 图标，灰色半透明
// 
// 用户交互：
// - 点击：无操作（点击事件由 SwipeableCapsuleItem 处理）
// ============================================================================

@Composable
private fun CapsuleCard(capsule: CapsuleEntity) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

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

    // Status colors
    val statusColor = when (capsule.status) {
        "DRAFT" -> Color(0xFF6B7280) // Gray
        "PENDING" -> Color(0xFF3B82F6) // Blue
        "ARCHIVED" -> Color(0xFF10B981) // Green
        else -> Color(0xFF6B7280)
    }

    // Type icon
    val typeIcon = when (capsule.type) {
        "text" -> Icons.Default.Description
        "image" -> Icons.Default.Image
        "audio" -> Icons.Default.Mic
        else -> Icons.Default.Circle
    }

    // Sync status
    val isSynced = capsule.status == "ARCHIVED"

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = elevation,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .border(1.dp, statusColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) { }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Type icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = typeIcon,
                    contentDescription = capsule.type,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Content and metadata
            Column(modifier = Modifier.weight(1f)) {
                // Content preview
                Text(
                    text = capsule.content ?: "[${capsule.type.uppercase()}]",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 14.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Metadata row
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Timestamp
                    Text(
                        text = formatTimestamp(capsule.timestamp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )

                    // Status badge
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = statusColor.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = when (capsule.status) {
                                "DRAFT" -> "草稿"
                                "PENDING" -> "待回港"
                                "ARCHIVED" -> "已归档"
                                else -> capsule.status
                            },
                            color = statusColor,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    // Sync status
                    if (isSynced) {
                        Icon(
                            imageVector = Icons.Default.CloudDone,
                            contentDescription = "已同步",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(14.dp)
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.CloudOff,
                            contentDescription = "未同步",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            // Chevron
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

// ============================================================================
// CAPSULE BOTTOM SHEET - 胶囊详情底部弹窗
// 
// 功能说明：
// - 以底部弹窗形式展示胶囊的完整详情
// - 占据屏幕 70% 高度
// 
// 视觉布局：
// - 顶部：拖动条 + 类型图标 + 标题 + 关闭按钮
// - 信息区：类型/ID/状态标签行 + 创建时间
// - 内容区：胶囊内容文本（可滚动）
// - 备注区：备注文本（可编辑占位）
// - 底部：操作按钮行 + 关闭按钮
// 
// 操作按钮：
// - 删除/恢复：根据当前状态显示删除或恢复按钮（红色）
// - 收藏：收藏/取消收藏按钮（橙色）
// - 编辑：仅待回港状态显示（主题色）
// - 关闭：关闭弹窗按钮
// 
// 动画效果：
// - 入场：从底部滑入 + 淡入，弹簧阻尼 0.85
// - 出场：向底部滑出 + 淡出
// - 背景遮罩：黑色 60% 透明度，点击可关闭
// 
// 用户交互：
// - 点击背景：关闭弹窗
// - 点击各操作按钮：触发对应回调
// ============================================================================

@Composable
fun CapsuleBottomSheet(
    capsule: CapsuleEntity,
    onDismiss: () -> Unit,
    onDelete: () -> Unit,
    onFavorite: () -> Unit,
    onChangeStatus: (String) -> Unit
) {
    val sheetHeightFraction = 0.7f

    Box(modifier = Modifier.fillMaxSize()) {
        // Backdrop
        AnimatedVisibility(
            visible = true,
            enter = fadeIn(tween(300)),
            exit = fadeOut(tween(300))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { onDismiss() }
            )
        }

        // Sheet
        AnimatedVisibility(
            visible = true,
            enter = slideInVertically(
                initialOffsetY = { (it * sheetHeightFraction).toInt() },
                animationSpec = spring(dampingRatio = 0.85f, stiffness = 300f)
            ) + fadeIn(tween(300)),
            exit = slideOutVertically(
                targetOffsetY = { (it * sheetHeightFraction).toInt() },
                animationSpec = tween(300)
            ) + fadeOut(tween(300)),
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(sheetHeightFraction),
                shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 16.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp)
                ) {
                    // Handle bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(
                                Color.Gray.copy(alpha = 0.4f),
                                shape = RoundedCornerShape(2.dp)
                            )
                            .align(Alignment.CenterHorizontally)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Type icon
                            val typeIcon = when (capsule.type) {
                                "text" -> Icons.Default.Description
                                "image" -> Icons.Default.Image
                                "audio" -> Icons.Default.Mic
                                else -> Icons.Default.Circle
                            }
                            Icon(
                                imageVector = typeIcon,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "胶囊详情",
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "关闭",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = Color(0xFF2A2E37))
                    Spacer(modifier = Modifier.height(16.dp))

                    // Content area (scrollable)
                    Column(modifier = Modifier.weight(1f)) {
                        // Info chips
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            CapsuleDetailChip(label = "类型", value = capsule.type.uppercase())
                            CapsuleDetailChip(label = "ID", value = "#${capsule.id}")
                            CapsuleDetailChip(
                                label = "状态",
                                value = when (capsule.status) {
                                    "DRAFT" -> "草稿"
                                    "PENDING" -> "待回港"
                                    "ARCHIVED" -> "已归档"
                                    else -> capsule.status
                                }
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Timestamp
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "创建时间",
                                fontFamily = FontFamily.Monospace,
                                color = Color.Gray,
                                fontSize = 12.sp
                            )
                            Text(
                                text = formatTimestamp(capsule.timestamp),
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 12.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Content
                        Text(
                            text = "内容",
                            fontFamily = FontFamily.Monospace,
                            color = Color.Gray,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = capsule.content ?: "[${capsule.type.uppercase()} 文件]",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 14.sp,
                            lineHeight = 22.sp
                        )

                        // Notes field placeholder
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "备注",
                            fontFamily = FontFamily.Monospace,
                            color = Color.Gray,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.background,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2A2E37)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = capsule.lastInputHint ?: "点击添加备注...",
                                fontFamily = FontFamily.Monospace,
                                color = if (capsule.lastInputHint != null)
                                    MaterialTheme.colorScheme.onSurface
                                else
                                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                fontSize = 14.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Action buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Delete/Restore button
                        OutlinedButton(
                            onClick = onDelete,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFFEF4444)
                            )
                        ) {
                            Icon(
                                imageVector = if (capsule.status == "ARCHIVED") Icons.Default.Restore else Icons.Default.Delete,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (capsule.status == "ARCHIVED") "恢复" else "删除",
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        // Favorite/Unfavorite button
                        OutlinedButton(
                            onClick = onFavorite,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFFD97706)
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Favorite,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "收藏", fontFamily = FontFamily.Monospace)
                        }

                        // Re-submit button (only for pending)
                        if (capsule.status == "PENDING") {
                            Button(
                                onClick = { onChangeStatus("DRAFT") },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "编辑", fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Close button
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.surface,
                            contentColor = MaterialTheme.colorScheme.onSurface
                        )
                    ) {
                        Text(text = "关闭", fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }
    }
}

// ============================================================================
// QUICK ACTION MENU - 快捷操作菜单
// 
// 功能说明：
// - 长按胶囊项时弹出的浮动操作菜单
// - 显示在按压位置附近
// 
// 菜甲选项：
// - 编辑：打开编辑界面
// - 收藏：切换收藏状态
// - 归档/取消归档：根据当前状态切换归档状态
// - 删除：删除胶囊（红色高亮）
// 
// 视觉设计：
// - 背景遮罩：黑色 40% 透明度，点击关闭菜单
// - 菜单卡片：圆角 12dp，带阴影
// - 菜甲项：图标 + 文字水平排列
// - 删除项：红色文字和图标，分隔线分隔
// 
// 菜甲项位置：
// - 水平：position.x - 80，尽量靠左但不小于 16dp
// - 垂直：跟随按压位置 y 坐标
// 
// 用户交互：
// - 点击背景：关闭菜单
// - 点击菜单项：执行对应操作后自动关闭
// ============================================================================

@Composable
private fun QuickActionMenu(
    capsule: CapsuleEntity,
    position: Offset,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onFavorite: () -> Unit,
    onDelete: () -> Unit,
    onChangeStatus: (String) -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Backdrop
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.4f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { onDismiss() }
        )

        // Menu
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 8.dp,
            modifier = Modifier
                .align(Alignment.TopStart)
                .offset(x = (position.x - 80).coerceAtLeast(16f).dp, y = position.y.dp)
        ) {
            Column(
                modifier = Modifier.padding(8.dp)
            ) {
                QuickActionMenuItem(
                    icon = Icons.Default.Edit,
                    label = "编辑",
                    onClick = {
                        onEdit()
                        onDismiss()
                    }
                )
                QuickActionMenuItem(
                    icon = Icons.Default.Favorite,
                    label = "收藏",
                    onClick = {
                        onFavorite()
                        onDismiss()
                    }
                )
                QuickActionMenuItem(
                    icon = if (capsule.status == "ARCHIVED") Icons.Default.Unarchive else Icons.Default.Archive,
                    label = if (capsule.status == "ARCHIVED") "取消归档" else "归档",
                    onClick = {
                        onChangeStatus(if (capsule.status == "ARCHIVED") "PENDING" else "ARCHIVED")
                        onDismiss()
                    }
                )
                Divider(
                    color = Color(0xFF2A2E37),
                    modifier = Modifier.padding(vertical = 4.dp)
                )
                QuickActionMenuItem(
                    icon = Icons.Default.Delete,
                    label = "删除",
                    onClick = {
                        onDelete()
                        onDismiss()
                    },
                    isDestructive = true
                )
            }
        }
    }
}

// ============================================================================
// QUICK ACTION MENU ITEM - 快捷菜单项
// 
// 功能说明：
// - 快捷菜单中的单个操作项
// 
// 视觉状态：
// - 普通项：主题色图标 + 主题色文字
// - 危险项（isDestructive=true）：红色图标 + 红色文字
// 
// 关键属性：
// - icon：操作图标
// - label：操作文字
// - onClick：点击回调
// - isDestructive：是否为危险操作（删除等）
// 
// 用户交互：
// - 点击：触发 onClick
// ============================================================================

@Composable
private fun QuickActionMenuItem(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    isDestructive: Boolean = false
) {
    val textColor = if (isDestructive) Color(0xFFEF4444) else MaterialTheme.colorScheme.onSurface

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = textColor,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            color = textColor,
            fontSize = 14.sp
        )
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

private fun formatTimestamp(timestamp: Long): String {
    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(timestamp))
}

// Offset class for long press position
data class Offset(val x: Float, val y: Float)
