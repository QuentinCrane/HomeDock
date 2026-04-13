/**
 * api.ts - Axios API 客户端
 * 
 * 功能说明：
 *   - 封装所有与后端 Express API 的通信
 *   - 提供胶囊(Capsule)和待办(Todo)的数据操作接口
 *   - 使用 FormData 支持文件上传
 * 
 * 数据流：
 *   - 前端 → axios → Express API (port 3000) → SQLite 数据库
 */

import axios from 'axios';

/// API 客户端配置 - 基础 URL 指向本地 Express 服务器
/// 开发环境：Vite dev server (5173) 通过代理或直接访问 API (3000)
export const api = axios.create({
  baseURL: '/api',
});

// Retry interceptor - exponential backoff: 1s → 2s → 4s → 8s → 16s (per-request tracking)
const MAX_RETRIES = 3;
const MAX_UPLOAD_RETRIES = 5;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface CreateCapsuleOptions {
  type: 'text' | 'image' | 'audio';
  content?: string;
  file?: File;
  timestamp?: number;
  status?: CapsuleStatus;
  onUploadProgress?: (percent: number) => void;
}

export interface CreateCapsuleResult {
  id: number;
  message: string;
}

export interface UploadError {
  success: false;
  retryCount: number;
  error: string;
  isNetworkError: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    if (!config) return Promise.reject(error);
    
    // Skip retry if _skipRetry flag is set (e.g., for health checks)
    if (config._skipRetry) return Promise.reject(error);
    
    // Per-request retry count tracking (avoids race condition with concurrent requests)
    config._retryCount = (config._retryCount || 0) + 1;
    
    if (config._retryCount > MAX_RETRIES) {
      config._retryCount = 0;
      return Promise.reject(error);
    }
    
    // Only retry on network errors or 5xx server errors
    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;
    
    if (isNetworkError || isServerError) {
      // Calculate delay: 1s, 2s, 4s (exponential backoff)
      const delay = Math.pow(2, config._retryCount - 1) * 1000;
      
      console.log(`[API] Retry ${config._retryCount}/${MAX_RETRIES} after ${delay}ms`);
      
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(config)), delay);
      });
    }
    
    return Promise.reject(error);
  }
);

/// 胶囊状态类型定义
export type CapsuleStatus = 'draft' | 'pending' | 'archived' | 'favorited' | 'echoing';

/// 胶囊数据结构接口
export interface Capsule {
  id: number;
  type: 'text' | 'image' | 'audio';      // 胶囊类型
  content: string | null;                 // 文字内容或图片/音频的描述
  fileUrl: string | null;                 // 图片/音频文件 URL
  timestamp: number;                      // 用户定义的时间戳
  createdAt: number;                     // 服务器创建时间
  status: CapsuleStatus;                  // 胶囊状态
  updatedAt?: number;                     // 最后更新时间
  deletedAt?: number;                     // 软删除时间
  sourceId?: number;                      // 回响来源胶囊 ID
  remarks?: string;                       // 用户备注
}

/// 基地状态接口 - 首页状态概览
export interface BaseStatus {
  totalCapsules: number;                  // 胶囊总数
  lastReturnTime: number | null;         // 最后回港时间
  status: string;                         // 基地状态
}

/// 创建胶囊参数 (backward compatible)
export interface CreateCapsuleParams {
  type: 'text' | 'image' | 'audio';
  content?: string;
  file?: File;                            // 图片/音频文件
  timestamp?: number;
  status?: CapsuleStatus;
}

// ==================== 胶囊 API ====================

/// 获取胶囊列表
/// 参数：status(状态过滤)、type(类型过滤)、includeDeleted(包含已删除)
/// 返回：Capsule[] 胶囊数组
export const fetchCapsules = async (params?: {
  status?: CapsuleStatus;
  type?: string;
  includeDeleted?: boolean;
}): Promise<Capsule[]> => {
  const res = await api.get('/capsules', { params });
  return res.data.data;
};

/// 获取基地状态
/// 返回：BaseStatus 基地状态对象
export const fetchStatus = async (): Promise<BaseStatus> => {
  try {
    const res = await api.get('/status');
    return res.data.data;
  } catch (error: any) {
    // Provide actionable error message
    if (error.code === 'ECONNABORTED' || !error.response) {
      throw new Error('无法连接基地服务，请确保后端正在运行');
    }
    throw error;
  }
};

/// 创建新胶囊 - 支持进度跟踪和重试
/// 数据流：FormData → POST /api/capsules → 存储文件 → 返回新胶囊 ID
export const createCapsule = async (
  params: CreateCapsuleOptions
): Promise<CreateCapsuleResult> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let retryCount = 0;

    const attemptUpload = () => {
      const formData = new FormData();
      formData.append('type', params.type);
      if (params.content) formData.append('content', params.content);
      if (params.timestamp) formData.append('timestamp', params.timestamp.toString());
      if (params.status) formData.append('status', params.status);
      if (params.file) formData.append('file', params.file);

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && params.onUploadProgress) {
          params.onUploadProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data);
          } catch {
            reject({ success: false, retryCount, error: 'Invalid response format', isNetworkError: false });
          }
        } else if (xhr.status >= 500 && retryCount < MAX_UPLOAD_RETRIES) {
          // Server error - retry with backoff
          retryCount++;
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`[API] Upload retry ${retryCount}/${MAX_UPLOAD_RETRIES} after ${delay}ms (server error ${xhr.status})`);
          if (params.onUploadProgress) params.onUploadProgress(-1); // Indicate retry
          setTimeout(attemptUpload, delay);
        } else {
          reject({ success: false, retryCount, error: `Upload failed: ${xhr.status}`, isNetworkError: false });
        }
      });

      xhr.addEventListener('error', () => {
        if (retryCount < MAX_UPLOAD_RETRIES) {
          // Network error - retry with backoff
          retryCount++;
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`[API] Upload retry ${retryCount}/${MAX_UPLOAD_RETRIES} after ${delay}ms (network error)`);
          if (params.onUploadProgress) params.onUploadProgress(-1); // Indicate retry
          setTimeout(attemptUpload, delay);
        } else {
          reject({ success: false, retryCount, error: 'Network error', isNetworkError: true });
        }
      });

      xhr.addEventListener('abort', () => {
        reject({ success: false, retryCount, error: 'Upload aborted', isNetworkError: false });
      });

      xhr.addEventListener('timeout', () => {
        if (retryCount < MAX_UPLOAD_RETRIES) {
          retryCount++;
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`[API] Upload retry ${retryCount}/${MAX_UPLOAD_RETRIES} after ${delay}ms (timeout)`);
          if (params.onUploadProgress) params.onUploadProgress(-1);
          setTimeout(attemptUpload, delay);
        } else {
          reject({ success: false, retryCount, error: 'Request timeout', isNetworkError: true });
        }
      });

      xhr.open('POST', '/api/capsules');
      xhr.timeout = 30000; // 30 second timeout
      xhr.send(formData);
    };

    attemptUpload();
  });
};

/// 更新胶囊 - 修改内容、状态、备注
export const updateCapsule = async (id: number, data: {
  content?: string;
  status?: CapsuleStatus;
  remarks?: string;
}): Promise<{ id: number; updatedAt: number }> => {
  const res = await api.put(`/capsules/${id}`, data);
  return res.data.data;
};

/// 删除胶囊（软删除）
export const deleteCapsule = async (id: number): Promise<{ id: number; deletedAt: number }> => {
  const res = await api.delete(`/capsules/${id}`);
  return res.data.data;
};

/// 恢复已删除的胶囊
export const restoreCapsule = async (id: number): Promise<{ id: number }> => {
  const res = await api.post(`/capsules/${id}/restore`);
  return res.data.data;
};

/// 清空回收站 - 永久删除所有软删除的胶囊
export const emptyTrash = async (): Promise<{ deleted: number }> => {
  const res = await api.delete('/capsules/trash');
  return res.data.data;
};

/// 永久删除胶囊 - 直接从数据库删除
export const permanentDeleteCapsule = async (id: number): Promise<{ id: number }> => {
  const res = await api.delete(`/capsules/${id}/permanent`);
  return res.data.data;
};

/// 重新投放胶囊（回响池功能）- 创建克隆，原胶囊保留
export const recaptureCapsule = async (id: number, sourceId?: number): Promise<{ id: number; message: string }> => {
  const res = await api.post(`/capsules/${id}/recapture`, { sourceId });
  return res.data.data;
};

/// 整理胶囊 - archive/wall/echo/delete 操作
export const organizeCapsule = async (
  id: number,
  action: 'archive' | 'wall' | 'echo' | 'delete'
): Promise<Capsule> => {
  const res = await api.put(`/capsules/${id}/organize`, { action });
  return res.data.data;
};

// ===================== TODO API =====================

/// 待办数据结构
export interface Todo {
  id: number;
  localId?: string;                      // 客户端本地 ID（用于同步）
  title: string;
  description?: string;
  dueDate?: number;
  completed: boolean;
  createdAt: number;
  updatedAt?: number;
  syncedAt?: number;                     // 最后同步时间
  calendarEventId?: string;              // 日历事件 ID
  importance?: number;                   // 重要性等级 1-5 星
}

/// 同步结果
export interface SyncResult {
  localId: string;
  id?: number;                           // 服务器 ID
  serverId?: number;
  action: 'created' | 'updated';
}

/// 获取待办列表
export const fetchTodos = async (params?: {
  completed?: boolean;
  since?: number;                        // 只返回更新于指定时间之后的
}): Promise<Todo[]> => {
  const res = await api.get('/todos', { params });
  return res.data.data;
};

/// 创建待办
export const createTodo = async (data: {
  title: string;
  description?: string;
  dueDate?: number;
  localId?: string;
  importance?: number;
}): Promise<{ id: number; localId: string; createdAt: number; message: string }> => {
  const res = await api.post('/todos', data);
  return res.data.data;
};

/// 更新待办
export const updateTodo = async (id: number, data: {
  title?: string;
  description?: string;
  dueDate?: number;
  completed?: boolean;
  calendarEventId?: string;
  importance?: number;
}): Promise<{ id: number; updatedAt: number }> => {
  const res = await api.put(`/todos/${id}`, data);
  return res.data.data;
};

/// 删除待办
export const deleteTodo = async (id: number): Promise<{ id: number }> => {
  const res = await api.delete(`/todos/${id}`);
  return res.data.data;
};

/// 批量同步待办 - 离线优先策略
/// 客户端上传本地修改，服务器返回处理结果
export const syncTodos = async (todos: Partial<Todo>[]): Promise<{ results: SyncResult[]; syncedAt: number }> => {
  const res = await api.post('/todos/sync', { todos });
  return res.data.data;
};

/**
 * 健康检查 - 检测后端是否可达
 * @returns Promise<boolean> true if backend is reachable
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const res = await api.get('/health', { timeout: 3000, _skipRetry: true } as any);
    return res.data?.data?.status === 'ok';
  } catch {
    return false;
  }
};
