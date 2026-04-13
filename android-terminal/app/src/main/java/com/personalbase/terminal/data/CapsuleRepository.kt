package com.personalbase.terminal.data

import kotlinx.coroutines.flow.Flow

/**
 * 胶囊仓库类 - 封装胶囊数据的业务逻辑
 * 
 * 仓库模式（Repository Pattern）实现：
 * - 对上层（ViewModel）隐藏数据访问细节
 * - 协调本地Room数据库与远程API的数据操作
 * - 提供Flow类型的响应式数据接口
 * 
 * 数据流向：
 * [ViewModel] --调用--> [CapsuleRepository] --操作--> [CapsuleDao] --读写--> [Room DB]
 */
class CapsuleRepository(private val dao: CapsuleDao) {
    // 草稿胶囊列表（Flow响应式）
    val draftCapsules: Flow<List<CapsuleEntity>> = dao.getDraftCapsules()
    // 待回港胶囊列表
    val pendingCapsules: Flow<List<CapsuleEntity>> = dao.getPendingCapsules()
    // 已归档胶囊列表
    val archivedCapsules: Flow<List<CapsuleEntity>> = dao.getArchivedCapsules()
    // 草稿数量计数
    val draftCount: Flow<Int> = dao.getDraftCount()
    // 待回港数量计数
    val pendingCount: Flow<Int> = dao.getPendingCount()
    // 已归档数量计数
    val archivedCount: Flow<Int> = dao.getArchivedCount()
    // 同步失败数量计数
    val failedCount: Flow<Int> = dao.getFailedCount()
    // 已删除胶囊列表（回收站）
    val deletedCapsules: Flow<List<CapsuleEntity>> = dao.getDeletedCapsules()

    /**
     * 添加新胶囊
     * @param type 胶囊类型：text/image/audio
     * @param content 文字内容
     * @param filePath 媒体文件本地路径
     * @param asDraft 是否作为草稿保存（否则为待回港状态）
     */
    suspend fun addCapsule(type: String, content: String?, filePath: String?, asDraft: Boolean = false) {
        val entity = CapsuleEntity(
            type = type,
            content = content,
            filePath = filePath,
            timestamp = System.currentTimeMillis(),
            // 根据asDraft参数决定初始状态
            status = if (asDraft) "DRAFT" else "PENDING",
            lastInputHint = null
        )
        dao.insert(entity)
    }

    // 将胶囊标记为已归档状态
    suspend fun markAsArchived(capsule: CapsuleEntity) {
        dao.update(capsule.copy(status = "ARCHIVED"))
    }

    // 将胶囊标记为待回港状态
    suspend fun markAsPending(capsule: CapsuleEntity) {
        dao.update(capsule.copy(status = "PENDING"))
    }

    // 将胶囊标记为草稿状态
    suspend fun markAsDraft(capsule: CapsuleEntity) {
        dao.update(capsule.copy(status = "DRAFT"))
    }

    // 更新胶囊的输入提示（如"刚刚保存为草稿"）
    suspend fun updateLastInputHint(capsule: CapsuleEntity, hint: String) {
        dao.update(capsule.copy(lastInputHint = hint))
    }
    
    // 获取待回港胶囊列表（用于批量回港操作）
    suspend fun getPendingList() = dao.getPendingCapsulesList()

    // 更新胶囊同步状态
    suspend fun updateSyncStatus(capsuleId: Int, status: SyncStatus) {
        dao.updateSyncStatus(capsuleId, status.name)
    }

    // 获取同步失败的胶囊列表
    suspend fun getFailedCapsules() = dao.getFailedCapsules()

    // 重置胶囊同步状态为 PENDING_SYNC（用于重试）
    suspend fun resetSyncStatus(capsuleId: Int) {
        dao.resetSyncStatus(capsuleId)
    }

    // 删除胶囊（软删除 - 设置 deletedAt 时间戳）
    suspend fun deleteCapsule(capsule: CapsuleEntity) {
        dao.softDelete(capsule.id, System.currentTimeMillis())
    }

    // 永久删除胶囊（用于清空回收站中的单个胶囊）
    suspend fun permanentDeleteCapsule(id: Int) {
        dao.permanentDelete(id)
    }

    // 清空回收站（删除所有已软删除的胶囊）
    suspend fun emptyTrash() {
        dao.emptyTrash()
    }

    // 恢复胶囊（清除 deletedAt）
    suspend fun restoreCapsule(id: Int) {
        dao.restore(id)
    }

    // 通过ID获取胶囊
    suspend fun getCapsuleById(id: Int): CapsuleEntity? {
        return dao.getCapsuleById(id)
    }

    // 更新胶囊内容
    suspend fun updateCapsule(capsule: CapsuleEntity) {
        dao.update(capsule)
    }

    // 切换收藏状态
    suspend fun toggleFavorite(capsule: CapsuleEntity) {
        dao.update(capsule.copy(favorite = !capsule.favorite))
    }

    // 获取收藏胶囊列表
    fun getFavoriteCapsules(): Flow<List<CapsuleEntity>> {
        return dao.getFavoriteCapsules()
    }
}
