/**
 * ImageCompressor - 图片压缩工具
 * 
 * 功能：
 * - 将大图片压缩到目标大小（默认 500KB）
 * - 通过逐步降低 JPEG 质量来实现压缩
 * - 压缩在 IO 线程执行，避免阻塞主线程
 * - 失败时返回 null，调用方应处理降级到原图
 */
package com.personalbase.terminal.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File

object ImageCompressor {
    /**
     * 压缩图片到目标大小
     * 
     * @param context Android 上下文
     * @param imageUri 要压缩的图片 URI
     * @param maxSizeKB 目标最大文件大小，单位 KB（默认 500）
     * @param qualityStep 每次质量 reduction 的步长（默认 10）
     * @return 压缩后的图片 URI（保存在 cache 目录），失败时返回 null
     */
    suspend fun compress(
        context: Context,
        imageUri: Uri,
        maxSizeKB: Int = 500,
        qualityStep: Int = 10
    ): Uri? = withContext(Dispatchers.IO) {
        try {
            // 读取图片
            val inputStream = context.contentResolver.openInputStream(imageUri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (bitmap == null) {
                return@withContext null
            }
            
            var quality = 90
            var outputStream: ByteArrayOutputStream
            
            // 逐步降低质量直到文件大小小于目标
            do {
                outputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
                quality -= qualityStep
            } while (outputStream.size() > maxSizeKB * 1024 && quality > 10)
            
            // 保存到 cache 目录
            val compressedFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
            compressedFile.writeBytes(outputStream.toByteArray())
            
            // 回收 bitmap 内存
            bitmap.recycle()
            
            Uri.fromFile(compressedFile)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}