/**
 * SyncToast.tsx - 同步通知 Toast 组件
 * 
 * 功能说明：
 *   - 显示胶囊/待办同步状态
 *   - 支持三种类型：success（成功）/ error（失败）/ progress（进行中）
 *   - 自动消失（默认 4 秒）
 *   - 支持手动关闭
 * 
 * 视觉特性：
 *   - 不同类型对应不同的边框颜色和图标
 *   - 进入/退出动画
 *   - 进度指示器动画
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

/// Toast 类型
export type SyncToastType = 'success' | 'error' | 'progress';

interface SyncToastProps {
  message: string;
  type: SyncToastType;
  visible?: boolean;
  onClose?: () => void;
  duration?: number;
  showIcon?: boolean;
}

const SyncToast: React.FC<SyncToastProps> = ({
  message,
  type,
  visible = true,
  onClose,
  duration = 4000,
  showIcon = true,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (visible && duration > 0 && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        // Allow exit animation to complete before removing
        setTimeout(() => {
          onClose?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose, isExiting]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // 类型对应的样式
  const typeStyles: Record<SyncToastType, { 
    border: string; 
    icon: React.ReactNode;
    iconColor: string;
    bg: string;
  }> = {
    success: {
      border: 'var(--color-base-success)',
      icon: <CheckCircle size={16} />,
      iconColor: 'var(--color-base-success)',
      bg: 'rgba(61, 139, 122, 0.08)',
    },
    error: {
      border: 'var(--color-base-error)',
      icon: <XCircle size={16} />,
      iconColor: 'var(--color-base-error)',
      bg: 'rgba(139, 74, 74, 0.08)',
    },
    progress: {
      border: 'var(--color-base-accent)',
      icon: <Loader size={16} className="animate-spin" />,
      iconColor: 'var(--color-base-accent)',
      bg: 'rgba(74, 122, 155, 0.08)',
    },
  };

  const styles = typeStyles[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={isExiting ? { opacity: 0, y: 10, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 
            border rounded-lg shadow-lg backdrop-blur-md
            min-w-[240px] max-w-[360px]
          `}
          style={{
            backgroundColor: styles.bg,
            borderColor: styles.border,
            borderWidth: '1px',
          }}
        >
          {/* 图标 */}
          {showIcon && (
            <div
              className="flex-shrink-0"
              style={{ color: styles.iconColor }}
            >
              {type === 'progress' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  {styles.icon}
                </motion.div>
              ) : (
                styles.icon
              )}
            </div>
          )}

          {/* 消息内容 */}
          <div className="flex-1 min-w-0">
            <p 
              className="text-xs font-mono tracking-wide truncate"
              style={{ color: 'var(--color-base-text-light)' }}
            >
              {message}
            </p>
          </div>

          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={handleClose}
              className="
                flex-shrink-0 p-1 rounded
                opacity-50 hover:opacity-100 transition-opacity
                hover:bg-[var(--color-base-border)]/30
              "
              style={{ color: 'var(--color-base-text)' }}
            >
              <XCircle size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 预置的同步状态 Toast 组件
interface SyncStatusToastProps {
  status: 'connected' | 'disconnected' | 'syncing' | 'success' | 'error';
  baseName?: string;
  onClose?: () => void;
}

export const SyncStatusToast: React.FC<SyncStatusToastProps> = ({
  status,
  baseName = 'PersonalBase',
  onClose,
}) => {
  const configs: Record<string, { message: string; type: SyncToastType }> = {
    connected: {
      message: `已连接到 ${baseName}`,
      type: 'success',
    },
    disconnected: {
      message: '与基地连接已断开',
      type: 'error',
    },
    syncing: {
      message: '正在同步数据...',
      type: 'progress',
    },
    success: {
      message: '同步完成',
      type: 'success',
    },
    error: {
      message: '同步失败，正在重试...',
      type: 'error',
    },
  };

  const config = configs[status] || configs.syncing;

  return (
    <SyncToast
      message={config.message}
      type={config.type}
      onClose={onClose}
      duration={status === 'syncing' ? 0 : 4000}
    />
  );
};

// Toast 容器组件 - 用于管理多个 Toast
interface SyncToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: SyncToastType;
  }>;
  onRemove: (id: string) => void;
}

export const SyncToastContainer: React.FC<SyncToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <SyncToast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default SyncToast;
