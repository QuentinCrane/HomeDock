package com.personalbase.terminal.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// ============================================================================
// HomeDock Design System - 统一样式定义
// 
// 功能说明：
// - 定义全局统一的圆角系统
// - 提供组件级别的形状定义（卡片、按钮、对话框等）
// 
// 圆角系统：
// - small: 4dp - 用于小元素、标签、chips
// - medium: 8dp - 用于按钮、输入框、小卡片
// - large: 12dp - 用于中等卡片、列表项
// - extraLarge: 16dp - 用于对话框、模态框、大卡片
// 
// 使用场景：
// - Cards: medium (8dp)
// - Buttons: small (4dp)  
// - Modals/Dialogs: extraLarge (16dp)
// - Input fields: small (4dp)
// ============================================================================

/**
 * HomeDock 统一的形状系统
 * 
 * 所有组件应使用此 Shapes 定义，而非硬编码圆角值
 */
val HomeDockShapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(12.dp),
    extraLarge = RoundedCornerShape(16.dp)
)

/**
 * 根据指定的圆角值创建动态 Shapes
 * 用于用户自定义圆角设置
 * 
 * @param cornerRadius 用户选择的圆角值（4, 8, 12, 16）
 */
fun createDynamicShapes(cornerRadius: Int): Shapes {
    val radius = cornerRadius.dp
    return Shapes(
        small = RoundedCornerShape(radius),
        medium = RoundedCornerShape(radius),
        large = RoundedCornerShape(radius),
        extraLarge = RoundedCornerShape(radius)
    )
}

/**
 * 预设的主色调调色板
 * 用于颜色选择器
 */
val PresetPrimaryColors = listOf(
    0xFF3B82F6.toInt(), // Blue
    0xFF10B981.toInt(), // Green
    0xFFEF4444.toInt(), // Red
    0xFFF59E0B.toInt(), // Yellow/Amber
    0xFF8B5CF6.toInt(), // Purple
    0xFFEC4899.toInt(), // Pink
    0xFF06B6D4.toInt(), // Cyan
    0xFFF97316.toInt()  // Orange
)

/**
 * 预设的副色调调色板
 * 用于颜色选择器
 */
val PresetSecondaryColors = listOf(
    0xFF10B981.toInt(), // Green
    0xFF3B82F6.toInt(), // Blue
    0xFFEF4444.toInt(), // Red
    0xFFF59E0B.toInt(), // Yellow/Amber
    0xFF8B5CF6.toInt(), // Purple
    0xFFEC4899.toInt(), // Pink
    0xFF06B6D4.toInt(), // Cyan
    0xFFF97316.toInt()  // Orange
)

/**
 * 可选的圆角预设值
 */
val BorderRadiusOptions = listOf(4, 8, 12, 16)
