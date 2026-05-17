package com.personalbase.terminal.data

import kotlinx.coroutines.flow.Flow

class TodoRepository(private val dao: TodoDao) {
    val allTodos: Flow<List<TodoEntity>> = dao.getAllTodos()
    val activeTodos: Flow<List<TodoEntity>> = dao.getActiveTodos()
    val completedTodos: Flow<List<TodoEntity>> = dao.getCompletedTodos()

    suspend fun addTodo(title: String, description: String? = null, dueDate: Long? = null, importance: Int = 0): Long {
        val entity = TodoEntity(
            title = title,
            description = description,
            dueDate = dueDate,
            importance = importance
        )
        return dao.insert(entity)
    }

    suspend fun updateTodo(todo: TodoEntity) {
        dao.update(todo.copy(updatedAt = System.currentTimeMillis()))
    }

    suspend fun deleteTodo(todo: TodoEntity) {
        dao.delete(todo)
    }

    suspend fun toggleCompleted(todo: TodoEntity) {
        dao.updateCompleted(todo.id, !todo.completed, System.currentTimeMillis())
    }

    suspend fun getTodoByLocalId(localId: String): TodoEntity? {
        return dao.getTodoByLocalId(localId)
    }

    suspend fun getTodoByServerId(serverId: Int): TodoEntity? {
        return dao.getTodoByServerId(serverId)
    }

    suspend fun getAllTodosList(): List<TodoEntity> {
        return dao.getAllTodosList()
    }

    suspend fun markSynced(localId: String) {
        dao.updateSyncedAt(localId, System.currentTimeMillis())
    }

    /**
     * 更新待办的serverId（同步后调用，建立本地与服务器的关联）
     */
    suspend fun updateServerId(localId: String, serverId: Int) {
        dao.updateServerIdByLocalId(localId, serverId, System.currentTimeMillis())
    }

    /**
     * 根据serverId更新待办内容（从服务器拉取更新后调用）
     */
    suspend fun updateByServerId(
        serverId: Int,
        title: String,
        description: String?,
        dueDate: Long?,
        completed: Boolean,
        updatedAt: Long,
        importance: Int
    ) {
        dao.updateByServerId(
            serverId = serverId,
            title = title,
            description = description,
            dueDate = dueDate,
            completed = completed,
            updatedAt = updatedAt,
            syncedAt = System.currentTimeMillis(),
            importance = importance
        )
    }

    /**
     * 直接插入一个 TodoEntity（用于从服务器拉取后存入本地）
     */
    suspend fun insertTodo(entity: TodoEntity): Long {
        return dao.insert(entity)
    }

    /**
     * 直接插入一个 TodoEntity（用于从服务器拉取后存入本地）
     * 如果本地已存在相同localId的记录，则更新serverId
     */
    suspend fun insertOrUpdateWithServerId(entity: TodoEntity): Long {
        val existing = dao.getTodoByLocalId(entity.localId)
        return if (existing != null) {
            // 本地已存在，更新serverId
            dao.updateServerIdByLocalId(entity.localId, entity.serverId ?: 0, System.currentTimeMillis())
            existing.id.toLong()
        } else {
            // 本地不存在，插入新记录
            dao.insert(entity)
        }
    }

    /**
     * 根据服务器返回的localId->serverId映射批量更新本地记录
     */
    suspend fun batchUpdateServerId(mapping: List<Pair<String, Int>>) {
        val now = System.currentTimeMillis()
        mapping.forEach { (localId, serverId) ->
            dao.updateServerIdBatch(localId, serverId, now)
        }
    }
}