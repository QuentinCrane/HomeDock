package com.personalbase.terminal.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

/**
 * 待办事项实体类 - 表示一个待办任务
 * 
 * 功能：
 * - 存储待办事项的标题、描述、截止日期
 * - 跟踪完成状态
 * - 支持本地与服务器同步
 * 
 * 同步机制：通过localId实现本地与服务器的关联，syncedAt标记最后同步时间
 */
@Entity(tableName = "todos")
data class TodoEntity(
    // 数据库主键（服务器端生成）
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    // 本地唯一标识符，用于本地与服务器数据关联
    val localId: String = UUID.randomUUID().toString(),
    // 待办事项标题（必填）
    val title: String,
    // 详细描述（可选）
    val description: String? = null,
    // 截止日期时间戳（毫秒，可选）
    val dueDate: Long? = null,
    // 是否已完成
    val completed: Boolean = false,
    // 创建时间戳
    val createdAt: Long = System.currentTimeMillis(),
    // 最后更新时间戳（每次修改时自动更新）
    val updatedAt: Long? = null,
    // 最后同步到服务器的时间戳
    val syncedAt: Long? = null,
    // 关联的日历事件ID（用于日历集成）
    val calendarEventId: String? = null,
    // 重要性等级（1-5星，0 = 未设置）
    val importance: Int = 0
)