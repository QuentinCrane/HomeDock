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
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.core.content.ContextCompat
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import coil.compose.AsyncImage
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.ui.MainViewModel
import com.personalbase.terminal.util.ImageCompressor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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
    val hapticEnabled by viewModel.hapticEnabled.collectAsState()
    val imageCompression by viewModel.imageCompression.collectAsState()
    val context = LocalContext.current

    var currentMode by remember { mutableStateOf(CaptureMode.TEXT) }
    var lastInputHint by remember { mutableStateOf<String?>(null) }
    var showSaveSuccess by remember { mutableStateOf(false) }
    var saveSuccessMessage by remember { mutableStateOf("") }
    
    // Image state lifted from ImageCapturePanel to share with action bar
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var compressedImageUri by remember { mutableStateOf<Uri?>(null) }
    var isCompressing by remember { mutableStateOf(false) }

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
                                },
                                imageCompression = imageCompression,
                                viewModel = viewModel,
                                selectedImageUri = selectedImageUri,
                                compressedImageUri = compressedImageUri,
                                onImageSelected = { uri ->
                                    selectedImageUri = uri
                                    compressedImageUri = null
                                    if (uri != null && imageCompression) {
                                        isCompressing = true
                                        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
                                            val compressed = ImageCompressor.compress(context, uri)
                                            compressedImageUri = compressed
                                            isCompressing = false
                                        }
                                    }
                                },
                                isCompressing = isCompressing
                            )
                            CaptureMode.AUDIO -> AudioCapturePanel(
                                onSaveDraft = {
                                    lastInputHint = "刚刚保存为草稿"
                                    showSaveSuccess = true
                                },
                                onSubmit = {
                                    lastInputHint = "已投入待回港舱"
                                    showSaveSuccess = true
                                },
                                viewModel = viewModel
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
                    onSaveDraft = { content, _ ->
                        // For IMAGE mode, use compressed path if available, otherwise original
                        val imageFilePath = if (currentMode == CaptureMode.IMAGE) {
                            compressedImageUri?.path ?: selectedImageUri?.path
                        } else null
                        viewModel.addCapsule(currentMode.name.lowercase(), content, imageFilePath, asDraft = true)
                        lastInputHint = "刚刚保存为草稿"
                        showSaveSuccess = true
                        saveSuccessMessage = "已收入本地舱"
                        // Haptic feedback
                        if (hapticEnabled) {
                            triggerHapticFeedback(context)
                        }
                        // Reset image state after saving
                        if (currentMode == CaptureMode.IMAGE) {
                            selectedImageUri = null
                            compressedImageUri = null
                        }
                    },
                    // 投入待回港按钮回调：将胶囊添加到待回港队列（asDraft=false）
                    // 胶囊状态变为 PENDING，等待回港操作时上传
                    onSubmitToDock = { content, _ ->
                        // For IMAGE mode, use compressed path if available, otherwise original
                        val imageFilePath = if (currentMode == CaptureMode.IMAGE) {
                            compressedImageUri?.path ?: selectedImageUri?.path
                        } else null
                        viewModel.addCapsule(currentMode.name.lowercase(), content, imageFilePath, asDraft = false)
                        lastInputHint = "已投入待回港舱"
                        showSaveSuccess = true
                        saveSuccessMessage = "已投入待回港舱"
                        // Haptic feedback
                        if (hapticEnabled) {
                            triggerHapticFeedback(context)
                        }
                        // Reset image state after saving
                        if (currentMode == CaptureMode.IMAGE) {
                            selectedImageUri = null
                            compressedImageUri = null
                        }
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
// AUDIO CAPTURE PANEL
// ============================================================================

/**
 * 录音采集面板
 *
 * 状态：
 * - isRecording：是否正在录音
 * - recordingDuration：已录秒数
 * - audioDescription：录音备注
 * - transcribedText：语音转文字结果
 * - audioFilePath：录音文件路径
 * - showSaveDialog：是否显示保存选项对话框
 *
 * 录音计时使用 LaunchedEffect 在录音时每秒递增
 */
@Composable
private fun AudioCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit,
    viewModel: MainViewModel
) {
    val context = LocalContext.current

    var isRecording by remember { mutableStateOf(false) }
    var recordingDuration by remember { mutableStateOf(0L) }
    var audioDescription by remember { mutableStateOf("") }
    var transcribedText by remember { mutableStateOf("") }
    var audioFilePath by remember { mutableStateOf<String?>(null) }
    var showSaveDialog by remember { mutableStateOf(false) }

    // 振幅数据列表（用于真实波形动画）
    var amplitudeHistory by remember { mutableStateOf(List(12) { 0 }) }

    // Job references for coroutine cancellation on unmount
    var recordingJob by remember { mutableStateOf<Job?>(null) }
    var amplitudeJob by remember { mutableStateOf<Job?>(null) }

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

    // MediaRecorder 实例
    var mediaRecorder by remember { mutableStateOf<android.media.MediaRecorder?>(null) }
    // SpeechRecognizer 实例
    var speechRecognizer by remember { mutableStateOf<android.speech.SpeechRecognizer?>(null) }

    // DisposableEffect：确保 Composable 销毁时释放媒体资源
    // 防止用户在录音过程中导航离开导致资源泄漏
    DisposableEffect(mediaRecorder, speechRecognizer) {
        onDispose {
            // Cancel coroutines first to stop loops immediately
            recordingJob?.cancel()
            amplitudeJob?.cancel()
            mediaRecorder?.apply {
                try {
                    stop()
                    release()
                } catch (e: Exception) {
                    release()
                }
            }
            mediaRecorder = null
            speechRecognizer?.apply {
                try {
                    stopListening()
                    destroy()
                } catch (e: Exception) {
                    destroy()
                }
            }
            speechRecognizer = null
        }
    }

    // 权限请求Launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            // 权限已授予，开始录音
            isRecording = true
        }
    }

    // 音频文件目录
    val audioDir = remember {
        File(context.filesDir, "audio").apply {
            if (!exists()) mkdirs()
        }
    }

    // 录音计时器
    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingJob = CoroutineScope(Dispatchers.Main).launch {
                while (true) {
                    delay(1000)
                    recordingDuration++
                    // 5分钟超时
                    if (recordingDuration >= 300) {
                        isRecording = false
                        break
                    }
                }
            }
        } else {
            recordingJob?.cancel()
            recordingJob = null
        }
    }

    // 振幅采样定时器（每100ms获取一次振幅）
    LaunchedEffect(isRecording) {
        if (isRecording) {
            amplitudeJob = CoroutineScope(Dispatchers.Main).launch {
                while (true) {
                    delay(100)
                    mediaRecorder?.let { recorder ->
                        try {
                            val amplitude = recorder.maxAmplitude
                            // 振幅范围 0-32767，映射到 0-40 的波形值
                            val normalizedAmplitude = (amplitude / 32767f * 40).toInt().coerceIn(0, 40)
                            // 更新振幅历史，移除最旧的，添加最新的
                            amplitudeHistory = amplitudeHistory.drop(1) + normalizedAmplitude
                        } catch (e: Exception) {
                            // 忽略获取振幅时的异常
                        }
                    }
                }
            }
        } else {
            amplitudeJob?.cancel()
            amplitudeJob = null
        }
    }

    // 开始录音
    fun startRecording() {
        try {
            val timestamp = System.currentTimeMillis()
            val file = File(audioDir, "$timestamp.m4a")
            audioFilePath = file.absolutePath

            // Get recording quality config from ViewModel
            val config = viewModel.getMediaRecorderConfig()

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                android.media.MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                android.media.MediaRecorder()
            }.apply {
                setAudioSource(android.media.MediaRecorder.AudioSource.MIC)
                setOutputFormat(android.media.MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(android.media.MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(config.bitRate)
                setAudioSamplingRate(config.sampleRate)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }

            recordingDuration = 0L
            amplitudeHistory = List(12) { 0 }
            isRecording = true

            // 启动语音识别
            startSpeechRecognition(context) { recognizedText ->
                transcribedText = recognizedText
            }.also { speechRecognizer = it }

        } catch (e: Exception) {
            e.printStackTrace()
            mediaRecorder?.release()
            mediaRecorder = null
            // 修复：同时清理 SpeechRecognizer 避免资源泄漏
            speechRecognizer?.apply {
                try {
                    stopListening()
                    destroy()
                } catch (e: Exception) { }
            }
            speechRecognizer = null
        }
    }

    // 停止录音
    fun stopRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
            mediaRecorder = null

            speechRecognizer?.apply {
                stopListening()
                destroy()
            }
            speechRecognizer = null

            isRecording = false
            // 录音停止后显示保存对话框
            if (recordingDuration > 0) {
                showSaveDialog = true
            }
        } catch (e: Exception) {
            e.printStackTrace()
            mediaRecorder?.release()
            mediaRecorder = null
            speechRecognizer?.apply {
                try {
                    stopListening()
                    destroy()
                } catch (e: Exception) { }
            }
            speechRecognizer = null
            isRecording = false
        }
    }

    // 保存对话框
    if (showSaveDialog) {
        SaveOptionsDialog(
            transcribedText = transcribedText,
            audioFilePath = audioFilePath,
            onDismiss = {
                showSaveDialog = false
                // 重置状态
                recordingDuration = 0L
                audioFilePath = null
                transcribedText = ""
            },
            onSaveTextOnly = { content ->
                viewModel.addCapsule("text", content, null, asDraft = false)
                showSaveDialog = false
                recordingDuration = 0L
                audioFilePath = null
                transcribedText = ""
            },
            onSaveAudioOnly = { filePath ->
                viewModel.addCapsule("audio", null, filePath, asDraft = false)
                showSaveDialog = false
                recordingDuration = 0L
                audioFilePath = null
                transcribedText = ""
            },
            onSaveBoth = { content, filePath ->
                viewModel.addCapsule("text", content, null, asDraft = false)
                viewModel.addCapsule("audio", null, filePath, asDraft = false)
                showSaveDialog = false
                recordingDuration = 0L
                audioFilePath = null
                transcribedText = ""
            }
        )
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
                    // 真实振幅波形动画
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        amplitudeHistory.forEachIndexed { index, amplitude ->
                            // 将振幅映射到 20-60dp 高度
                            val barHeight = (20 + amplitude * 1f).coerceIn(20f, 60f)
                            val barHeightDp by animateFloatAsState(
                                targetValue = barHeight,
                                animationSpec = tween(100),
                                label = "bar_$index"
                            )
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(barHeightDp.dp)
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

        // 转写文字显示区域
        if (transcribedText.isNotEmpty()) {
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 100.dp),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "转写文字：",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = transcribedText,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 14.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Record button
        val buttonScale by animateFloatAsState(
            targetValue = if (isRecording) 1.1f else 1f,
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
                    if (isRecording) {
                        stopRecording()
                    } else {
                        // 检查录音权限
                        if (ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            startRecording()
                        } else {
                            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
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

/**
 * 启动语音识别
 */
private fun startSpeechRecognition(
    context: android.content.Context,
    onResult: (String) -> Unit
): android.speech.SpeechRecognizer? {
    return try {
        val recognizer = android.speech.SpeechRecognizer.createSpeechRecognizer(context)
        recognizer.setRecognitionListener(object : android.speech.RecognitionListener {
            override fun onReadyForSpeech(params: android.os.Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onError(error: Int) {
                // 忽略错误，继续尝试
            }

            override fun onResults(results: android.os.Bundle?) {
                val matches = results?.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { result ->
                    onResult(result)
                }
            }

            override fun onPartialResults(partialResults: android.os.Bundle?) {
                val matches = partialResults?.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { result ->
                    onResult(result)
                }
            }

            override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
        })

        val intent = android.content.Intent("android.speech.action.RECOGNIZE_SPEECH").apply {
            putExtra("android.speech.extra.LANGUAGE_MODEL", "android.speech.extra.LANGUAGE_MODEL_FREE_FORM")
            putExtra("android.speech.extra.LANGUAGE", "zh-CN") // 中文优先
            putExtra("android.speech.extra.PARTIAL_RESULTS", true)
            putExtra("android.speech.extra.MAX_RESULTS", 1)
        }

        recognizer.startListening(intent)
        recognizer
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

/**
 * 保存选项对话框
 */
@Composable
private fun SaveOptionsDialog(
    transcribedText: String,
    audioFilePath: String?,
    onDismiss: () -> Unit,
    onSaveTextOnly: (String) -> Unit,
    onSaveAudioOnly: (String) -> Unit,
    onSaveBoth: (String, String) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "保存选项",
                fontFamily = FontFamily.Monospace
            )
        },
        text = {
            Column {
                Text(
                    text = "选择保存方式：",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(16.dp))

                // 存文字按钮
                val canSaveText = transcribedText.isNotEmpty()
                OutlinedButton(
                    onClick = { onSaveTextOnly(transcribedText) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canSaveText,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = if (canSaveText) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                    )
                ) {
                    Icon(Icons.Default.TextFields, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (canSaveText) "存文字" else "存文字（无转写内容）",
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 存录音按钮
                OutlinedButton(
                    onClick = { audioFilePath?.let { onSaveAudioOnly(it) } },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = audioFilePath != null,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = if (audioFilePath != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                    )
                ) {
                    Icon(Icons.Default.AudioFile, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("存录音", fontFamily = FontFamily.Monospace)
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 存文字+录音按钮
                val canSaveBoth = transcribedText.isNotEmpty() && audioFilePath != null
                Button(
                    onClick = { audioFilePath?.let { onSaveBoth(transcribedText, it) } },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canSaveBoth,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.secondary
                    )
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("存文字+录音", fontFamily = FontFamily.Monospace)
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消", fontFamily = FontFamily.Monospace)
            }
        }
    )
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

// ============================================================================
// HAPTIC FEEDBACK HELPER
// ============================================================================

/**
 * 触发 haptic 反馈
 * 根据系统版本选择合适的振动 API
 */
@Suppress("DEPRECATION")
private fun triggerHapticFeedback(context: Context) {
    try {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        if (vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                vibrator.vibrate(50)
            }
        }
    } catch (e: Exception) {
        // 忽略振动失败
    }
}

// ============================================================================
// CAPTURE HEADER
// ============================================================================

@Composable
private fun CaptureHeader(baseIp: String?) {
    val isConnected = baseIp != null

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "采集终端",
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = if (isConnected) "已连接基地" else "未发现基地",
                fontFamily = FontFamily.Monospace,
                color = if (isConnected) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                fontSize = 12.sp
            )
        }

        // Connection indicator
        Surface(
            shape = RoundedCornerShape(4.dp),
            color = if (isConnected) MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            color = if (isConnected) Color(0xFF10B981) else Color(0xFF6B7280),
                            shape = CircleShape
                        )
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isConnected) "在线" else "离线",
                    fontFamily = FontFamily.Monospace,
                    color = if (isConnected) Color(0xFF10B981) else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                    fontSize = 11.sp
                )
            }
        }
    }
}

// ============================================================================
// MODE TABS
// ============================================================================

@Composable
private fun ModeTabs(
    currentMode: CaptureMode,
    onModeChange: (CaptureMode) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            CaptureMode.entries.forEach { mode ->
                val selected = currentMode == mode
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onModeChange(mode) },
                    shape = RoundedCornerShape(6.dp),
                    color = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else Color.Transparent
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = mode.icon,
                            contentDescription = mode.label,
                            tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = mode.label,
                            fontFamily = FontFamily.Monospace,
                            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                            fontSize = 13.sp,
                            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}

// ============================================================================
// TEXT CAPTURE PANEL
// ============================================================================

@Composable
private fun TextCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit
) {
    var text by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            placeholder = {
                Text(
                    text = "在此输入文字...",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f)
                )
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color(0xFF2A2E37),
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
            ),
            textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace)
        )
    }
}

// ============================================================================
// IMAGE CAPTURE PANEL
// ============================================================================

@Composable
private fun ImageCapturePanel(
    onSaveDraft: () -> Unit,
    onSubmit: () -> Unit,
    imageCompression: Boolean,
    viewModel: MainViewModel,
    selectedImageUri: Uri?,
    compressedImageUri: Uri?,
    onImageSelected: (Uri?) -> Unit,
    isCompressing: Boolean
) {
    val context = LocalContext.current
    val hapticEnabled by viewModel.hapticEnabled.collectAsState()

    var showImageSourceDialog by remember { mutableStateOf(false) }

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            onImageSelected(it)
            if (hapticEnabled) {
                triggerHapticFeedback(context)
            }
        }
    }

    // Camera launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        bitmap?.let {
            // Convert bitmap to Uri and process
            val uri = saveBitmapToUri(context, it)
            onImageSelected(uri)
            if (hapticEnabled) {
                triggerHapticFeedback(context)
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Image preview or placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, Color(0xFF2A2E37), RoundedCornerShape(8.dp))
                .clickable { showImageSourceDialog = true },
            contentAlignment = Alignment.Center
        ) {
            when {
                isCompressing -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(32.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "压缩中...",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }
                }
                compressedImageUri != null || selectedImageUri != null -> {
                    val uri = compressedImageUri ?: selectedImageUri
                    AsyncImage(
                        model = uri,
                        contentDescription = "Selected image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }
                else -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Image,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "点击选择图片",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "或长按打开相机",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }

    // Image source selection dialog
    if (showImageSourceDialog) {
        AlertDialog(
            onDismissRequest = { showImageSourceDialog = false },
            title = {
                Text(
                    text = "选择图片来源",
                    fontFamily = FontFamily.Monospace
                )
            },
            text = {
                Column {
                    TextButton(
                        onClick = {
                            showImageSourceDialog = false
                            imagePickerLauncher.launch("image/*")
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.PhotoLibrary, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("从相册选择", fontFamily = FontFamily.Monospace)
                    }
                    TextButton(
                        onClick = {
                            showImageSourceDialog = false
                            cameraLauncher.launch(null)
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("拍照", fontFamily = FontFamily.Monospace)
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showImageSourceDialog = false }) {
                    Text("取消", fontFamily = FontFamily.Monospace)
                }
            }
        )
    }
}

// Helper function to save bitmap to Uri
private fun saveBitmapToUri(context: Context, bitmap: android.graphics.Bitmap): Uri? {
    return try {
        val imagesDir = File(context.filesDir, "images").apply { if (!exists()) mkdirs() }
        val file = File(imagesDir, "${System.currentTimeMillis()}.jpg")
        file.outputStream().use { out ->
            bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, out)
        }
        Uri.fromFile(file)
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}