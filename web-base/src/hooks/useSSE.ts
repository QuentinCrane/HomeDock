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

// ============================================================================
// Reconnection constants
// ============================================================================
const MAX_RECONNECT_DELAY = 60000; // 60 seconds max
const INITIAL_RECONNECT_DELAY = 1000; // 1 second initial
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const MISSED_HEARTBEATS_THRESHOLD = 2;

// ============================================================================
// Connection Status Types
// ============================================================================
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

// ============================================================================
// SSE Singleton - Prevents multiple EventSource connections to same URL
// Browser HTTP/1.1 limits 6 connections per domain, SSE consumes 1 permanently
// ============================================================================
interface SSESubscriber {
  onEvent?: (event: SSEEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSSEStatusChange?: (connected: boolean) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

interface SSEManager {
  eventSource: EventSource | null;
  subscribers: Set<SSESubscriber>;
  refCount: number;
  // Reconnection state
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  missedHeartbeats: number;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
}

let sseManager: SSEManager | null = null;

function createSSEManager(url: string): SSEManager {
  console.log('[SSE Singleton] Creating new EventSource for:', url);
  
  const manager: SSEManager = {
    eventSource: null,
    subscribers: new Set(),
    refCount: 0,
    reconnectAttempts: 0,
    reconnectDelay: INITIAL_RECONNECT_DELAY,
    heartbeatTimer: null,
    missedHeartbeats: 0,
    isConnected: false,
    connectionStatus: 'connecting',
  };

  const connectSSE = () => {
    // Clear any existing connection
    if (manager.eventSource) {
      manager.eventSource.close();
      manager.eventSource = null;
    }

    // Clear heartbeat timer
    if (manager.heartbeatTimer) {
      clearInterval(manager.heartbeatTimer);
      manager.heartbeatTimer = null;
    }

    // Update status to connecting
    updateConnectionStatus(manager, 'connecting');

    const eventSource = new EventSource(url);
    manager.eventSource = eventSource;

    // Heartbeat to detect stale connections
    manager.heartbeatTimer = setInterval(() => {
      if (manager.isConnected) {
        manager.isConnected = false;
        manager.missedHeartbeats++;

        if (manager.missedHeartbeats >= MISSED_HEARTBEATS_THRESHOLD) {
          console.log('[SSE] Heartbeat missed, reconnecting...');
          eventSource.close();
          scheduleReconnect(manager, url, connectSSE);
        }
      }
    }, HEARTBEAT_INTERVAL);

    eventSource.onopen = () => {
      console.log('[SSE Singleton] Connected');
      manager.isConnected = true;
      manager.reconnectAttempts = 0;
      manager.reconnectDelay = INITIAL_RECONNECT_DELAY;
      manager.missedHeartbeats = 0;
      updateConnectionStatus(manager, 'connected');
      manager.subscribers.forEach((sub) => sub.onSSEStatusChange?.(true));
      manager.subscribers.forEach((sub) => sub.onConnect?.());
    };

    eventSource.onerror = (err) => {
      console.error('[SSE Singleton] Error:', err);
      manager.isConnected = false;
      updateConnectionStatus(manager, 'disconnected');
      eventSource.close();
      scheduleReconnect(manager, url, connectSSE);
      manager.subscribers.forEach((sub) => sub.onSSEStatusChange?.(false));
      manager.subscribers.forEach((sub) => sub.onDisconnect?.());
    };

    // Handle heartbeat event from server
    eventSource.addEventListener('heartbeat', () => {
      manager.isConnected = true;
      manager.missedHeartbeats = 0;
    });

    // Handle connection confirmation
    eventSource.addEventListener('connected', () => {
      manager.isConnected = true;
      manager.missedHeartbeats = 0;
    });

    const eventTypes = [
      'capsule:created', 'capsule:updated', 'capsule:deleted',
      'todo:created', 'todo:updated', 'todo:deleted', 'connected',
    ];

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        const sseEvent: SSEEvent = {
          type: eventType,
          data: (() => {
            try { return JSON.parse(e.data); }
            catch { return e.data; }
          })(),
        };
        manager.subscribers.forEach((sub) => sub.onEvent?.(sseEvent));
      });
    });
  };

  const scheduleReconnect = (mgr: SSEManager, _url: string, connectFn: () => void) => {
    if (mgr.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[SSE Singleton] Max reconnect attempts reached');
      updateConnectionStatus(mgr, 'failed');
      return;
    }

    mgr.reconnectAttempts++;
    const delay = Math.min(mgr.reconnectDelay, MAX_RECONNECT_DELAY);
    console.log(`[SSE Singleton] Reconnecting in ${delay}ms (attempt ${mgr.reconnectAttempts})`);
    updateConnectionStatus(mgr, 'reconnecting');

    setTimeout(() => {
      connectFn();
    }, delay);

    // Exponential backoff
    mgr.reconnectDelay *= 2;
  };

  const updateConnectionStatus = (mgr: SSEManager, status: ConnectionStatus) => {
    mgr.connectionStatus = status;
    mgr.subscribers.forEach((sub) => sub.onConnectionStatusChange?.(status));
  };

  // Start initial connection
  connectSSE();

  return manager;
}

function getSSEManager(url: string): SSEManager {
  if (sseManager && sseManager.eventSource && sseManager.eventSource.url !== url) {
    // Different URL requested - close old connection
    if (sseManager.heartbeatTimer) {
      clearInterval(sseManager.heartbeatTimer);
    }
    sseManager.eventSource.close();
    sseManager.subscribers.clear();
    sseManager = null;
  }

  if (!sseManager) {
    sseManager = createSSEManager(url);
  }

  return sseManager;
}

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
  /** Callback for connection status changes */
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

/**
 * Custom hook for Server-Sent Events (SSE) connection.
 * Uses singleton EventSource to prevent multiple connections to same URL.
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
  onConnectionStatusChange,
}: UseSSEOptions) {
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onSSEStatusChangeRef = useRef(onSSEStatusChange);
  const onConnectionStatusChangeRef = useRef(onConnectionStatusChange);
  const enabledRef = useRef(enabled);
  const reconnectScheduledRef = useRef(false);
  const connectRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef(false);

  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Keep refs updated with latest callbacks
  onEventRef.current = onEvent;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onSSEStatusChangeRef.current = onSSEStatusChange;
  onConnectionStatusChangeRef.current = onConnectionStatusChange;
  enabledRef.current = enabled;

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
    if (!enabledRef.current) return;

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear fallback polling since we're trying SSE
    clearFallbackPolling();

    console.log('[SSE] Connecting to singleton SSE manager:', url);
    const manager = getSSEManager(url);
    isSubscribedRef.current = true;

    // Subscribe to the singleton
    const subscriber: SSESubscriber = {
      onEvent,
      onConnect: () => {
        setIsSSEConnected(true);
        reconnectScheduledRef.current = false;
        onSSEStatusChangeRef.current?.(true);
        onConnectRef.current?.();
      },
      onDisconnect: () => {
        setIsSSEConnected(false);
        onSSEStatusChangeRef.current?.(false);
        onDisconnectRef.current?.();

        // Start fallback polling instead of immediate reconnect
        startFallbackPolling();

        // Only schedule reconnect if not already scheduled
        if (enabledRef.current && !reconnectScheduledRef.current) {
          reconnectScheduledRef.current = true;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectScheduledRef.current = false;
            if (enabledRef.current && isSubscribedRef.current) {
              // Reconnect by re-subscribing
              connectRef.current?.();
            }
          }, reconnectInterval);
        }
      },
      onSSEStatusChange,
      onConnectionStatusChange: (status) => {
        setConnectionStatus(status);
        onConnectionStatusChangeRef.current?.(status);
      },
    };

    manager.subscribers.add(subscriber);

    // Check initial connection state
    if (manager.eventSource?.readyState === EventSource.OPEN) {
      setIsSSEConnected(true);
      onSSEStatusChangeRef.current?.(true);
    }
  }, [url, reconnectInterval, clearFallbackPolling, startFallbackPolling]);

  // Store connect function in ref so error handler can call it without forward reference issues
  connectRef.current = connect;

  useEffect(() => {
    connect();

    return () => {
      isSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      // Unsubscribe from singleton but don't close the connection
      // Other subscribers may still need it
    };
  }, [connect]);

  // Manual retry function - resets reconnect state and reconnects
  const retryConnection = useCallback(() => {
    if (sseManager) {
      sseManager.reconnectAttempts = 0;
      sseManager.reconnectDelay = INITIAL_RECONNECT_DELAY;
      sseManager.isConnected = false;
      setConnectionStatus('reconnecting');
      // Trigger a reconnect by calling connect
      connectRef.current?.();
    }
  }, []);

  return { isSSEConnected, connectionStatus, retryConnection };
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
): { isSSEConnected: boolean; connectionStatus: ConnectionStatus; retryConnection: () => void } {
  const onCapsuleUpdateRef = useRef(onCapsuleUpdate);
  const onSyncToastRef = useRef(options?.onSyncToast);
  const isSilentRef = useRef(options?.isSilent);
  onCapsuleUpdateRef.current = onCapsuleUpdate;
  onSyncToastRef.current = options?.onSyncToast;
  isSilentRef.current = options?.isSilent;

  const { isSSEConnected, connectionStatus, retryConnection } = useSSE({
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

  return { isSSEConnected, connectionStatus, retryConnection };
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
): { isSSEConnected: boolean; connectionStatus: ConnectionStatus; retryConnection: () => void } {
  const onTodoUpdateRef = useRef(onTodoUpdate);
  const onSyncToastRef = useRef(options?.onSyncToast);
  const isSilentRef = useRef(options?.isSilent);
  onTodoUpdateRef.current = onTodoUpdate;
  onSyncToastRef.current = options?.onSyncToast;
  isSilentRef.current = options?.isSilent;

  const { isSSEConnected, connectionStatus, retryConnection } = useSSE({
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

  return { isSSEConnected, connectionStatus, retryConnection };
}
