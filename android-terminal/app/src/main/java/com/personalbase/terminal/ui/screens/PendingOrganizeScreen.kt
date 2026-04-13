/**
 * PendingOrganizeScreen - 待整理屏幕
 * 
 * 屏幕功能：
 * - 显示所有待整理的胶囊（来自服务器的 PENDING 状态）
 * - 支持对胶囊进行整理操作：归档/Wall/回响/删除
 * - 实时显示整理结果
 * 
 * 状态管理：
 * - pendingCapsules: 来自 ViewModel 的待整理胶囊列表
 * - selectedCapsule: 当前选中的胶囊
 * - isLoading: 加载状态
 * 
 * 用户交互：
 * - 点击胶囊展开详情
 * - 选择整理动作：归档/Wall/回响/删除
 * - 确认后执行整理操作
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
import androidx.compose.ui.draw.clip
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
fun PendingOrganizeScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val pending by viewModel.pendingCapsules.collectAsState(initial = emptyList())
    var selectedCapsule by remember { mutableStateOf<CapsuleEntity?>(null) }
    var showOrganizeDialog by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
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
            enter = fadeIn(tween(400)) + scaleIn(initialScale = 0.98f, animationSpec = tween(400))
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
                        text = "待整理",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                    
                    Text(
                        text = "${pending.size} 枚",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.secondary,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Info banner
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "这些胶囊已同步到服务器，等待整理",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Capsule list or empty state
                if (pending.isEmpty()) {
                    EmptyPendingState(modifier = Modifier.weight(1f))
                } else {
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        items(pending, key = { it.id }) { capsule ->
                            PendingCapsuleItem(
                                capsule = capsule,
                                onOrganize = {
                                    selectedCapsule = capsule
                                    showOrganizeDialog = true
                                }
                            )
                        }
                    }
                }
            }
        }

        // Organize dialog
        if (showOrganizeDialog && selectedCapsule != null) {
            OrganizeDialog(
                capsule = selectedCapsule!!,
                onDismiss = {
                    showOrganizeDialog = false
                    selectedCapsule = null
                },
                onOrganize = { action ->
                    viewModel.organizeCapsule(selectedCapsule!!.id, action)
                    showOrganizeDialog = false
                    selectedCapsule = null
                    snackbarMessage = "整理成功"
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
private fun EmptyPendingState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f),
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "[ 无待整理 ]",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            fontSize = 16.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "所有胶囊都已整理完毕",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
            fontSize = 12.sp
        )
    }
}

@Composable
private fun PendingCapsuleItem(
    capsule: CapsuleEntity,
    onOrganize: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val infiniteTransition = rememberInfiniteTransition(label = "pending_item")
    val dotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dot_alpha"
    )

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { expanded = !expanded },
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Status dot
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                MaterialTheme.colorScheme.primary.copy(alpha = dotAlpha),
                                shape = androidx.compose.foundation.shape.CircleShape
                            )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "[${capsule.type.uppercase()}]",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.secondary,
                        fontSize = 12.sp
                    )
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

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = capsule.content ?: "媒体文件",
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 13.sp,
                maxLines = if (expanded) Int.MAX_VALUE else 2,
                overflow = TextOverflow.Ellipsis
            )

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = onOrganize,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "整理",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OrganizeDialog(
    capsule: CapsuleEntity,
    onDismiss: () -> Unit,
    onOrganize: (String) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "整理胶囊",
                fontFamily = FontFamily.Monospace
            )
        },
        text = {
            Column {
                Text(
                    text = "选择整理方式：",
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action buttons
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OrganizeActionButton(
                        icon = Icons.Default.Archive,
                        label = "归档",
                        description = "将胶囊归档保存",
                        color = MaterialTheme.colorScheme.secondary,
                        onClick = { onOrganize("archive") }
                    )
                    OrganizeActionButton(
                        icon = Icons.Default.Grid3x3,
                        label = "Wall",
                        description = "发送到碎片墙",
                        color = MaterialTheme.colorScheme.primary,
                        onClick = { onOrganize("wall") }
                    )
                    OrganizeActionButton(
                        icon = Icons.Default.Loop,
                        label = "回响",
                        description = "发送到回响池",
                        color = Color(0xFFa78bfa),
                        onClick = { onOrganize("echo") }
                    )
                    OrganizeActionButton(
                        icon = Icons.Default.Delete,
                        label = "删除",
                        description = "从服务器删除",
                        color = MaterialTheme.colorScheme.error,
                        onClick = { onOrganize("delete") }
                    )
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "取消",
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    )
}

@Composable
private fun OrganizeActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    description: String,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, color.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = label,
                    fontFamily = FontFamily.Monospace,
                    color = color,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = description,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 11.sp
                )
            }
        }
    }
}
