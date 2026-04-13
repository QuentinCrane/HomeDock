package com.personalbase.terminal.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 同步状态枚举 - 跟踪胶囊的服务器同步状态
 */
enum class SyncStatus {
    SYNCED,       // 成功上传
    PENDING_SYNC, // 等待同步
    SYNCING,      // 正在上传
    FAILED        // 上传失败
}

/**
 * 胶囊实体类 - 表示一个独立的胶囊数据单元
 * 
 * 胶囊是系统中的核心数据单位，用于存储三种类型的内容：
 * - text: 文字内容
 * - image: 图片内容
 * - audio: 录音内容
 * 
 * 状态流转：DRAFT(草稿) -> PENDING(待回港) -> ARCHIVED(已归档)
 */
@Entity(tableName = "capsules")
data class CapsuleEntity(
    // 主键，自增
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    // 胶囊类型：text/image/audio
    val type: String, // "text", "image", "audio"
    // 文字内容（text类型时使用）
    val content: String?,
    // 本地文件路径（image/audio类型时使用，指向本地存储的媒体文件）
    val filePath: String?, // Local file path
    // 创建时间戳，用于排序
    val timestamp: Long,
    // 状态：DRAFT-草稿 / PENDING-待回港 / ARCHIVED-已归档
    val status: String, // "DRAFT", "PENDING", "ARCHIVED"
    // 同步状态：SYNCED-已同步 / PENDING_SYNC-等待同步 / SYNCING-同步中 / FAILED-同步失败
    val syncStatus: SyncStatus = SyncStatus.PENDING_SYNC,
    // 最后输入提示，用于显示"刚刚保存为草稿"等提示信息
    val lastInputHint: String? = null, // For showing "刚刚保存为草稿" etc.
    // 收藏状态
    val favorite: Boolean = false,
    // 软删除时间戳 - null 表示未删除，非 null 表示已删除（值为删除时的时间戳）
    val deletedAt: Long? = null
)
