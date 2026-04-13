package com.personalbase.terminal.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

/**
 * 胶囊数据访问对象（DAO）- Room数据库操作接口
 * 
 * 数据流：
 * 1. insert() - 创建新胶囊（草稿或待回港状态）
 * 2. update() - 更新胶囊状态（如标记为已归档）
 * 3. 查询方法返回Flow，支持响应式UI更新
 */
@Dao
interface CapsuleDao {
    // 插入新胶囊，返回自增ID
    @Insert
    suspend fun insert(capsule: CapsuleEntity): Long

    // 更新胶囊（通常用于状态变更）
    @Update
    suspend fun update(capsule: CapsuleEntity)

    // 获取所有草稿胶囊，按时间倒序排列（排除已删除的）
    @Query("SELECT * FROM capsules WHERE status = 'DRAFT' AND deletedAt IS NULL ORDER BY timestamp DESC LIMIT 100")
    fun getDraftCapsules(): Flow<List<CapsuleEntity>>

    // 获取所有待回港胶囊，按时间倒序排列（排除已删除的）
    @Query("SELECT * FROM capsules WHERE status = 'PENDING' AND deletedAt IS NULL ORDER BY timestamp DESC LIMIT 100")
    fun getPendingCapsules(): Flow<List<CapsuleEntity>>

    // 获取所有已归档胶囊，按时间倒序排列（排除已删除的）
    @Query("SELECT * FROM capsules WHERE status = 'ARCHIVED' AND deletedAt IS NULL ORDER BY timestamp DESC LIMIT 100")
    fun getArchivedCapsules(): Flow<List<CapsuleEntity>>

    // 获取待回港胶囊列表（一次性查询，用于回港同步）
    @Query("SELECT * FROM capsules WHERE status = 'PENDING' AND deletedAt IS NULL LIMIT 100")
    suspend fun getPendingCapsulesList(): List<CapsuleEntity>

    // 草稿胶囊数量，用于UI显示徽标
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'DRAFT' AND deletedAt IS NULL")
    fun getDraftCount(): Flow<Int>

    // 待回港胶囊数量
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'PENDING' AND deletedAt IS NULL")
    fun getPendingCount(): Flow<Int>

    // 已归档胶囊数量
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'ARCHIVED' AND deletedAt IS NULL")
    fun getArchivedCount(): Flow<Int>

    // 软删除胶囊（设置 deletedAt 时间戳）
    @Query("UPDATE capsules SET deletedAt = :deletedAt WHERE id = :id")
    suspend fun softDelete(id: Int, deletedAt: Long)

    // 永久删除胶囊（用于清空回收站）
    @Query("DELETE FROM capsules WHERE id = :id")
    suspend fun permanentDelete(id: Int)

    // 清空回收站（删除所有已软删除的胶囊）
    @Query("DELETE FROM capsules WHERE deletedAt IS NOT NULL")
    suspend fun emptyTrash()

    // 获取所有已删除的胶囊（用于回收站界面）
    @Query("SELECT * FROM capsules WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC LIMIT 100")
    fun getDeletedCapsules(): Flow<List<CapsuleEntity>>

    // 恢复胶囊（清除 deletedAt）
    @Query("UPDATE capsules SET deletedAt = NULL WHERE id = :id")
    suspend fun restore(id: Int)

    // 更新同步状态
    @Query("UPDATE capsules SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: Int, status: String)

    // 获取同步失败的胶囊（排除已删除的）
    @Query("SELECT * FROM capsules WHERE syncStatus = 'FAILED' AND deletedAt IS NULL ORDER BY timestamp DESC LIMIT 100")
    suspend fun getFailedCapsules(): List<CapsuleEntity>

    // 获取同步失败的胶囊数量
    @Query("SELECT COUNT(*) FROM capsules WHERE syncStatus = 'FAILED' AND deletedAt IS NULL")
    fun getFailedCount(): Flow<Int>

    // 重置同步状态为 PENDING_SYNC (用于重试)
    @Query("UPDATE capsules SET syncStatus = 'PENDING_SYNC' WHERE id = :id")
    suspend fun resetSyncStatus(id: Int)

    // 获取指定ID的胶囊
    @Query("SELECT * FROM capsules WHERE id = :id")
    suspend fun getCapsuleById(id: Int): CapsuleEntity?

    // 获取所有收藏的胶囊（排除已删除的）
    @Query("SELECT * FROM capsules WHERE favorite = 1 AND deletedAt IS NULL ORDER BY timestamp DESC LIMIT 100")
    fun getFavoriteCapsules(): Flow<List<CapsuleEntity>>
}
