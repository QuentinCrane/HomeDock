package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.ui.MainViewModel
import kotlinx.coroutines.delay

// ============================================================================
// BASE MAP SCREEN - 基地地图屏幕
// 
// 屏幕功能：
// - 显示 4 个舱室的状态：投放舱、主工作台、辅助舱、回港痕迹
// - 显示基地连接状态
// - 显示每个舱室的胶囊数量
// - 活跃舱室显示脉冲动画
// 
// 状态管理：
// - isConnected：基地是否已连接
// - baseIp：基地 IP 地址
// - capsuleCounts：每个舱室的胶囊数量
// 
// 用户交互：
// - 点击舱室：可查看舱室详情（本版本仅展示）
// ============================================================================

@Composable
fun BaseMapScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val baseIp by viewModel.baseIp.collectAsState()
    val isConnected = baseIp != null

    // Room data - in real app these would come from ViewModel/repository
    val rooms = remember {
        listOf(
            BaseRoom(
                id = "launch_bay",
                name = "Launch Bay",
                nameZh = "投放舱",
                icon = Icons.Default.Send,
                capsuleCount = 0, // Would come from repository
                isActive = false
            ),
            BaseRoom(
                id = "main_workstation",
                name = "Main Workstation",
                nameZh = "主工作台",
                icon = Icons.Default.Computer,
                capsuleCount = 0,
                isActive = false
            ),
            BaseRoom(
                id = "auxiliary_cabin",
                name = "Auxiliary Cabin",
                nameZh = "辅助舱",
                icon = Icons.Default.Storage,
                capsuleCount = 0,
                isActive = false
            ),
            BaseRoom(
                id = "return_trace",
                name = "Return Trace",
                nameZh = "回港痕迹",
                icon = Icons.Default.History,
                capsuleCount = 0,
                isActive = false
            )
        )
    }

    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
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
                Text(
                    text = "基地地图",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Connection Status Card
                ConnectionStatusCard(
                    isConnected = isConnected,
                    baseIp = baseIp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Rooms Grid
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Top row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        RoomCard(
                            room = rooms[0],
                            modifier = Modifier.weight(1f)
                        )
                        RoomCard(
                            room = rooms[1],
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Bottom row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        RoomCard(
                            room = rooms[2],
                            modifier = Modifier.weight(1f)
                        )
                        RoomCard(
                            room = rooms[3],
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Footer
                Text(
                    text = "[ 基地状态监控系统 ]",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                    fontSize = 12.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

// ============================================================================
// CONNECTION STATUS CARD - 连接状态卡片
// 
// 功能说明：
// - 显示基地连接状态
// - 已连接时显示绿色脉冲动画
// - 未连接时显示灰色状态
// 
// 视觉元素：
// - 状态指示灯：圆形，绿色脉冲=已连接，灰色=未连接
// - 连接状态文字：已连接/未发现基地
// - IP 地址显示（如果已连接）
// 
// 动画效果：
// - 已连接时指示灯脉冲：alpha 0.6 -> 1.0，2000ms 循环
// ============================================================================

@Composable
private fun ConnectionStatusCard(
    isConnected: Boolean,
    baseIp: String?
) {
    val infiniteTransition = rememberInfiniteTransition(label = "connection_pulse")

    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = if (isConnected) 0.6f else 0.3f,
        targetValue = if (isConnected) 1.0f else 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_alpha"
    )

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Pulsing status indicator
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(
                        color = if (isConnected) Color(0xFF10B981).copy(alpha = pulseAlpha) else Color(0xFF6B7280),
                        shape = CircleShape
                    )
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (isConnected) "基地已连接" else "未发现基地",
                    fontFamily = FontFamily.Monospace,
                    color = if (isConnected) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )

                if (isConnected && baseIp != null) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = baseIp,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        fontSize = 12.sp
                    )
                }
            }

            Icon(
                imageVector = if (isConnected) Icons.Default.SatelliteAlt else Icons.Default.SignalWifiOff,
                contentDescription = null,
                tint = if (isConnected) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

// ============================================================================
// ROOM CARD - 舱室卡片
// 
// 功能说明：
// - 显示单个舱室的状态信息
// - 包含舱室图标、名称、胶囊数量
// - 活跃舱室显示脉冲边框动画
// 
// 视觉元素：
// - 图标：32dp，主题色
// - 舱室名称：中文，副色
// - 胶囊数量：大号数字，主色
// - 状态指示：右上角小圆点
// 
// 动画效果：
// - 活跃舱室：边框颜色脉冲动画
// - 按压反馈：缩放至 0.96，阴影变化
// 
// 关键属性：
// - room：舱室数据
// - modifier：额外的修饰符
// 
// 用户交互：
// - 点击：触发 onClick（本版本无操作）
// ============================================================================

@Composable
private fun RoomCard(
    room: BaseRoom,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val infiniteTransition = rememberInfiniteTransition(label = "room_pulse_${room.id}")

    // Border pulse animation for active rooms
    val borderAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "border_pulse"
    )

    // Press scale animation
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.96f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
        label = "press_scale"
    )

    val borderColor = if (room.isActive) {
        MaterialTheme.colorScheme.primary.copy(alpha = borderAlpha)
    } else {
        Color(0xFF2A2E37)
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        shadowElevation = if (isPressed) 4.dp else 2.dp,
        modifier = modifier
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = { /* View room details - future feature */ }
            )
    ) {
        Box(modifier = Modifier.padding(16.dp)) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Room icon
                Icon(
                    imageVector = room.icon,
                    contentDescription = room.nameZh,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(32.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Room name in Chinese
                Text(
                    text = room.nameZh,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.secondary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Capsule count
                Row(
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = room.capsuleCount.toString(),
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "胶囊",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Status indicator
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                color = if (room.isActive) Color(0xFF10B981) else Color(0xFF6B7280),
                                shape = CircleShape
                            )
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (room.isActive) "活跃" else "空闲",
                        fontFamily = FontFamily.Monospace,
                        color = if (room.isActive) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        fontSize = 10.sp
                    )
                }
            }

            // Active indicator glow effect
            if (room.isActive) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(8.dp)
                        .background(
                            color = Color(0xFF10B981).copy(alpha = borderAlpha),
                            shape = CircleShape
                        )
                )
            }
        }
    }
}

// ============================================================================
// BASE ROOM DATA CLASS - 舱室数据类
// 
// 数据结构：
// - id：舱室唯一标识符
// - name：舱室英文名称
// - nameZh：舱室中文名称
// - icon：舱室图标
// - capsuleCount：舱室内胶囊数量
// - isActive：舱室是否活跃（有内容）
// ============================================================================

data class BaseRoom(
    val id: String,
    val name: String,
    val nameZh: String,
    val icon: ImageVector,
    val capsuleCount: Int,
    val isActive: Boolean
)
