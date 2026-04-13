/**
 * useToast.tsx - Toast 通知系统
 * 
 * 功能说明：
 *   - 提供全局 Toast 通知上下文
 *   - 支持多种类型：info/success/warning/error
 *   - 静默模式下自动禁用通知
 * 
 * 同步消息映射：
 *   - capsule:created → '新碎片入舱'
 *   - capsule:updated → '碎片已更新'
 *   - capsule:deleted → '碎片已删除'
 *   - todo:created → '新待办事项'
 *   - todo:updated → '待办事项已更新'
 *   - todo:deleted → '待办事项已删除'
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Granular sync toast messages
export const SYNC_TOAST_MESSAGES = {
  'capsule:created': '新碎片入舱',
  'capsule:updated': '碎片已更新',
  'capsule:deleted': '碎片已删除',
  'todo:created': '新待办事项',
  'todo:updated': '待办事项已更新',
  'todo:deleted': '待办事项已删除',
} as const;

export function ToastProvider({ children, isSilent = false }: { children: React.ReactNode; isSilent?: boolean }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    // Suppress toasts when silent mode is active
    if (isSilent) return;

    const id = `toast-${++toastIdRef.current}`;
    setToasts(prev => {
      // Limit to 5 toasts maximum
      const MAX_TOASTS = 5;
      const newToasts = [...prev, { id, message, type, duration }];
      // If over limit, remove oldest (first element)
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(1);
      }
      return newToasts;
    });
  }, [isSilent]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Non-intrusive toast container - bottom-right position
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let innerTimer: ReturnType<typeof setTimeout> | undefined;

    const outerTimer = setTimeout(() => {
      setIsExiting(true);
      // Allow exit animation to complete before removing
      innerTimer = setTimeout(() => {
        onRemove(toast.id);
      }, 200);
    }, toast.duration);

    return () => {
      clearTimeout(outerTimer);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  const typeStyles: Record<ToastType, string> = {
    info: 'border-[var(--color-base-accent)] bg-[var(--color-base-panel)]',
    success: 'border-[var(--color-base-success)] bg-[var(--color-base-panel)]',
    warning: 'border-[var(--color-base-warning)] bg-[var(--color-base-panel)]',
    error: 'border-[var(--color-base-error)] bg-[var(--color-base-panel)]',
  };

  const iconMap: Record<ToastType, string> = {
    info: '●',
    success: '✓',
    warning: '▲',
    error: '✕',
  };

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3 
        border rounded-lg shadow-lg
        backdrop-blur-md
        min-w-[200px] max-w-[320px]
        ${typeStyles[toast.type]}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        transition-all duration-200 ease-out
      `}
    >
      <span className={`text-sm font-mono ${
        toast.type === 'info' ? 'text-[var(--color-base-accent)]' :
        toast.type === 'success' ? 'text-[var(--color-base-success)]' :
        toast.type === 'warning' ? 'text-[var(--color-base-warning)]' :
        'text-[var(--color-base-error)]'
      }`}>
        {iconMap[toast.type]}
      </span>
      <span className="text-xs font-mono text-[var(--color-base-text-light)] tracking-wide">
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] opacity-50 hover:opacity-100 transition-opacity text-xs"
      >
        ✕
      </button>
    </div>
  );
}

// Hook to show sync-specific toasts with predefined messages
export function useSyncToast() {
  const { addToast } = useToast();

  const showSyncToast = useCallback((eventType: string) => {
    const message = SYNC_TOAST_MESSAGES[eventType as keyof typeof SYNC_TOAST_MESSAGES];
    if (message) {
      addToast(message, 'info', 3000);
    }
  }, [addToast]);

  return { showSyncToast };
}