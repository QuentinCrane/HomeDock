package com.personalbase.terminal.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

/**
 * 待办事项数据访问对象（DAO）- Room数据库操作接口
 * 
 * 提供完整的CRUD操作及多种查询方式：
 * - 按状态查询（全部/活跃/已完成）
 * - 按ID查询（本地ID和数据库ID）
 * - 状态更新（完成/同步）
 */
@Dao
interface TodoDao {
    // 插入待办，冲突策略为替换（根据主键）
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(todo: TodoEntity): Long

    // 更新待办
    @Update
    suspend fun update(todo: TodoEntity)

    // 删除待办
    @Delete
    suspend fun delete(todo: TodoEntity)

    // 获取所有待办，按截止日期升序、创建时间降序排列
    @Query("SELECT * FROM todos ORDER BY dueDate ASC, createdAt DESC LIMIT 100")
    fun getAllTodos(): Flow<List<TodoEntity>>

    // 获取未完成的待办，按截止日期升序排列
    @Query("SELECT * FROM todos WHERE completed = 0 ORDER BY dueDate ASC, createdAt DESC LIMIT 100")
    fun getActiveTodos(): Flow<List<TodoEntity>>

    // 获取已完成的待办，按更新时间降序排列
    @Query("SELECT * FROM todos WHERE completed = 1 ORDER BY updatedAt DESC LIMIT 100")
    fun getCompletedTodos(): Flow<List<TodoEntity>>

    // 根据本地ID查询待办（用于同步时查找对应项）
    @Query("SELECT * FROM todos WHERE localId = :localId LIMIT 1")
    suspend fun getTodoByLocalId(localId: String): TodoEntity?

    // 根据数据库ID查询待办
    @Query("SELECT * FROM todos WHERE id = :id LIMIT 1")
    suspend fun getTodoById(id: Int): TodoEntity?

    // 获取所有待办列表（一次性查询，用于同步）
    @Query("SELECT * FROM todos")
    suspend fun getAllTodosList(): List<TodoEntity>

    // 更新待办的完成状态
    @Query("UPDATE todos SET completed = :completed, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateCompleted(id: Int, completed: Boolean, updatedAt: Long)

    // 更新待办的同步时间戳（同步成功后调用）
    @Query("UPDATE todos SET syncedAt = :syncedAt WHERE localId = :localId")
    suspend fun updateSyncedAt(localId: String, syncedAt: Long)
}