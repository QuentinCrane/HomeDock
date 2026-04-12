/**
 * CaptureScreen - 采集屏幕（回港终端）
 * 
 * 屏幕功能：
 * - 用户在外采集信息的主要界面
 * - 支持三种采集模式：文字（TEXT）、图片（IMAGE）、录音（AUDIO）
 * - 可以将采集内容保存为草稿或直接投入待回港队列
 * - 实时显示与主基地的连接状态
 * - 底部状态栏显示本地草稿数、待回港数、已归档数
 */
package com.personalbase.terminal.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.ui.MainViewModel
import kotlinx.coroutines.delay
import java.io.File

// ============================================================================
// CAPTURE SCREEN - Collector Terminal with large input area
// ============================================================================

/**
 * 采集模式枚举
 * - TEXT：文字采集
 * - IMAGE：图片采集
 * - AUDIO：录音采集
 */
enum class CaptureMode(val label: String) {
    TEXT("文字"),
    IMAGE("图片"),
    AUDIO("录音");
    
    // 根据模式返回对应的图标
    val icon: ImageVector
        get() = when (this) {
            TEXT -> Icons.Default.TextFields
            IMAGE -> Icons.Default.Image
            AUDIO -> Icons.Default.Mic
        }
}

@Composable
fun CaptureScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val baseIp by viewModel.baseIp.collectAsState()
    val draftCount by viewModel.draftCount.collectAsState(initial = 0)
    val pendingCount by viewModel.pendingCount.collectAsState(initial = 0)
    val archivedCount by viewModel.archivedCount.collectAsState(initial = 0)

    var currentMode by remember { mutableStateOf(CaptureMode.TEXT) }
    var lastInputHint by remember { mutableStateOf<String?>(null) }
    var showSaveSuccess by remember { mutableStateOf(false) }
    var saveSuccessMessage by remember { mutableStateOf("") }

    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }
    // 延迟启动动画，让画面有淡入效果
    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
    }

    Box(modifier = modifier.fillMaxSize()) {
        AnimatedVisibility(
            visible = screenVisible,
            enter = fadeIn(tween(400)) + scaleIn(initialScale = 0.98f, animationSpec = tween(400))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(16.dp)
            ) {
                // Header with status
                CaptureHeader(baseIp = baseIp)

                // 顶部状态区和模式切换标签之间的间距
                Spacer(modifier = Modifier.height(20.dp))

                // 模式切换标签栏：文字/图片/录音 三个选项卡
                ModeTabs(
                    currentMode = currentMode,
                    onModeChange = { currentMode = it }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Input area - takes most of the screen
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    AnimatedContent(
                        targetState = currentMode,
                        transitionSpec = {
                            // 模式切换动画：滑动 + 淡入淡出
                            // 向右滑入新内容，向左滑出旧内容
                            (slideInHorizontally { it / 4 } + fadeIn(tween(300)))
                                .togetherWith(slideOutHorizontally { -it / 4 } + fadeOut(tween(200)))
                        },
                        label = "mode_panel_transition"
                    ) { mode ->
                        when (mode) {
                            CaptureMode.TEXT -> TextCapturePanel(
                                onSaveDraft = {
                                    lastInputHint = "刚刚保存为草稿"
                                    showSaveSuccess = true
                                },
                                onSubmit = {
                                    lastInputHint = "已投入待回港舱"
                                    showSaveSuccess = true
                                }
                            )
                            CaptureMode.IMAGE -> ImageCapturePanel(
                                onSaveDraft = {
                                    lastInputHint = "刚刚保存为草稿"
                                    showSaveSuccess = true
                                },
                                onSubmit = {
                                    lastInputHint = "已投入待回港舱"
                                    showSaveSuccess = true
                                }
                            )
                            CaptureMode.AUDIO -> AudioCapturePanel(
                                onSaveDraft = {
                                    lastInputHint = "刚刚保存为草稿"
                                    showSaveSuccess = true
                                },
                                onSubmit = {
                                    lastInputHint = "已投入待回港舱"
                                    showSaveSuccess = true
                                }
                            )
                        }
                    }
                }

                // Last input hint
                AnimatedVisibility(
                    visible = lastInputHint != null,
                    enter = fadeIn(tween(200)) + slideInVertically { it },
                    exit = fadeOut(tween(200))
                ) {
                    Text(
                        text = "最近一次输入：${lastInputHint}",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }

                // Success feedback animation
                AnimatedVisibility(
                    visible = showSaveSuccess,
                    // 保存成功指示器的动画：缩放 + 淡入淡出
                    // 使用 LaunchedEffect 在 1.5 秒后自动消失
                    enter = scaleIn(tween(200)) + fadeIn(),
                    exit = scaleOut(tween(200)) + fadeOut()
                ) {
                    SaveSuccessIndicator(
                        message = saveSuccessMessage,
                        onDismiss = { showSaveSuccess = false }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Action buttons
                CaptureActionBar(
                    currentMode = currentMode,
                    // 保存草稿按钮回调：将胶囊保存到本地数据库（asDraft=true）
                    onSaveDraft = { content, filePath ->
                        viewModel.addCapsule(currentMode.name.lowercase(), content, filePath, asDraft = true)
                        lastInputHint = "刚刚保存为草稿"
                        showSaveSuccess = true
                        saveSuccessMessage = "已收入本地舱"
                    },
                    // 投入待回港按钮回调：将胶囊添加到待回港队列（asDraft=false）
                    // 胶囊状态变为 PENDING，等待回港操作时上传
                    onSubmitToDock = { content, filePath ->
                        viewModel.addCapsule(currentMode.name.lowercase(), content, filePath, asDraft = false)
                        lastInputHint = "已投入待回港舱"
                        showSaveSuccess = true
                        saveSuccessMessage = "已投入待回港舱"
                    }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Bottom status footer
                CaptureStatusFooter(
                    draftCount = draftCount,
                    pendingCount = pendingCount,
                    archivedCount = archivedCount
                )
            }
        }
    }
}

// ============================================================================
// HEADER
// ============================================================================

@Composable
private fun CaptureHeader(baseIp: String?) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "回港终端",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp
        )

        CaptureStatusIndicator(baseIp = baseIp)
    }
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================

/**
 * 连接状态指示器
 * - 未连接：红色，慢速脉冲
 * - 已发现基地：主题色，快速脉冲
 * 
 * 动画效果：
 * - 脉冲动画：使用 rememberInfiniteTransition 实现无限循环的缩放和透明度变化
 */
@Composable
private fun CaptureStatusIndicator(baseIp: String?) {
    val infiniteTransition = rememberInfiniteTransition(label = "capture_status_pulse")

    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (baseIp != null) 1.3f else 1.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (baseIp != null) 1200 else 400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (baseIp != null) 1200 else 400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow_alpha"
    )

    val dotColor = if (baseIp != null) MaterialTheme.colorScheme.secondary else Color.Red

    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .scale(scale)
                .background(
                    color = dotColor.copy(alpha = glowAlpha * 0.4f),
                    shape = androidx.compose.foundation.shape.CircleShape
                )
        )
        Box(
            modifier = Modifier
                .size(10.dp)
                .background(dotColor, shape = androidx.compose.foundation.shape.CircleShape)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = if (baseIp != null) "已发现基地" else "未连接",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground,
            fontSize = 12.sp
        )
    }
}

// ============================================================================
// MODE TABS
// ============================================================================

/**
 * 模式切换标签栏
 * 支持三种模式：文字、图片、录音
 * 选中的标签会有背景高亮和轻微放大效果
 */
@Composable
private fun ModeTabs(
    currentMode: CaptureMode,
    onModeChange: (CaptureMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(8.dp)
            )
            .padding(4.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        CaptureMode.entries.forEach { mode ->
            val isSelected = currentMode == mode
            val tabScale by animateFloatAsState(
                targetValue = if (isSelected) 1.05f else 1f,
                animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
                label = "tab_scale"
            )

            Surface(
                modifier = Modifier
                    .weight(1f)
                    .scale(tabScale)
                    .clip(RoundedCornerShape(6.dp))
                    .clickable { onModeChange(mode) },
                color = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.Transparent,
                shape = RoundedCornerShape(6.dp)
            ) {
                Row(
                    modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = mode.icon,
                        contentDescription = mode.label,
                        tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = mode.label,
                        fontFamily = FontFamily.Monospace,
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        fontWeight = if (isSelected) FontWeight.Medium else FontWeight.Normal,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

// ============================================================================
// TEXT CAPTURE PANEL
// ============================================================================

/**
 * 文字采集面板
 * 
 * 状态：
 * - textInput：用户输入的文字内容
 * - isFocused：输入框是否获得焦点（用于控制发光效果）
 */
@Composable
private fun TextCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit
) {
    var textInput by remember { mutableStateOf("") }
    var isFocused by remember { mutableStateOf(false) }

    // 边框透明度动画：获得焦点时边框更亮
    val borderAlpha by animateFloatAsState(
        targetValue = if (isFocused) 1f else 0.5f,
        animationSpec = tween(300),
        label = "border_alpha"
    )

    // 发光效果透明度：获得焦点时显示径向渐变发光
    val glowAlpha by animateFloatAsState(
        targetValue = if (isFocused) 0.25f else 0f,
        animationSpec = tween(300),
        label = "glow_alpha"
    )

    Box {
        // Glow background when focused
        if (isFocused) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary.copy(alpha = glowAlpha),
                                Color.Transparent
                            )
                        )
                    )
            )
        }

        OutlinedTextField(
            value = textInput,
            onValueChange = { textInput = it },
            placeholder = {
                Text(
                    "在此输入内容...",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            },
            modifier = Modifier
                .fillMaxSize()
                .onFocusChanged { isFocused = it.isFocused },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = borderAlpha),
                unfocusedBorderColor = Color(0xFF2A2E37),
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                cursorColor = MaterialTheme.colorScheme.primary,
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent
            ),
            textStyle = androidx.compose.ui.text.TextStyle(
                fontFamily = FontFamily.Monospace,
                fontSize = 16.sp
            ),
            enabled = true
        )
    }
}

// ============================================================================
// IMAGE CAPTURE PANEL
// ============================================================================

/**
 * 图片采集面板
 * 
 * 功能：
 * - 从相册选择图片
 * - 拍照获取图片（当前仅为占位）
 * - 可选添加图片描述
 */
@Composable
private fun ImageCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit
) {
    val context = LocalContext.current
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var imageDescription by remember { mutableStateOf("") }

    // 图片选择器：通过 ActivityResultContracts.GetContent() 打开相册
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        // For simplicity, we'll use the gallery picker
        // In a real app, you'd save the bitmap to a file
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Image preview area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (selectedImageUri != null) {
                // 已选择图片：显示图片预览
                // 使用 Coil 的 AsyncImage 加载网络/本地图片
                AsyncImage(
                    model = selectedImageUri,
                    contentDescription = "Selected image",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Image,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "点击下方按钮选择图片",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        fontSize = 14.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Image source buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = { imagePickerLauncher.launch("image/*") },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("相册", fontFamily = FontFamily.Monospace)
            }

            OutlinedButton(
                onClick = { /* Camera capture */ },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("拍照", fontFamily = FontFamily.Monospace)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Description input
        OutlinedTextField(
            value = imageDescription,
            onValueChange = { imageDescription = it },
            placeholder = {
                Text(
                    "添加描述...",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color(0xFF2A2E37),
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
            ),
            textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace),
            singleLine = true
        )
    }
}

// ============================================================================
// AUDIO CAPTURE PANEL
// ============================================================================

/**
 * 录音采集面板
 * 
 * 状态：
 * - isRecording：是否正在录音
 * - recordingDuration：已录秒数
 * - audioDescription：录音备注
 * 
 * 录音计时使用 LaunchedEffect 在录音时每秒递增
 */
@Composable
private fun AudioCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit
) {
    var isRecording by remember { mutableStateOf(false) }
    var recordingDuration by remember { mutableStateOf(0L) }
    var audioDescription by remember { mutableStateOf("") }

    val infiniteTransition = rememberInfiniteTransition(label = "audio_wave")
    val waveAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "wave_alpha"
    )

    // Recording timer
    // 录音计时器：正在录音时每秒增加 recordingDuration
    LaunchedEffect(isRecording) {
        if (isRecording) {
            while (true) {
                delay(1000)
                recordingDuration++
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Waveform / duration display area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (isRecording) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Animated waveform bars
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        repeat(12) { index ->
                            val barHeight by animateFloatAsState(
                                targetValue = (20 + (Math.sin((index * 0.5 + recordingDuration * 0.3).toDouble()) * 20)).toFloat(),
                                animationSpec = tween(200),
                                label = "bar_$index"
                            )
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(barHeight.dp)
                                    .background(
                                        MaterialTheme.colorScheme.primary.copy(alpha = waveAlpha),
                                        RoundedCornerShape(2.dp)
                                    )
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = formatDuration(recordingDuration),
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "录音中...",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                }
            } else if (recordingDuration > 0) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = formatDuration(recordingDuration),
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.secondary,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "录音完成",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                }
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "点击下方按钮开始录音",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        fontSize = 14.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Record button
        val buttonScale by animateFloatAsState(
            targetValue = if (isRecording) 1.1f else 1f,
            // 录音按钮缩放动画：
            // 正在录音时放大，点击时回弹
            animationSpec = spring(dampingRatio = 0.5f),
            label = "record_button_scale"
        )

        Box(
            modifier = Modifier
                .size(72.dp)
                .scale(buttonScale)
                .clip(androidx.compose.foundation.shape.CircleShape)
                .background(
                    if (isRecording) MaterialTheme.colorScheme.error
                    else MaterialTheme.colorScheme.primary
                )
                .clickable {
                    isRecording = !isRecording
                    if (!isRecording && recordingDuration == 0L) {
                        // Do nothing if stopped without recording
                    } else if (!isRecording && recordingDuration > 0L) {
                        // Recording stopped, keep the duration
                    } else {
                        // Started recording
                        recordingDuration = 0L
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
                contentDescription = if (isRecording) "Stop recording" else "Start recording",
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Description input
        OutlinedTextField(
            value = audioDescription,
            onValueChange = { audioDescription = it },
            placeholder = {
                Text(
                    "添加备注...",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color(0xFF2A2E37),
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
            ),
            textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace),
            singleLine = true
        )
    }
}

private fun formatDuration(seconds: Long): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return "%02d:%02d".format(mins, secs)
}

// ============================================================================
// CAPTURE ACTION BAR
// ============================================================================

/**
 * 采集操作栏
 * 
 * 两个按钮：
 * - 存草稿（次要按钮）：将胶囊保存为草稿状态
 * - 投入待回港（主要按钮）：将胶囊状态设为待回港
 */
@Composable
private fun CaptureActionBar(
    currentMode: CaptureMode,
    onSaveDraft: (String?, String?) -> Unit,
    onSubmitToDock: (String?, String?) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Secondary button: Save draft
        OutlinedButton(
            onClick = { onSaveDraft(null, null) },
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = MaterialTheme.colorScheme.onBackground
            ),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
        ) {
            Icon(Icons.Default.SaveAlt, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("存草稿", fontFamily = FontFamily.Monospace)
        }

        // Primary button: Submit to dock
        Button(
            onClick = { onSubmitToDock(null, null) },
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "投入待回港",
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

// ============================================================================
// CAPTURE STATUS FOOTER
// ============================================================================

/**
 * 底部状态栏
 * 显示三种胶囊状态的计数：
 * - 本地草稿：灰色
 * - 待回港：主题色
 * - 已归档：次要色
 */
@Composable
private fun CaptureStatusFooter(
    draftCount: Int,
    pendingCount: Int,
    archivedCount: Int
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            StatusCountItem(label = "本地草稿", count = draftCount, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            StatusDivider()
            StatusCountItem(label = "待回港", count = pendingCount, color = MaterialTheme.colorScheme.primary)
            StatusDivider()
            StatusCountItem(label = "已归档", count = archivedCount, color = MaterialTheme.colorScheme.secondary)
        }
    }
}

/**
 * 单个状态计数项（图标+数字+标签）
 */
@Composable
private fun StatusCountItem(label: String, count: Int, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = count.toString(),
            fontFamily = FontFamily.Monospace,
            color = color,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            fontSize = 11.sp
        )
    }
}

/**
 * 状态项之间的分隔线
 */
@Composable
private fun StatusDivider() {
    Box(
        modifier = Modifier
            .width(1.dp)
            .height(24.dp)
            .background(MaterialTheme.colorScheme.onBackground.copy(alpha = 0.2f))
    )
}

// ============================================================================
// SAVE SUCCESS INDICATOR
// ============================================================================

/**
 * 保存成功指示器
 * 
 * 行为：
 * - 显示一个圆角矩形提示条
 * - 1.5 秒后自动消失
 */
@Composable
private fun SaveSuccessIndicator(
    message: String,
    onDismiss: () -> Unit
) {
    LaunchedEffect(Unit) {
        delay(1500)
        // 自动隐藏
        onDismiss()
    }

    Surface(
        color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.9f),
        shape = RoundedCornerShape(20.dp),
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = message,
                fontFamily = FontFamily.Monospace,
                color = Color.White,
                fontSize = 13.sp
            )
        }
    }
}