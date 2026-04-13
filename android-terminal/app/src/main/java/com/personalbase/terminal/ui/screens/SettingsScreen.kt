package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
// SETTINGS SCREEN - 设置屏幕
// 
// 屏幕功能：
// - 连接与同步：主基地状态、自动发现、重试策略
// - 体验：静音模式、动画强度、触感反馈、声音反馈
// - 内容：自动保存草稿、图片压缩、录音质量
// - 关于：版本信息、应用描述
// 
// 状态管理：
// - autoDiscoverBase：是否自动发现基地（默认 true）
// - silentMode：静音模式（默认 false）
// - animationIntensity：动画强度（full/light/minimal）
// - hapticFeedback：触感反馈（默认 true）
// - soundFeedback：声音反馈（默认 true）
// - autoSaveDraft：自动保存草稿（默认 true）
// - imageCompression：图片压缩（默认 true）
// - recordingQuality：录音质量（high/medium/low）
// - syncRetryStrategy：重试策略（1/3/5/∞）
// 
// 用户交互：
// - 点击主基地状态：弹出手动 IP 设置对话框
// - 切换开关：即时更新对应状态
// - 选择分段项：即时更新对应状态
// ============================================================================

@Composable
fun SettingsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier,
    isDarkTheme: Boolean = true,
    onToggleTheme: (() -> Unit)? = null
) {
    val baseIp by viewModel.baseIp.collectAsState()
    val todoSyncState by viewModel.todoSyncState.collectAsState()

    var manualIpInput by remember { mutableStateOf("") }
    var showIpDialog by remember { mutableStateOf(false) }

    // Settings state from ViewModel
    val hapticFeedback by viewModel.hapticEnabled.collectAsState()
    val soundFeedback by viewModel.soundEnabled.collectAsState()
    val animationIntensity by viewModel.animationIntensity.collectAsState()
    val autoSaveDraft by viewModel.autoSaveDraft.collectAsState()
    val imageCompression by viewModel.imageCompression.collectAsState()
    val recordingQuality by viewModel.recordingQuality.collectAsState()
    val autoDiscoverBase by viewModel.autoDiscoverBase.collectAsState()
    val syncRetryStrategy by viewModel.syncRetryStrategy.collectAsState()
    val silentMode by viewModel.silentMode.collectAsState()
    
    // 颜色定制状态
    val primaryColor by viewModel.primaryColor.collectAsState()
    val secondaryColor by viewModel.secondaryColor.collectAsState()
    val borderRadius by viewModel.borderRadius.collectAsState()

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
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Text(
                    text = "设置",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // =================================================================
                // SECTION 1: CONNECTION & SYNC (连接与同步)
                // =================================================================
                SettingsSection(title = "连接与同步") {
                    // Current base status
                    SettingsItemWithIndicator(
                        icon = Icons.Default.Wifi,
                        title = "主基地状态",
                        subtitle = baseIp ?: "未发现基地 (自动发现)",
                        isConnected = baseIp != null,
                        onClick = { showIpDialog = true }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Last successful return time
                    SettingsItem(
                        icon = Icons.Default.History,
                        title = "上次成功回港",
                        subtitle = "2024-04-10 14:32",
                        onClick = { }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Auto-discover base toggle
                    SettingsToggleItem(
                        icon = Icons.Default.CellTower,
                        title = "自动发现基地",
                        subtitle = "通过 mDNS 广播自动搜索主基地",
                        isChecked = autoDiscoverBase,
                        onCheckedChange = { viewModel.setAutoDiscoverBase(it) }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Sync retry strategy
                    SettingsSegmentItem(
                        icon = Icons.Default.Repeat,
                        title = "同步失败重试策略",
                        subtitle = "同步失败时的最大重试次数",
                        options = listOf("1", "3", "5", "∞"),
                        selectedOption = syncRetryStrategy,
                        onOptionSelected = { viewModel.setSyncRetryStrategy(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Manual IP input hint
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF2A2E37), MaterialTheme.shapes.small)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "如需手动设置，点击上方主基地状态",
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // =================================================================
                // SECTION 2: EXPERIENCE (体验)
                // =================================================================
                SettingsSection(title = "体验") {
                    // Silent mode toggle
                    SettingsToggleItem(
                        icon = Icons.Default.VolumeOff,
                        title = "静音模式",
                        subtitle = "关闭所有声音和提示音",
                        isChecked = silentMode,
                        onCheckedChange = { viewModel.setSilentMode(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Animation intensity
                    SettingsSegmentItem(
                        icon = Icons.Default.Speed,
                        title = "动画强度",
                        subtitle = "界面动画的复杂程度",
                        options = listOf("完整", "轻量", "极简"),
                        selectedOption = animationIntensity,
                        onOptionSelected = { viewModel.setAnimationIntensity(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Animation intensity visual preview
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(4.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AnimationPreviewDot(
                                label = "完整",
                                isSelected = animationIntensity == "full",
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary,
                                    MaterialTheme.colorScheme.secondary,
                                    Color(0xFFD97706)
                                )
                            )
                            AnimationPreviewDot(
                                label = "轻量",
                                isSelected = animationIntensity == "light",
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.6f),
                                    MaterialTheme.colorScheme.secondary.copy(alpha = 0.6f)
                                )
                            )
                            AnimationPreviewDot(
                                label = "极简",
                                isSelected = animationIntensity == "minimal",
                                colors = listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Haptic feedback toggle
                    SettingsToggleItem(
                        icon = Icons.Default.Vibration,
                        title = "触感反馈",
                        subtitle = "按钮和交互的振动反馈",
                        isChecked = hapticFeedback,
                        onCheckedChange = { viewModel.setHapticEnabled(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Sound feedback toggle
                    SettingsToggleItem(
                        icon = Icons.Default.VolumeUp,
                        title = "声音反馈",
                        subtitle = "操作成功或失败的提示音",
                        isChecked = soundFeedback,
                        onCheckedChange = { viewModel.setSoundEnabled(it) }
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))

                    // Dark mode toggle
                    SettingsToggleItem(
                        icon = if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
                        title = "深色模式",
                        subtitle = if (isDarkTheme) "当前：深色主题" else "当前：浅色主题",
                        isChecked = isDarkTheme,
                        onCheckedChange = { onToggleTheme?.invoke() }
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // =================================================================
                // SECTION 3: COLOR CUSTOMIZATION (颜色定制)
                // =================================================================
                SettingsSection(title = "颜色定制") {
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2A2E37)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp)
                        ) {
                            ColorCustomizationSection(
                                primaryColor = primaryColor,
                                onPrimaryColorChange = { viewModel.setPrimaryColor(it) },
                                secondaryColor = secondaryColor,
                                onSecondaryColorChange = { viewModel.setSecondaryColor(it) },
                                borderRadius = borderRadius,
                                onBorderRadiusChange = { viewModel.setBorderRadius(it) }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // =================================================================
                // SECTION 4: CONTENT (内容)
                // =================================================================
                SettingsSection(title = "内容") {
                    // Auto-save draft toggle
                    SettingsToggleItem(
                        icon = Icons.Default.Save,
                        title = "自动保存草稿",
                        subtitle = "创建胶囊时自动保存为草稿",
                        isChecked = autoSaveDraft,
                        onCheckedChange = { viewModel.setAutoSaveDraft(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Image compression toggle
                    SettingsToggleItem(
                        icon = Icons.Default.Compress,
                        title = "图片压缩",
                        subtitle = "上传前压缩图片以节省流量",
                        isChecked = imageCompression,
                        onCheckedChange = { viewModel.setImageCompression(it) }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Recording quality
                    SettingsSegmentItem(
                        icon = Icons.Default.Mic,
                        title = "录音质量",
                        subtitle = "音频录制的质量等级",
                        options = listOf("高", "中", "低"),
                        selectedOption = recordingQuality,
                        onOptionSelected = { viewModel.setRecordingQuality(it) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Recording quality info
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(4.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = when (recordingQuality) {
                                    "高" -> "高质量: 128kbps, ~1MB/分钟"
                                    "中" -> "中质量: 64kbps, ~500KB/分钟"
                                    else -> "低质量: 32kbps, ~250KB/分钟"
                                },
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // =================================================================
                // ABOUT SECTION
                // =================================================================
                SettingsSection(title = "关于") {
                    SettingsItem(
                        icon = Icons.Default.Info,
                        title = "回港终端",
                        subtitle = "版本 1.0.0",
                        onClick = { }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // App description
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(4.dp))
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp)
                        ) {
                            Text(
                                text = "个人基地 / 回港系统",
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "局域网闭环的个人数据系统，用于采集和归档胶囊数据。",
                                fontFamily = FontFamily.Monospace,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Footer
                Text(
                    text = "[ 舱室系统 v1.0 ]",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                    fontSize = 12.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // Manual IP Dialog
        if (showIpDialog) {
            ManualIpDialog(
                currentIp = baseIp,
                onDismiss = { showIpDialog = false },
                onConfirm = { ip ->
                    viewModel.setManualIp(ip)
                    showIpDialog = false
                }
            )
        }
    }
}

// ============================================================================
// SETTINGS SECTION - 设置分组区块
// 
// 功能说明：
// - 将相关设置项分组显示
// - 每个分组有统一的标题
// 
// 视觉设计：
// - 分组标题：副色、小字号、等宽字体
// - 内容区：标题下方 8dp 间距
// 
// 关键属性：
// - title：分组标题文本
// - content：分组内的设置项 Composable
// 
// 用户交互：
// - 无交互，仅作为布局容器
// ============================================================================

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = title,
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.secondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        content()
    }
}

// ============================================================================
// SETTINGS ITEM WITH INDICATOR - 带状态指示器的设置项
// 
// 功能说明：
// - 显示设置项的名称、副标题和状态指示灯
// - 点击可触发操作（如打开对话框）
// 
// 视觉元素：
// - 左侧：圆形状态指示灯（绿色=已连接，灰色=未连接）
// - 图标：24dp，主题色
// - 标题：设置项名称
// - 副标题：设置项说明或当前值
// - 按压反馈：缩放 + 阴影变化
// 
// 状态颜色：
// - 已连接（isConnected=true）：指示灯绿色（0xFF10B981），副标题绿色
// - 未连接（isConnected=false）：指示灯灰色（0xFF6B7280），副标题灰色
// 
// 按压缩放反馈：
// - 按下：缩放至 0.98，阴影高度 4dp
// - 释放：恢复缩放至 1.0，阴影高度 1dp
// - 动画：弹簧阻尼 0.6，刚度 500
// 
// 用户交互：
// - 点击：触发 onClick
// ============================================================================

@Composable
private fun SettingsItemWithIndicator(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isConnected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
        label = "press_scale"
    )

    Surface(
        shape = RoundedCornerShape(4.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = if (isPressed) 4.dp else 1.dp,
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status indicator
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(
                        color = if (isConnected) Color(0xFF10B981) else Color(0xFF6B7280),
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
            )

            Spacer(modifier = Modifier.width(12.dp))

            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 14.sp
                )
                Text(
                    text = subtitle,
                    fontFamily = FontFamily.Monospace,
                    color = if (isConnected) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// ============================================================================
// SETTINGS ITEM - 设置项
// 
// 功能说明：
// - 显示设置项的名称和副标题
// - 点击可触发操作或查看更多信息
// 
// 视觉元素：
// - 图标：24dp，主题色
// - 标题：设置项名称
// - 副标题：设置项说明或当前值
// - 按压反馈：缩放 + 阴影变化
// 
// 按压缩放反馈：
// - 按下：缩放至 0.98，阴影高度 4dp
// - 释放：恢复缩放至 1.0，阴影高度 1dp
// - 动画：弹簧阻尼 0.6，刚度 500
// 
// 用户交互：
// - 点击：触发 onClick
// ============================================================================

@Composable
private fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
        label = "press_scale"
    )

    Surface(
        shape = RoundedCornerShape(4.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = if (isPressed) 4.dp else 1.dp,
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 14.sp
                )
                Text(
                    text = subtitle,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

// ============================================================================
// SETTINGS TOGGLE ITEM - 设置开关项
// 
// 功能说明：
// - 提供开关类型的设置项
// - 点击任意位置切换开关状态
// 
// 视觉元素：
// - 图标：24dp，主题色
// - 标题：设置项名称
// - 副标题：设置项说明
// - 开关：Material Switch 组件
// - 按压反馈：缩放 + 阴影变化
// 
// 开关颜色：
// - 选中：主题色滑块 + 30% 透明度轨道
// - 未选中：灰色滑块（0xFF6B7280）+ 深灰轨道（0xFF374151）
// 
// 按压缩放反馈：
// - 按下：缩放至 0.98，阴影高度 4dp
// - 释放：恢复缩放至 1.0，阴影高度 1dp
// - 动画：弹簧阻尼 0.6，刚度 500
// 
// 用户交互：
// - 点击任意位置：切换开关状态，触发 onCheckedChange
// ============================================================================

@Composable
private fun SettingsToggleItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(dampingRatio = 0.6f, stiffness = 500f),
        label = "press_scale"
    )

    Surface(
        shape = RoundedCornerShape(4.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = if (isPressed) 4.dp else 1.dp,
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null
            ) { onCheckedChange(!isChecked) }
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 14.sp
                )
                Text(
                    text = subtitle,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Switch(
                checked = isChecked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = MaterialTheme.colorScheme.primary,
                    checkedTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
                    uncheckedThumbColor = Color(0xFF6B7280),
                    uncheckedTrackColor = Color(0xFF374151)
                )
            )
        }
    }
}

// ============================================================================
// SETTINGS SEGMENT ITEM - 分段选择设置项
// 
// 功能说明：
// - 提供多选项分段选择（如动画强度、录音质量）
// - 同时显示标题和副标题
// 
// 视觉布局：
// - 顶部行：图标 + 标题 + 副标题
// - 底部行：分段按钮组
// 
// 分段按钮：
// - 等宽排列，平分容器宽度
// - 选中：主题色背景（20%）+ 主题色边框（50%）+ 主题色文字
// - 未选中：透明背景 + 深灰边框（0xFF2A2E37）+ 深灰文字
// 
// 关键属性：
// - icon：设置项图标
// - title：设置项标题
// - subtitle：设置项说明
// - options：选项列表
// - selectedOption：当前选中项
// - onOptionSelected：选中项变化回调
// 
// 用户交互：
// - 点击分段按钮：选中对应选项，触发 onOptionSelected
// ============================================================================

@Composable
private fun SettingsSegmentItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    options: List<String>,
    selectedOption: String,
    onOptionSelected: (String) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(4.dp),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2A2E37)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = title,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp
                    )
                    Text(
                        text = subtitle,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Segment buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                options.forEach { option ->
                    SegmentButton(
                        label = option,
                        isSelected = selectedOption == option,
                        onClick = { onOptionSelected(option) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

// ============================================================================
// SEGMENT BUTTON - 分段按钮
// 
// 功能说明：
// - 分段选择组中的单个按钮
// - 用于在多个选项中选择一个
// 
// 视觉状态：
// - 选中：主题色背景（20%）+ 主题色边框（50%）+ 主题色文字
// - 未选中：透明背景 + 深灰边框（0xFF2A2E37）+ 深灰文字（70% 透明度）
// 
// 关键属性：
// - label：按钮文字
// - isSelected：是否选中
// - onClick：点击回调
// - modifier：额外的修饰符
// 
// 用户交互：
// - 点击：触发 onClick
// ============================================================================

@Composable
private fun SegmentButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor = if (isSelected) {
        MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
    } else {
        MaterialTheme.colorScheme.background
    }

    val borderColor = if (isSelected) {
        MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
    } else {
        Color(0xFF2A2E37)
    }

    val textColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
    }

    Surface(
        shape = RoundedCornerShape(4.dp),
        color = backgroundColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            color = textColor,
            fontSize = 12.sp,
            modifier = Modifier
                .padding(horizontal = 8.dp, vertical = 6.dp)
                .fillMaxWidth(),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    }
}

// ============================================================================
// ANIMATION PREVIEW DOT - 动画强度预览点
// 
// 功能说明：
// - 可视化展示动画强度的预览效果
// - 作为动画强度选择的视觉辅助说明
// 
// 视觉表现：
// - 完整（full）：3 个圆点，三色（主题色 + 副色 + 橙色），12dp
// - 轻量（light）：2 个圆点，半透明双色，12dp
// - 极简（minimal）：1 个圆点，30% 透明度主题色，12dp
// - 未选中状态：8dp（更小）
// 
// 关键属性：
// - label：预览名称
// - isSelected：是否被选中
// - colors：圆点颜色列表
// 
// 用户交互：
// - 无交互，仅作为可视化预览
// ============================================================================

@Composable
private fun AnimationPreviewDot(
    label: String,
    isSelected: Boolean,
    colors: List<Color>
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            colors.forEach { color ->
                Box(
                    modifier = Modifier
                        .size(if (isSelected) 12.dp else 8.dp)
                        .background(
                            color = color,
                            shape = androidx.compose.foundation.shape.CircleShape
                        )
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            color = if (isSelected)
                MaterialTheme.colorScheme.primary
            else
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
            fontSize = 10.sp
        )
    }
}

// ============================================================================
// MANUAL IP DIALOG - 手动 IP 设置对话框
// 
// 功能说明：
// - 当无法自动发现主基地时，手动输入基地 IP 地址
// 
// 视觉布局：
// - 标题："手动设置主基地IP"，主题色
// - 说明文字："输入主基地的IP地址（格式：http://192.168.x.x）"
// - 输入框：带占位符文本，单行输入
// - 确认按钮：主题色文字
// - 取消按钮：灰色文字
// 
// 输入状态：
// - 输入框初始值：当前已保存的 IP（currentIp）
// - 占位符："http://192.168.1.100"
// 
// 关键属性：
// - currentIp：当前已设置的 IP（可能为 null）
// - onDismiss：关闭对话框回调
// - onConfirm：确认输入回调，传递输入的 IP 字符串
// 
// 用户交互：
// - 点击背景或取消：关闭对话框
// - 点击确认：调用 onConfirm(ipInput)
// ============================================================================

@Composable
private fun ManualIpDialog(
    currentIp: String?,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var ipInput by remember { mutableStateOf(currentIp ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        title = {
            Text(
                text = "手动设置主基地IP",
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.primary
            )
        },
        text = {
            Column {
                Text(
                    text = "输入主基地的IP地址（格式：http://192.168.x.x）",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = ipInput,
                    onValueChange = { ipInput = it },
                    placeholder = { Text("http://192.168.1.100", fontFamily = FontFamily.Monospace) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = Color(0xFF2A2E37)
                    ),
                    textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(ipInput) }
            ) {
                Text(
                    text = "确认",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "取消",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
    )
}

// ============================================================================
// COLOR PICKER - 颜色选择器
// 
// 功能说明：
// - 显示预设颜色选项供用户选择
// - 点击可选中对应颜色
// 
// 视觉布局：
// - 圆形颜色块排列成一行
// - 选中状态：白色边框 + 缩放 1.1
// - 未选中状态：无边框
// 
// 预设颜色：
// - 蓝色、绿色、红色、黄色、紫色、粉色、青色、橙色
// 
// 关键属性：
// - selectedColor：当前选中的颜色值
// - onColorSelected：颜色变化回调
// - presetColors：预设颜色列表
// 
// 用户交互：
// - 点击颜色块：触发 onColorSelected
// ============================================================================

@Composable
private fun ColorPicker(
    selectedColor: Int,
    onColorSelected: (Int) -> Unit,
    presetColors: List<Int> = listOf(
        0xFF3B82F6.toInt(), // Blue
        0xFF10B981.toInt(), // Green
        0xFFEF4444.toInt(), // Red
        0xFFF59E0B.toInt(), // Yellow
        0xFF8B5CF6.toInt(), // Purple
        0xFFEC4899.toInt(), // Pink
        0xFF06B6D4.toInt(), // Cyan
        0xFFF97316.toInt()  // Orange
    )
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        presetColors.forEach { color ->
            val isSelected = selectedColor == color
            val scale = if (isSelected) 1.1f else 1f
            
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .scale(scale)
                    .background(
                        color = Color(color),
                        shape = androidx.compose.foundation.shape.CircleShape
                    )
                    .then(
                        if (isSelected) {
                            Modifier.border(
                                width = 2.dp,
                                color = Color.White,
                                shape = androidx.compose.foundation.shape.CircleShape
                            )
                        } else {
                            Modifier
                        }
                    )
                    .clickable { onColorSelected(color) }
            )
        }
    }
}

// ============================================================================
// BORDER RADIUS SELECTOR - 圆角选择器
// 
// 功能说明：
// - 分段按钮样式选择圆角值
// - 可选值：4dp, 8dp, 12dp, 16dp
// 
// 视觉布局：
// - 等宽排列的分段按钮
// - 选中：主题色背景（20%）+ 主题色边框（50%）+ 主题色文字
// - 未选中：透明背景 + 深灰边框 + 灰色文字
// 
// 关键属性：
// - selectedRadius：当前选中的圆角值
// - onRadiusSelected：圆角变化回调
// 
// 用户交互：
// - 点击分段按钮：触发 onRadiusSelected
// ============================================================================

@Composable
private fun BorderRadiusSelector(
    selectedRadius: Int,
    onRadiusSelected: (Int) -> Unit,
    primaryColor: Int,
    options: List<Int> = listOf(4, 8, 12, 16)
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { radius ->
            val isSelected = selectedRadius == radius
            val backgroundColor = if (isSelected) {
                Color(primaryColor).copy(alpha = 0.2f)
            } else {
                MaterialTheme.colorScheme.background
            }
            
            val borderColor = if (isSelected) {
                Color(primaryColor).copy(alpha = 0.5f)
            } else {
                Color(0xFF2A2E37)
            }
            
            val textColor = if (isSelected) {
                Color(primaryColor)
            } else {
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            }
            
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = backgroundColor,
                border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onRadiusSelected(radius) }
            ) {
                Text(
                    text = "${radius}dp",
                    fontFamily = FontFamily.Monospace,
                    color = textColor,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .padding(horizontal = 8.dp, vertical = 8.dp)
                        .fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}

// ============================================================================
// COLOR CUSTOMIZATION SECTION - 颜色定制区块
// 
// 功能说明：
// - 包含主色和副色选择器
// - 包含圆角选择器
// 
// 视觉布局：
// - 主色选择器 + 说明文字
// - 副色选择器 + 说明文字
// - 圆角选择器 + 说明文字
// 
// 关键属性：
// - primaryColor：当前主色
// - onPrimaryColorChange：主色变化回调
// - secondaryColor：当前副色
// - onSecondaryColorChange：副色变化回调
// - borderRadius：当前圆角值
// - onBorderRadiusChange：圆角变化回调
// 
// 用户交互：
// - 点击颜色块：触发对应变化回调
// - 点击圆角按钮：触发圆角变化回调
// ============================================================================

@Composable
private fun ColorCustomizationSection(
    primaryColor: Int,
    onPrimaryColorChange: (Int) -> Unit,
    secondaryColor: Int,
    onSecondaryColorChange: (Int) -> Unit,
    borderRadius: Int,
    onBorderRadiusChange: (Int) -> Unit
) {
    // 主色选择器
    Column {
        Text(
            text = "主色",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        ColorPicker(
            selectedColor = primaryColor,
            onColorSelected = onPrimaryColorChange
        )
    }
    
    Spacer(modifier = Modifier.height(16.dp))
    
    // 副色选择器
    Column {
        Text(
            text = "副色",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        ColorPicker(
            selectedColor = secondaryColor,
            onColorSelected = onSecondaryColorChange
        )
    }
    
    Spacer(modifier = Modifier.height(16.dp))
    
    // 圆角选择器
    Column {
        Text(
            text = "圆角",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onSurface,
            fontSize = 14.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        BorderRadiusSelector(
            selectedRadius = borderRadius,
            onRadiusSelected = onBorderRadiusChange,
            primaryColor = primaryColor
        )
    }
}
