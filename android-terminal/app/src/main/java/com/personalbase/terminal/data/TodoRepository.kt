package com.personalbase.terminal.data

import kotlinx.coroutines.flow.Flow

class TodoRepository(private val dao: TodoDao) {
    val allTodos: Flow<List<TodoEntity>> = dao.getAllTodos()
    val activeTodos: Flow<List<TodoEntity>> = dao.getActiveTodos()
    val completedTodos: Flow<List<TodoEntity>> = dao.getCompletedTodos()

    suspend fun addTodo(title: String, description: String? = null, dueDate: Long? = null): Long {
        val entity = TodoEntity(
            title = title,
            description = description,
            dueDate = dueDate
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

    suspend fun getAllTodosList(): List<TodoEntity> {
        return dao.getAllTodosList()
    }

    suspend fun markSynced(localId: String) {
        dao.updateSyncedAt(localId, System.currentTimeMillis())
    }
}