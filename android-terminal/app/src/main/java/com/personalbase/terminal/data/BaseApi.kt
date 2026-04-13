package com.personalbase.terminal.data

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface BaseApi {
    @Multipart
    @POST("api/capsules")
    suspend fun uploadCapsule(
        @Part("type") type: RequestBody,
        @Part("content") content: RequestBody?,
        @Part("timestamp") timestamp: RequestBody,
        @Part("status") status: RequestBody,
        @Part file: MultipartBody.Part?
    ): Response<UploadResponse>

    // Todo endpoints
    @GET("api/todos")
    suspend fun getTodos(@Query("completed") completed: Boolean? = null): Response<TodosResponse>

    @POST("api/todos")
    suspend fun createTodo(@Body todo: TodoRequest): Response<TodoResponse>

    @PUT("api/todos/{id}")
    suspend fun updateTodo(@Path("id") id: Int, @Body todo: TodoRequest): Response<TodoResponse>

    @DELETE("api/todos/{id}")
    suspend fun deleteTodo(@Path("id") id: Int): Response<MessageResponse>

    @POST("api/todos/sync")
    suspend fun syncTodos(@Body todos: List<TodoSyncItem>): Response<SyncResponse>

    // Organize capsule - archive/wall/echo/delete actions
    @PUT("api/capsules/{id}/organize")
    suspend fun organizeCapsule(@Path("id") id: Int, @Body request: OrganizeRequest): Response<OrganizeResponse>
}

data class OrganizeRequest(
    val action: String  // 'archive', 'wall', 'echo', 'delete'
)

data class OrganizeResponse(
    val success: Boolean,
    val data: OrganizeData?
)

data class OrganizeData(
    val id: Int,
    val status: String?
)

data class UploadResponse(
    val success: Boolean,
    val data: ResponseData?
)

data class ResponseData(
    val id: Int,
    val message: String
)

// Todo data classes
data class TodosResponse(
    val success: Boolean,
    val data: List<TodoData>?
)

data class TodoData(
    val id: Int,
    val localId: String,
    val title: String,
    val description: String?,
    val dueDate: Long?,
    val completed: Boolean,
    val createdAt: Long,
    val updatedAt: Long?,
    val syncedAt: Long?,
    val calendarEventId: String?
)

data class TodoResponse(
    val success: Boolean,
    val data: TodoData?
)

data class TodoRequest(
    val localId: String,
    val title: String,
    val description: String? = null,
    val dueDate: Long? = null,
    val completed: Boolean = false,
    val createdAt: Long,
    val updatedAt: Long? = null,
    val calendarEventId: String? = null
)

data class TodoSyncItem(
    val localId: String,
    val title: String,
    val description: String?,
    val dueDate: Long?,
    val completed: Boolean,
    val createdAt: Long,
    val updatedAt: Long?,
    val calendarEventId: String?,
    val serverId: Int?
)

data class SyncResponse(
    val success: Boolean,
    val data: List<TodoSyncResult>?
)

data class TodoSyncResult(
    val localId: String,
    val serverId: Int?,
    val action: String
)

data class MessageResponse(
    val success: Boolean,
    val message: String?
)
