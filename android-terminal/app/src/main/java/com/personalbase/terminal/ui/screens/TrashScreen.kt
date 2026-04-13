/**
 * TrashScreen - 回收站屏幕
 * 
 * 屏幕功能：
 * - 显示所有已软删除的胶囊
 * - 支持恢复胶囊（撤销删除）
 * - 支持永久删除胶囊
 * - 支持清空回收站
 * 
 * 状态管理：
 * - deletedCapsules: 来自 ViewModel 的已删除胶囊列表
 * - selectedCapsule: 当前选中的胶囊
 * 
 * 用户交互：
 * - 点击胶囊：展开详情
 * - 点击恢复：恢复胶囊到原状态
 * - 点击永久删除：永久删除胶囊
 * - 点击清空回收站：清空所有回收站内容
 */
package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.ui.MainViewModel
import kotlinx.coroutines.delay

@Composable
fun TrashScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier,
    onNavigateBack: () -> Unit
) {
    val deletedCapsules by viewModel.deletedCapsules.collectAsState(initial = emptyList())
    var selectedCapsule by remember { mutableStateOf<CapsuleEntity?>(null) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var showEmptyTrashConfirmDialog by remember { mutableStateOf(false) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
    }

    Box(modifier = modifier.fillMaxSize()) {
        AnimatedVisibility(
            visible = screenVisible,
            enter = fadeIn(tween(400)) + androidx.compose.animation.scaleIn(
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
                // Header with back button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "返回",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "回收站",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                    }
                    
                    Text(
                        text = "${deletedCapsules.size} 枚",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Info banner
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "删除的胶囊将在 30 天后自动清除",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.error.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Capsule list or empty state
                if (deletedCapsules.isEmpty()) {
                    EmptyTrashState(modifier = Modifier.weight(1f))
                } else {
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        items(deletedCapsules, key = { it.id }) { capsule ->
                            TrashCapsuleItem(
                                capsule = capsule,
                                onRestore = {
                                    viewModel.restoreCapsule(capsule.id)
                                    snackbarMessage = "已恢复胶囊"
                                },
                                onPermanentDelete = {
                                    selectedCapsule = capsule
                                    showDeleteConfirmDialog = true
                                }
                            )
                        }
                    }
                }
            }
        }

        // FAB for Empty Trash
        if (deletedCapsules.isNotEmpty()) {
            FloatingActionButton(
                onClick = { showEmptyTrashConfirmDialog = true },
                containerColor = MaterialTheme.colorScheme.error,
                contentColor = Color.White,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.DeleteForever,
                    contentDescription = "清空回收站"
                )
            }
        }

        // Delete confirmation dialog
        if (showDeleteConfirmDialog && selectedCapsule != null) {
            AlertDialog(
                onDismissRequest = {
                    showDeleteConfirmDialog = false
                    selectedCapsule = null
                },
                title = {
                    Text(
                        text = "永久删除",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.error
                    )
                },
                text = {
                    Text(
                        text = "确定要永久删除此胶囊吗？此操作不可撤销。",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            selectedCapsule?.let {
                                viewModel.permanentDeleteCapsule(it.id)
                                snackbarMessage = "已永久删除"
                            }
                            showDeleteConfirmDialog = false
                            selectedCapsule = null
                        }
                    ) {
                        Text(
                            text = "永久删除",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            showDeleteConfirmDialog = false
                            selectedCapsule = null
                        }
                    ) {
                        Text(
                            text = "取消",
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            )
        }

        // Empty trash confirmation dialog
        if (showEmptyTrashConfirmDialog) {
            AlertDialog(
                onDismissRequest = { showEmptyTrashConfirmDialog = false },
                title = {
                    Text(
                        text = "清空回收站",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.error
                    )
                },
                text = {
                    Text(
                        text = "确定要清空回收站吗？所有 ${deletedCapsules.size} 枚胶囊将被永久删除。此操作不可撤销。",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            viewModel.emptyTrash()
                            snackbarMessage = "已清空回收站"
                            showEmptyTrashConfirmDialog = false
                        }
                    ) {
                        Text(
                            text = "清空",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { showEmptyTrashConfirmDialog = false }
                    ) {
                        Text(
                            text = "取消",
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            )
        }

        // Snackbar
        AnimatedVisibility(
            visible = snackbarMessage != null,
            enter = slideInVertically { it } + fadeIn(),
            exit = slideOutVertically { it } + fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.secondary,
                shadowElevation = 8.dp,
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = snackbarMessage ?: "",
                    fontFamily = FontFamily.Monospace,
                    color = Color.White,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }

    // Auto-hide snackbar
    LaunchedEffect(snackbarMessage) {
        if (snackbarMessage != null) {
            delay(2000)
            snackbarMessage = null
        }
    }
}

@Composable
private fun EmptyTrashState(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "trash_empty_state")

    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -6f,
        targetValue = 6f,
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
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .offset(y = floatOffset.dp)
                .scale(scale)
        ) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.error.copy(alpha = 0.3f)
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
                    text = "[ 回收站空 ]",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "没有已删除的胶囊",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun TrashCapsuleItem(
    capsule: CapsuleEntity,
    onRestore: () -> Unit,
    onPermanentDelete: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    // Type icon
    val typeIcon = when (capsule.type) {
        "text" -> Icons.Default.Description
        "image" -> Icons.Default.Image
        "audio" -> Icons.Default.Mic
        else -> Icons.Default.Circle
    }

    // Status color for original status
    val statusColor = when (capsule.status) {
        "DRAFT" -> Color(0xFF6B7280)
        "PENDING" -> Color(0xFF3B82F6)
        "ARCHIVED" -> Color(0xFF10B981)
        else -> Color(0xFF6B7280)
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { expanded = !expanded },
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.3f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Type icon
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                color = MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(6.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = typeIcon,
                            contentDescription = capsule.type,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = capsule.content ?: "[${capsule.type.uppercase()}]",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 14.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.widthIn(max = 200.dp)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "原状态: ${
                                when (capsule.status) {
                                    "DRAFT" -> "草稿"
                                    "PENDING" -> "待回港"
                                    "ARCHIVED" -> "已归档"
                                    else -> capsule.status
                                }
                            }",
                            fontFamily = FontFamily.Monospace,
                            color = statusColor.copy(alpha = 0.7f),
                            fontSize = 11.sp
                        )
                    }
                }

                Row {
                    Text(
                        text = "#${capsule.id}",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = MaterialTheme.colorScheme.error.copy(alpha = 0.2f))
                Spacer(modifier = Modifier.height(12.dp))

                // Deleted timestamp
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "删除时间",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        fontSize = 11.sp
                    )
                    Text(
                        text = formatTimestamp(capsule.deletedAt ?: capsule.timestamp),
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.error.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Restore button
                    OutlinedButton(
                        onClick = onRestore,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.secondary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Restore,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "恢复",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    }

                    // Permanent delete button
                    OutlinedButton(
                        onClick = onPermanentDelete,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteForever,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "永久删除",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(timestamp))
}