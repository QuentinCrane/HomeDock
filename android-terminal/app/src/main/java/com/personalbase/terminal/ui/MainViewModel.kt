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
import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.personalbase.terminal.TerminalApp
import com.personalbase.terminal.data.BaseApi
import com.personalbase.terminal.data.CapsuleEntity
import com.personalbase.terminal.data.CalendarHelper
import com.personalbase.terminal.data.SyncStatus
import com.personalbase.terminal.data.TodoEntity
import com.personalbase.terminal.data.TodoSyncItem
import com.personalbase.terminal.nsd.NsdHelper
import kotlinx.coroutines.delay
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
import java.util.concurrent.TimeUnit

/**
 * MediaRecorder configuration based on recording quality setting
 */
data class MediaRecorderConfig(
    val bitRate: Int,
    val sampleRate: Int
)

class MainViewModel(application: Application) : AndroidViewModel(application) {
    // 获取应用实例和仓储（Repository）以访问本地数据库
    private val app = application as TerminalApp
    private val repository = app.repository
    private val todoRepository = app.todoRepository
    
    // NsdHelper：用于通过 mDNS/Bonjour 发现局域网内的主基地服务
    // CalendarHelper：用于创建日历事件（待办事项的日历集成）
    private val nsdHelper = NsdHelper(application)
    private val calendarHelper = CalendarHelper(application)

    // ==================== 共享的 HTTP 客户端 ====================
    // 提取共享的 OkHttpClient 和 Retrofit 实例，避免重复创建
    // 配置连接超时 30s、读取超时 60s、写入超时 60s
    companion object {
        private val sharedOkHttpClient: OkHttpClient by lazy {
            OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build()
        }

        private fun createRetrofit(baseUrl: String): Retrofit {
            return Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(sharedOkHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
    }
    
    // -------------------- 暴露给 UI 的状态流 --------------------
    // 这些 StateFlow 被 UI 层收集，状态变化时会自动触发 UI 更新
    
    // 胶囊状态流
    val draftCapsules = repository.draftCapsules
    val pendingCapsules = repository.pendingCapsules
    val archivedCapsules = repository.archivedCapsules
    val draftCount = repository.draftCount
    val pendingCount = repository.pendingCount
    val archivedCount = repository.archivedCount
    val failedCount = repository.failedCount
    val deletedCapsules = repository.deletedCapsules
    
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

    // -------------------- Settings StateFlows --------------------
    // 体验设置
    val hapticEnabled = MutableStateFlow(true)
    val soundEnabled = MutableStateFlow(true)
    val animationIntensity = MutableStateFlow("full") // "full", "light", "minimal"
    
    // 内容设置
    val autoSaveDraft = MutableStateFlow(true)
    val imageCompression = MutableStateFlow(true)
    val recordingQuality = MutableStateFlow("high") // "high", "medium", "low"
    
    // 连接设置
    val autoDiscoverBase = MutableStateFlow(true)
    val syncRetryStrategy = MutableStateFlow("3") // "1", "3", "5", "infinite"
    
    // 静音模式（综合开关）
    val silentMode = MutableStateFlow(false)
    
    // 颜色定制设置
    val primaryColor = MutableStateFlow(0xFF3B82F6.toInt())
    val secondaryColor = MutableStateFlow(0xFF10B981.toInt())
    val borderRadius = MutableStateFlow(8) // 4, 8, 12, 16 dp

    // -------------------- SharedPreferences for persistence --------------------
    private val prefs: SharedPreferences by lazy {
        application.getSharedPreferences("terminal_settings", Context.MODE_PRIVATE)
    }

    init {
        // 启动时自动开始 mDNS 发现，搜索局域网内的主基地
        nsdHelper.startDiscovery()
        
        // 加载保存的设置
        loadSettings()
    }
    
    /**
     * 从 SharedPreferences 加载设置
     */
    private fun loadSettings() {
        hapticEnabled.value = prefs.getBoolean("haptic_enabled", true)
        soundEnabled.value = prefs.getBoolean("sound_enabled", true)
        animationIntensity.value = prefs.getString("animation_intensity", "full") ?: "full"
        autoSaveDraft.value = prefs.getBoolean("auto_save_draft", true)
        imageCompression.value = prefs.getBoolean("image_compression", true)
        recordingQuality.value = prefs.getString("recording_quality", "high") ?: "high"
        autoDiscoverBase.value = prefs.getBoolean("auto_discover_base", true)
        syncRetryStrategy.value = prefs.getString("sync_retry_strategy", "3") ?: "3"
        silentMode.value = prefs.getBoolean("silent_mode", false)
        // 颜色定制设置
        primaryColor.value = prefs.getInt("primary_color", 0xFF3B82F6.toInt())
        secondaryColor.value = prefs.getInt("secondary_color", 0xFF10B981.toInt())
        borderRadius.value = prefs.getInt("border_radius", 8)
    }
    
    /**
     * 保存设置到 SharedPreferences
     */
    private fun saveSettings() {
        prefs.edit().apply {
            putBoolean("haptic_enabled", hapticEnabled.value)
            putBoolean("sound_enabled", soundEnabled.value)
            putString("animation_intensity", animationIntensity.value)
            putBoolean("auto_save_draft", autoSaveDraft.value)
            putBoolean("image_compression", imageCompression.value)
            putString("recording_quality", recordingQuality.value)
            putBoolean("auto_discover_base", autoDiscoverBase.value)
            putString("sync_retry_strategy", syncRetryStrategy.value)
            putBoolean("silent_mode", silentMode.value)
            // 颜色定制设置
            putInt("primary_color", primaryColor.value)
            putInt("secondary_color", secondaryColor.value)
            putInt("border_radius", borderRadius.value)
            apply()
        }
    }
    
    /**
     * 更新触感反馈设置
     */
    fun setHapticEnabled(enabled: Boolean) {
        hapticEnabled.value = enabled
        saveSettings()
    }
    
    /**
     * 更新声音反馈设置
     */
    fun setSoundEnabled(enabled: Boolean) {
        soundEnabled.value = enabled
        saveSettings()
    }
    
    /**
     * 更新动画强度设置
     */
    fun setAnimationIntensity(intensity: String) {
        animationIntensity.value = intensity
        saveSettings()
    }
    
    /**
     * 更新自动保存草稿设置
     */
    fun setAutoSaveDraft(enabled: Boolean) {
        autoSaveDraft.value = enabled
        saveSettings()
    }
    
    /**
     * 更新图片压缩设置
     */
    fun setImageCompression(enabled: Boolean) {
        imageCompression.value = enabled
        saveSettings()
    }
    
    /**
     * 更新录音质量设置
     */
    fun setRecordingQuality(quality: String) {
        recordingQuality.value = quality
        saveSettings()
    }

    /**
     * 获取 MediaRecorder 配置
     * 根据录音质量设置返回对应的比特率和采样率
     * 
     * @return MediaRecorderConfig 包含 bitRate 和 sampleRate
     */
    fun getMediaRecorderConfig(): MediaRecorderConfig {
        return when (recordingQuality.value) {
            "high" -> MediaRecorderConfig(128000, 44100)    // ~1MB/min
            "medium" -> MediaRecorderConfig(64000, 22050)    // ~500KB/min
            "low" -> MediaRecorderConfig(32000, 16000)      // ~250KB/min
            else -> MediaRecorderConfig(128000, 44100)      // 默认高质量
        }
    }
    
    /**
     * 更新自动发现基地设置
     */
    fun setAutoDiscoverBase(enabled: Boolean) {
        autoDiscoverBase.value = enabled
        saveSettings()
    }
    
    /**
     * 更新同步重试策略设置
     */
    fun setSyncRetryStrategy(strategy: String) {
        syncRetryStrategy.value = strategy
        saveSettings()
    }
    
    /**
     * 更新静音模式设置
     */
    fun setSilentMode(enabled: Boolean) {
        silentMode.value = enabled
        saveSettings()
    }
    
    /**
     * 更新主色设置
     */
    fun setPrimaryColor(color: Int) {
        primaryColor.value = color
        saveSettings()
    }
    
    /**
     * 更新副色设置
     */
    fun setSecondaryColor(color: Int) {
        secondaryColor.value = color
        saveSettings()
    }
    
    /**
     * 更新圆角设置
     */
    fun setBorderRadius(radius: Int) {
        borderRadius.value = radius
        saveSettings()
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

                val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
                val api = createRetrofit(baseUrl).create(BaseApi::class.java)

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
     * 4. 根据 syncRetryStrategy 设置进行重试
     * 5. 上传前设置 syncStatus 为 SYNCING
     * 6. 上传成功后设置 syncStatus 为 SYNCED，状态设为 ARCHIVED
     * 7. 上传失败后设置 syncStatus 为 FAILED，保留原状态
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

            val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
            val api = createRetrofit(baseUrl).create(BaseApi::class.java)

            // 读取重试策略
            val strategy = syncRetryStrategy.value
            val maxRetries = if (strategy == "infinite") Int.MAX_VALUE else strategy.toIntOrNull() ?: 1

            var successCount = 0
            for (capsule in pending) {
                var uploadSuccess = false
                var attempts = 0

                // 根据策略进行重试
                while (attempts < maxRetries && !uploadSuccess) {
                    attempts++
                    try {
                        // 上传前设置同步状态为 SYNCING
                        repository.updateSyncStatus(capsule.id, SyncStatus.SYNCING)
                        
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
                            // 上传成功：设置为 SYNCED 并更新状态为 ARCHIVED
                            repository.updateSyncStatus(capsule.id, SyncStatus.SYNCED)
                            repository.markAsArchived(capsule)
                            uploadSuccess = true
                            successCount++
                        } else {
                            // 上传失败，准备重试
                            if (attempts < maxRetries) {
                                // 指数退避：1s, 2s, 4s, 8s...
                                val delayMs = (1000L * (1 shl (attempts - 1))).coerceAtMost(10000L)
                                delay(delayMs)
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        // 上传异常，准备重试
                        if (attempts < maxRetries) {
                            val delayMs = (1000L * (1 shl (attempts - 1))).coerceAtMost(10000L)
                            delay(delayMs)
                        }
                    }
                }

                // 所有重试都失败
                if (!uploadSuccess) {
                    repository.updateSyncStatus(capsule.id, SyncStatus.FAILED)
                }
            }
            _syncState.value = if (successCount == pending.size) "IDLE" else "PARTIAL_SUCCESS"
        }
    }

    /**
     * 重试同步失败的胶囊
     * 
     * 重试流程：
     * 1. 获取所有 FAILED 状态的胶囊
     * 2. 根据 syncRetryStrategy 设置进行重试
     * 3. 重置状态为 SYNCING
     * 4. 重新上传
     * 5. 成功→SYNCED+ARCHIVED，失败→保持 FAILED
     */
    fun retryFailedCapsules() {
        val ip = baseIp.value
        if (ip == null) {
            _syncState.value = "ERROR: No Base Found"
            return
        }
        
        viewModelScope.launch {
            _syncState.value = "SYNCING"
            val failedCapsules = repository.getFailedCapsules()
            if (failedCapsules.isEmpty()) {
                _syncState.value = "IDLE"
                return@launch
            }

            val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
            val api = createRetrofit(baseUrl).create(BaseApi::class.java)

            // 读取重试策略
            val strategy = syncRetryStrategy.value
            val maxRetries = if (strategy == "infinite") Int.MAX_VALUE else strategy.toIntOrNull() ?: 1

            var successCount = 0
            for (capsule in failedCapsules) {
                var uploadSuccess = false
                var attempts = 0

                // 根据策略进行重试
                while (attempts < maxRetries && !uploadSuccess) {
                    attempts++
                    try {
                        // 重置同步状态为 SYNCING
                        repository.updateSyncStatus(capsule.id, SyncStatus.SYNCING)
                        
                        val typeReq = capsule.type.toRequestBody("text/plain".toMediaTypeOrNull())
                        val contentReq = capsule.content?.toRequestBody("text/plain".toMediaTypeOrNull())
                        val tsReq = capsule.timestamp.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                        val statusValue = when (capsule.status) {
                            "DRAFT" -> "draft"
                            "ARCHIVED" -> "archived"
                            else -> "pending"
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
                            // 上传成功：设置为 SYNCED 并更新状态为 ARCHIVED
                            repository.updateSyncStatus(capsule.id, SyncStatus.SYNCED)
                            repository.markAsArchived(capsule)
                            uploadSuccess = true
                            successCount++
                        } else {
                            // 上传再次失败，准备重试
                            if (attempts < maxRetries) {
                                val delayMs = (1000L * (1 shl (attempts - 1))).coerceAtMost(10000L)
                                delay(delayMs)
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        // 上传异常，准备重试
                        if (attempts < maxRetries) {
                            val delayMs = (1000L * (1 shl (attempts - 1))).coerceAtMost(10000L)
                            delay(delayMs)
                        }
                    }
                }

                // 所有重试都失败，保持 FAILED 状态
                if (!uploadSuccess) {
                    repository.updateSyncStatus(capsule.id, SyncStatus.FAILED)
                }
            }
            _syncState.value = if (successCount == failedCapsules.size) "IDLE" else "PARTIAL_SUCCESS"
        }
    }

    /**
     * 整理胶囊 - 将待整理的胶囊归档/Wall/回响/删除
     * @param capsuleId 胶囊 ID
     * @param action 整理动作: archive/wall/echo/delete
     */
    fun organizeCapsule(capsuleId: Int, action: String) {
        val ip = baseIp.value
        if (ip == null) {
            // 即使没有网络，也更新本地状态
            viewModelScope.launch {
                updateLocalCapsuleStatus(capsuleId, action)
            }
            return
        }
        
        viewModelScope.launch {
            try {
                val baseUrl = if (ip.endsWith("/")) ip else "$ip/"
                val api = createRetrofit(baseUrl).create(BaseApi::class.java)
                val request = com.personalbase.terminal.data.OrganizeRequest(action)
                val response = api.organizeCapsule(capsuleId, request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    // 整理成功，更新本地状态
                    updateLocalCapsuleStatus(capsuleId, action)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // 网络失败时，也更新本地状态
                updateLocalCapsuleStatus(capsuleId, action)
            }
        }
    }

    /**
     * 更新本地胶囊状态
     * @param capsuleId 胶囊 ID
     * @param action 整理动作: archive/wall/echo/delete
     */
    private suspend fun updateLocalCapsuleStatus(capsuleId: Int, action: String) {
        val capsule = repository.getCapsuleById(capsuleId) ?: return
        when (action) {
            "delete" -> repository.deleteCapsule(capsule)
            "archive" -> repository.markAsArchived(capsule)
            "wall" -> repository.markAsPending(capsule)  // wall -> PENDING
            "echo" -> repository.markAsDraft(capsule)   // echo -> DRAFT
        }
    }

    /**
     * 更新胶囊内容
     * @param capsuleId 胶囊 ID
     * @param newContent 新的内容
     */
    fun updateCapsuleContent(capsuleId: Int, newContent: String) {
        viewModelScope.launch {
            val capsule = repository.getCapsuleById(capsuleId)
            capsule?.let {
                repository.updateCapsule(it.copy(content = newContent))
            }
        }
    }

    /**
     * 删除胶囊（软删除）
     * @param capsuleId 胶囊 ID
     */
    fun deleteCapsule(capsuleId: Int) {
        viewModelScope.launch {
            val capsule = repository.getCapsuleById(capsuleId)
            capsule?.let {
                repository.deleteCapsule(it)
            }
        }
    }

    /**
     * 永久删除胶囊
     * @param capsuleId 胶囊 ID
     */
    fun permanentDeleteCapsule(capsuleId: Int) {
        viewModelScope.launch {
            repository.permanentDeleteCapsule(capsuleId)
        }
    }

    /**
     * 清空回收站（永久删除所有软删除的胶囊）
     */
    fun emptyTrash() {
        viewModelScope.launch {
            repository.emptyTrash()
        }
    }

    /**
     * 恢复胶囊（从回收站恢复）
     * @param capsuleId 胶囊 ID
     */
    fun restoreCapsule(capsuleId: Int) {
        viewModelScope.launch {
            repository.restoreCapsule(capsuleId)
        }
    }

    /**
     * 切换胶囊收藏状态
     * @param capsule 胶囊实体
     */
    fun toggleFavorite(capsule: CapsuleEntity) {
        viewModelScope.launch {
            repository.toggleFavorite(capsule)
        }
    }
}
