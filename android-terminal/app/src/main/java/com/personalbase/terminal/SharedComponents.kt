package com.personalbase.terminal

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.data.CapsuleEntity

// ============================================================================
// SHARED COMPONENTS - Reusable UI components across screens
// ============================================================================

// ============================================================================
// SNACKBAR STATE / 提示状态管理
// ============================================================================

/**
 * 提示类型枚举 - 用于区分不同类型的提示消息
 * SUCCESS: 成功提示
 * ERROR: 错误提示
 * INFO: 信息提示
 */
enum class SnackbarType {
    SUCCESS,
    ERROR,
    INFO
}

/**
 * 提示状态数据类 - 管理应用内的提示消息状态
 * @property message 显示的消息内容
 * @property type 提示类型
 * @property isVisible 是否可见
 */
data class SnackbarState(
    val message: String = "",
    val type: SnackbarType = SnackbarType.INFO,
    val isVisible: Boolean = false
)

// ============================================================================
// SHIMMER EFFECT / 骨架屏加载效果
// ============================================================================

@Composable
fun ShimmerEffect(
    modifier: Modifier = Modifier,
    widthOfShadowBrush: Int = 500,
    angleOfAxisY: Float = 270f,
    durationMillis: Int = 1000
) {
    val shimmerColors = listOf(
        Color(0xFF1A1D24).copy(alpha = 0.3f),
        Color(0xFF2A2E37).copy(alpha = 0.5f),
        Color(0xFF1A1D24).copy(alpha = 0.3f)
    )

    val transition = androidx.compose.animation.core.rememberInfiniteTransition(label = "shimmer")
    val translateAnim by transition.animateFloat(
        initialValue = 0f,
        targetValue = (durationMillis + widthOfShadowBrush).toFloat(),
        animationSpec = androidx.compose.animation.core.infiniteRepeatable(
            animation = androidx.compose.animation.core.tween(durationMillis, easing = androidx.compose.animation.core.LinearEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )

    Box(
        modifier = modifier
            .background(Color(0xFF1A1D24))
    ) {
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    brush = Brush.linearGradient(
                        colors = shimmerColors,
                        start = androidx.compose.ui.geometry.Offset(translateAnim, 0f),
                        end = androidx.compose.ui.geometry.Offset(
                            translateAnim + widthOfShadowBrush,
                            angleOfAxisY
                        )
                    )
                )
        )
    }
}

@Composable
fun ShimmerCapsuleItem(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            ShimmerEffect(
                modifier = Modifier
                    .width(60.dp)
                    .height(12.dp)
            )
            ShimmerEffect(
                modifier = Modifier
                    .width(80.dp)
                    .height(12.dp)
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        ShimmerEffect(
            modifier = Modifier
                .fillMaxWidth()
                .height(16.dp)
        )
    }
}

@Composable
fun LoadingShimmerList(itemCount: Int = 5) {
    Column {
        repeat(itemCount) {
            ShimmerCapsuleItem(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .border(1.dp, Color(0xFF2A2E37))
                    .background(MaterialTheme.colorScheme.surface)
            )
        }
    }
}

// ============================================================================
// CAPSULE BOTTOM SHEET WITH SLIDE ANIMATION
// ============================================================================

@Composable
fun CapsuleBottomSheet(
    capsule: CapsuleEntity,
    onDismiss: () -> Unit,
    onDelete: () -> Unit = {},
    onFavorite: () -> Unit = {},
    onChangeStatus: (String) -> Unit = {}
) {
    val sheetHeightFraction = 0.7f

    val slideTransition = rememberInfiniteTransition(label = "sheet_slide")

    Box(modifier = Modifier.fillMaxSize()) {
        // Backdrop with fade animation
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

        // Sheet with slide-in animation
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
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
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
                        Text(
                            text = "胶囊详情",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = onDismiss) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = Color(0xFF2A2E37))
                    Spacer(modifier = Modifier.height(16.dp))

                    // Capsule details
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
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

                    Spacer(modifier = Modifier.height(12.dp))

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
                        style = TextStyle(
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 14.sp,
                            lineHeight = 22.sp
                        )
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

                    Spacer(modifier = Modifier.weight(1f))

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

                        // Favorite button
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
                            Text("收藏", fontFamily = FontFamily.Monospace)
                        }

                        // Re-submit/Edit button (only for pending)
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

@Composable
fun CapsuleDetailChip(label: String, value: String) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            Text(
                text = label,
                fontFamily = FontFamily.Monospace,
                color = Color.Gray,
                fontSize = 10.sp
            )
            Text(
                text = value,
                fontFamily = FontFamily.Monospace,
                color = MaterialTheme.colorScheme.secondary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

private fun formatTimestamp(timestamp: Long): String {
    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(timestamp))
}
