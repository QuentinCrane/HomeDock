package com.personalbase.terminal.data

import androidx.room.Dao
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

    // 获取所有草稿胶囊，按时间倒序排列
    @Query("SELECT * FROM capsules WHERE status = 'DRAFT' ORDER BY timestamp DESC")
    fun getDraftCapsules(): Flow<List<CapsuleEntity>>

    // 获取所有待回港胶囊，按时间倒序排列
    @Query("SELECT * FROM capsules WHERE status = 'PENDING' ORDER BY timestamp DESC")
    fun getPendingCapsules(): Flow<List<CapsuleEntity>>

    // 获取所有已归档胶囊，按时间倒序排列
    @Query("SELECT * FROM capsules WHERE status = 'ARCHIVED' ORDER BY timestamp DESC")
    fun getArchivedCapsules(): Flow<List<CapsuleEntity>>

    // 获取待回港胶囊列表（一次性查询，用于回港同步）
    @Query("SELECT * FROM capsules WHERE status = 'PENDING'")
    suspend fun getPendingCapsulesList(): List<CapsuleEntity>

    // 草稿胶囊数量，用于UI显示徽标
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'DRAFT'")
    fun getDraftCount(): Flow<Int>

    // 待回港胶囊数量
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'PENDING'")
    fun getPendingCount(): Flow<Int>

    // 已归档胶囊数量
    @Query("SELECT COUNT(*) FROM capsules WHERE status = 'ARCHIVED'")
    fun getArchivedCount(): Flow<Int>
}
