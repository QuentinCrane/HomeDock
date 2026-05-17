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
 * 同步机制：
 * - localId: 客户端生成的UUID，用于标识本地创建的todo
 * - serverId: 服务器分配的数据库ID，用于同步时识别服务器上的记录
 * - syncedAt: 标记最后同步时间
 * 
 * 同步流程：
 * 1. 本地创建todo时生成localId，serverId为null
 * 2. 同步时，服务器返回serverId，本地保存serverId
 * 3. 后续同步时，本地发送serverId告知服务器更新哪个记录
 */
@Entity(tableName = "todos")
data class TodoEntity(
    // 本地数据库主键（自动生成）
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    // 服务器数据库ID（同步后由服务器分配，null表示未同步到服务器）
    val serverId: Int? = null,
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