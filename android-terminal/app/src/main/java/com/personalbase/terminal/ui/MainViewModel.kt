/**
 * MainViewModel - 主视图模型，负责管理应用的核心状态和业务逻辑
 * 
 * 功能说明：
 * - 管理胶囊（Capsule）的草稿、待回港、已归档三种状态
 * - 管理待办事项（Todo）的本地存储和服务器同步
 * - 通过 NsdHelper 进行 mDNS 广播发现主基地
 * - 处理"回港"操作：将待回港的胶囊上传到主基地
 */
package com.personalbase.terminal.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.personalbase.terminal.TerminalApp
import com.personalbase.terminal.data.BaseApi
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.data.CalendarHelper
import com.personalbase.terminal.data.TodoEntity
import com.personalbase.terminal.data.TodoSyncItem
import com.personalbase.terminal.nsd.NsdHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File

class MainViewModel(application: Application) : AndroidViewModel(application) {
    // 获取应用实例和仓储（Repository）以访问本地数据库
    private val app = application as TerminalApp
    private val repository = app.repository
    private val todoRepository = app.todoRepository
    
    // NsdHelper：用于通过 mDNS/Bonjour 发现局域网内的主基地服务
    // CalendarHelper：用于创建日历事件（待办事项的日历集成）
    private val nsdHelper = NsdHelper(application)
    private val calendarHelper = CalendarHelper(application)
    
    // -------------------- 暴露给 UI 的状态流 --------------------
    // 这些 StateFlow 被 UI 层收集，状态变化时会自动触发 UI 更新
    
    // 胶囊状态流
    val draftCapsules = repository.draftCapsules
    val pendingCapsules = repository.pendingCapsules
    val archivedCapsules = repository.archivedCapsules
    val draftCount = repository.draftCount
    val pendingCount = repository.pendingCount
    val archivedCount = repository.archivedCount
    
    // 待办事项状态流
    val todos = todoRepository.allTodos
    val activeTodos = todoRepository.activeTodos
    val completedTodos = todoRepository.completedTodos
    
    // 主基地 IP 地址（通过 mDNS 自动发现或手动设置）
    val baseIp = nsdHelper.discoveredIp

    private val _syncState = MutableStateFlow<String>("IDLE")
    val syncState: StateFlow<String> = _syncState.asStateFlow()

    private val _todoSyncState = MutableStateFlow<String>("IDLE")
    val todoSyncState: StateFlow<String> = _todoSyncState.asStateFlow()

    init {
        // 启动时自动开始 mDNS 发现，搜索局域网内的主基地
        nsdHelper.startDiscovery()
    }

    override fun onCleared() {
        super.onCleared()
        nsdHelper.stopDiscovery()
    }

    /**
     * 手动设置主基地 IP 地址
     * 当 mDNS 自动发现失败时，用户可以通过此方法手动输入 IP
     * @param ip 主基地的 IP 地址，格式如 http://192.168.1.100
     */
    fun setManualIp(ip: String) {
        nsdHelper.setManualIp(ip)
    }

    /**
     * 添加胶囊（采集）
     * @param type 胶囊类型：text、image、audio
     * @param content 文字内容（对于图片/录音可为 null）
     * @param filePath 媒体文件路径（对于文字类型可为 null）
     * @param asDraft 是否保存为草稿，true=草稿，false=待回港
     */
    fun addCapsule(type: String, content: String?, filePath: String?, asDraft: Boolean = false) {
        viewModelScope.launch {
            repository.addCapsule(type, content, filePath, asDraft)
        }
    }

    // ==================== 待办事项管理 ====================

    /**
     * 添加新的待办事项
     * @param title 待办标题
     * @param description 可选的描述
     * @param dueDate 可选的截止日期（时间戳）
     */
    fun addTodo(title: String, description: String? = null, dueDate: Long? = null) {
        viewModelScope.launch {
            todoRepository.addTodo(title, description, dueDate)
        }
    }

    fun updateTodo(todo: TodoEntity) {
        viewModelScope.launch {
            todoRepository.updateTodo(todo)
        }
    }

    fun deleteTodo(todo: TodoEntity) {
        viewModelScope.launch {
            todoRepository.deleteTodo(todo)
        }
    }

    fun toggleTodoCompleted(todo: TodoEntity) {
        viewModelScope.launch {
            todoRepository.toggleCompleted(todo)
        }
    }

    // ==================== 日历集成 ====================

    /**
     * 创建日历事件（将待办事项同步到系统日历）
     * @return 是否创建成功
     */
    fun createCalendarEvent(title: String, description: String? = null, dueDate: Long? = null): Boolean {
        return calendarHelper.createCalendarEvent(title, description, dueDate)
    }

    /**
     * 打开系统日历应用
     */
    fun openCalendar(): Boolean {
        return calendarHelper.openCalendar()
    }

    // ==================== 待办事项同步 ====================

    /**
     * 将本地待办事项同步到主基地服务器
     * 
     * 同步流程：
     * 1. 检查是否已发现主基地（baseIp）
     * 2. 获取所有本地待办事项
     * 3. 构建 TodoSyncItem 列表
     * 4. 通过 Retrofit 调用服务器的 /api/sync/todos 接口
     * 5. 成功后标记所有待办为已同步状态
     */
    fun syncTodos() {
        val ip = baseIp.value
        if (ip == null) {
            _todoSyncState.value = "ERROR: No Base Found"
            return
        }

        viewModelScope.launch {
            _todoSyncState.value = "SYNCING"
            try {
                val localTodos = todoRepository.getAllTodosList()
                if (localTodos.isEmpty()) {
                    _todoSyncState.value = "IDLE"
                    return@launch
                }

                val client = OkHttpClient.Builder().build()
                val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
                val retrofit = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val api = retrofit.create(BaseApi::class.java)

                // Upload local todos
                val syncItems = localTodos.map { todo ->
                    TodoSyncItem(
                        localId = todo.localId,
                        title = todo.title,
                        description = todo.description,
                        dueDate = todo.dueDate,
                        completed = todo.completed,
                        createdAt = todo.createdAt,
                        updatedAt = todo.updatedAt,
                        calendarEventId = todo.calendarEventId,
                        serverId = null
                    )
                }

                val response = api.syncTodos(syncItems)
                if (response.isSuccessful && response.body()?.success == true) {
                    // 同步成功，标记所有本地待办为已同步
                    localTodos.forEach { todo ->
                        todoRepository.markSynced(todo.localId)
                    }
                    _todoSyncState.value = "IDLE"
                } else {
                    _todoSyncState.value = "PARTIAL_SUCCESS"
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _todoSyncState.value = "ERROR: ${e.message}"
            }
        }
    }

    /**
     * 回港操作：将所有待回港的胶囊上传到主基地
     * 
     * 回港流程：
     * 1. 检查主基地连接状态
     * 2. 获取所有待回港胶囊（PENDING 状态）
     * 3. 逐个上传胶囊到服务器（包含文件上传）
     * 4. 上传成功后标记为已归档（ARCHIVED）状态
     */
    fun returnToPort() {
        val ip = baseIp.value
        if (ip == null) {
            _syncState.value = "ERROR: No Base Found"
            return
        }
        
        viewModelScope.launch {
            _syncState.value = "SYNCING"
            val pending = repository.getPendingList()
            if (pending.isEmpty()) {
                _syncState.value = "IDLE"
                return@launch
            }

            val client = OkHttpClient.Builder().build()
            val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val api = retrofit.create(BaseApi::class.java)

            var successCount = 0
            for (capsule in pending) {
                try {
                    val typeReq = capsule.type.toRequestBody("text/plain".toMediaTypeOrNull())
                    val contentReq = capsule.content?.toRequestBody("text/plain".toMediaTypeOrNull())
                    val tsReq = capsule.timestamp.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                    // 将 Android 状态映射到 Web 状态
                    // Android: DRAFT/PENDING/ARCHIVED -> Web: draft/pending/archived
                    val statusValue = when (capsule.status) {
                        "DRAFT" -> "draft"
                        "ARCHIVED" -> "archived"
                        else -> "pending"  // PENDING and default -> pending
                    }
                    val statusReq = statusValue.toRequestBody("text/plain".toMediaTypeOrNull())
                    
                    var filePart: MultipartBody.Part? = null
                    if (capsule.filePath != null) {
                        val file = File(capsule.filePath)
                        if (file.exists()) {
                            val fileReq = file.asRequestBody("multipart/form-data".toMediaTypeOrNull())
                            filePart = MultipartBody.Part.createFormData("file", file.name, fileReq)
                        }
                    }

                    val response = api.uploadCapsule(typeReq, contentReq, tsReq, statusReq, filePart)
                    if (response.isSuccessful && response.body()?.success == true) {
                        repository.markAsArchived(capsule)
                        successCount++
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            _syncState.value = if (successCount == pending.size) "IDLE" else "PARTIAL_SUCCESS"
        }
    }
}
