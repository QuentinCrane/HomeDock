/**
 * useSSE.ts - Server-Sent Events (SSE) 钩子
 * 
 * 功能说明：
 *   - 管理与后端的 SSE 连接，实现实时推送
 *   - 自动重连机制，断线后按 interval 重试
 *   - SSE 不可用时自动切换到轮询 fallback
 * 
 * 数据流：
 *   - 后端通过 SSE 推送胶囊/待办更新事件
 *   - 前端接收事件后调用 onEvent 回调
 *   - 回调触发状态更新，重新渲染 UI
 * 
 * 事件类型：
 *   - capsule:created - 新胶囊创建
 *   - capsule:updated - 胶囊更新
 *   - capsule:deleted - 胶囊删除
 *   - todo:created/updated/deleted - 待办相关
 *   - fallback:poll - 轮询 fallback 触发
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { playNewCapsuleSound, vibrateFeedback, getSoundPreference, getVibrationPreference } from '../sound';

// SSE requires full URL - Vite proxy doesn't work with EventSource
const SSE_URL = 'http://localhost:3000/api/events';

export interface SSEEvent {
  type: string;
  data: unknown;
}

export interface UseSSEOptions {
  url: string;
  onEvent?: (event: SSEEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  enabled?: boolean;
  /** Fallback polling interval when SSE is unavailable (ms) */
  fallbackInterval?: number;
  /** Callback to check if SSE is connected */
  onSSEStatusChange?: (connected: boolean) => void;
  /** Optional callback for sync toast notifications - receives event type */
  onSyncToast?: (eventType: string) => void;
}

/**
 * Custom hook for Server-Sent Events (SSE) connection.
 * Automatically reconnects on disconnect.
 * Falls back to polling when SSE is unavailable.
 */
export function useSSE({
  url,
  onEvent,
  onConnect,
  onDisconnect,
  reconnectInterval = 5000,
  enabled = true,
  fallbackInterval = 10000,
  onSSEStatusChange,
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onSSEStatusChangeRef = useRef(onSSEStatusChange);
  
  const [isSSEConnected, setIsSSEConnected] = useState(false);

  // Keep refs updated with latest callbacks
  onEventRef.current = onEvent;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onSSEStatusChangeRef.current = onSSEStatusChange;

  // Clear fallback polling
  const clearFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  // Start fallback polling (called when SSE fails)
  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) return; // Already polling
    
    console.log('[SSE] SSE unavailable, starting fallback polling');
    fallbackIntervalRef.current = setInterval(() => {
      // Just trigger a refresh - pages will refetch data
      onEventRef.current?.({ type: 'fallback:poll', data: null });
    }, fallbackInterval);
  }, [fallbackInterval]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear fallback polling since we're trying SSE
    clearFallbackPolling();

    console.log('[SSE] Connecting to:', url);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connected');
      setIsSSEConnected(true);
      onSSEStatusChangeRef.current?.(true);
      onConnectRef.current?.();
    };

    eventSource.onerror = () => {
      console.log('[SSE] Error, closing connection');
      eventSource.close();
      setIsSSEConnected(false);
      onSSEStatusChangeRef.current?.(false);
      onDisconnectRef.current?.();

      // Start fallback polling instead of immediate reconnect
      startFallbackPolling();
      
      // Also try to reconnect SSE after interval
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          // Check if we should still try reconnecting
          if (enabled && !isSSEConnected) {
            connect();
          }
        }, reconnectInterval);
      }
    };

    // Listen for all custom event types
    const eventTypes = [
      'capsule:created',
      'capsule:updated',
      'capsule:deleted',
      'todo:created',
      'todo:updated',
      'todo:deleted',
      'connected',
    ];

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as unknown;
          onEventRef.current?.({ type: eventType, data });
        } catch {
          onEventRef.current?.({ type: eventType, data: e.data });
        }
      });
    });
  }, [url, reconnectInterval, enabled, clearFallbackPolling, startFallbackPolling, isSSEConnected]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { isSSEConnected };
}

/**
 * Hook specifically for real-time capsule updates.
 * Refreshes capsule list when Android syncs new capsules.
 * Includes fallback polling when SSE is unavailable.
 */
export function useCapsuleSync(
  onCapsuleUpdate?: (event: SSEEvent) => void,
  options?: { 
    fallbackInterval?: number; 
    onSSEStatusChange?: (connected: boolean) => void;
    /** Callback for sync toast notifications (receives event type) */
    onSyncToast?: (eventType: string) => void;
    /** Whether silent mode is active - suppresses toasts */
    isSilent?: boolean;
  }
): { isSSEConnected: boolean } {
  const onCapsuleUpdateRef = useRef(onCapsuleUpdate);
  const onSyncToastRef = useRef(options?.onSyncToast);
  const isSilentRef = useRef(options?.isSilent);
  onCapsuleUpdateRef.current = onCapsuleUpdate;
  onSyncToastRef.current = options?.onSyncToast;
  isSilentRef.current = options?.isSilent;

  const { isSSEConnected } = useSSE({
    url: SSE_URL,
    onEvent: (event) => {
      // Handle both SSE events and fallback polling
      if (event.type.startsWith('capsule:') || event.type === 'fallback:poll') {
        // Show sync toast for specific events (only if not silent and callback provided)
        if (!isSilentRef.current && event.type !== 'fallback:poll') {
          onSyncToastRef.current?.(event.type);
        }
        
        // Play sound and vibration for new capsule arrivals (only if not silent)
        if (!isSilentRef.current && event.type === 'capsule:created') {
          if (getSoundPreference('new_capsule')) {
            playNewCapsuleSound();
          }
          if (getVibrationPreference()) {
            vibrateFeedback();
          }
        }
        
        onCapsuleUpdateRef.current?.(event);
      }
    },
    fallbackInterval: options?.fallbackInterval,
    onSSEStatusChange: options?.onSSEStatusChange,
    enabled: true,
  });

  return { isSSEConnected };
}

/**
 * Hook specifically for real-time todo updates.
 * Includes fallback polling when SSE is unavailable.
 */
export function useTodoSync(
  onTodoUpdate?: () => void,
  options?: { 
    fallbackInterval?: number; 
    onSSEStatusChange?: (connected: boolean) => void;
    /** Callback for sync toast notifications (receives event type) */
    onSyncToast?: (eventType: string) => void;
    /** Whether silent mode is active - suppresses toasts */
    isSilent?: boolean;
  }
): { isSSEConnected: boolean } {
  const onTodoUpdateRef = useRef(onTodoUpdate);
  const onSyncToastRef = useRef(options?.onSyncToast);
  const isSilentRef = useRef(options?.isSilent);
  onTodoUpdateRef.current = onTodoUpdate;
  onSyncToastRef.current = options?.onSyncToast;
  isSilentRef.current = options?.isSilent;

  const { isSSEConnected } = useSSE({
    url: SSE_URL,
    onEvent: (event) => {
      if (event.type.startsWith('todo:') || event.type === 'fallback:poll') {
        // Show sync toast for specific events (only if not silent and callback provided)
        if (!isSilentRef.current && event.type !== 'fallback:poll') {
          onSyncToastRef.current?.(event.type);
        }
        onTodoUpdateRef.current?.();
      }
    },
    fallbackInterval: options?.fallbackInterval,
    onSSEStatusChange: options?.onSSEStatusChange,
    enabled: true,
  });

  return { isSSEConnected };
}
