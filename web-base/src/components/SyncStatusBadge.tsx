import React from 'react';

// 同步状态枚举
export type SyncStatus = 
  | 'disconnected'     // 未连接
  | 'discovered'       // 已发现基地
  | 'pending_return'   // 待回港
  | 'syncing'          // 同步中
  | 'delivered'        // 已送达
  | 'confirmed'       // 基地已确认
  | 'failed';         // 失败待重试

// 状态中文标签
export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  disconnected: '未连接',
  discovered: '已发现基地',
  pending_return: '待回港',
  syncing: '同步中',
  delivered: '已送达',
  confirmed: '基地已确认',
  failed: '失败待重试',
};

// 状态颜色
export const SYNC_STATUS_COLORS: Record<SyncStatus, { bg: string; text: string; border: string }> = {
  disconnected: {
    bg: 'rgba(90, 101, 119, 0.12)',
    text: 'var(--color-base-text)',
    border: 'var(--color-base-border)',
  },
  discovered: {
    bg: 'rgba(74, 122, 155, 0.12)',
    text: 'var(--color-base-accent)',
    border: 'var(--color-base-accent)',
  },
  pending_return: {
    bg: 'rgba(154, 133, 69, 0.12)',
    text: 'var(--color-base-warning)',
    border: 'var(--color-base-warning)',
  },
  syncing: {
    bg: 'rgba(74, 122, 155, 0.15)',
    text: 'var(--color-base-accent)',
    border: 'var(--color-base-accent)',
  },
  delivered: {
    bg: 'rgba(61, 139, 122, 0.12)',
    text: 'var(--color-base-success)',
    border: 'var(--color-base-success)',
  },
  confirmed: {
    bg: 'rgba(61, 139, 122, 0.18)',
    text: 'var(--color-base-success)',
    border: 'var(--color-base-success)',
  },
  failed: {
    bg: 'rgba(139, 74, 74, 0.12)',
    text: 'var(--color-base-error)',
    border: 'var(--color-base-error)',
  },
};

interface SyncStatusBadgeProps {
  status: SyncStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = false,
}) => {
  const isKnownStatus = status in SYNC_STATUS_LABELS;
  const label = isKnownStatus 
    ? SYNC_STATUS_LABELS[status as SyncStatus] 
    : status;
  const colors = isKnownStatus 
    ? SYNC_STATUS_COLORS[status as SyncStatus] 
    : SYNC_STATUS_COLORS.disconnected;

  const sizeClasses = {
    sm: 'text-[8px] px-1.5 py-0.5',
    md: 'text-[9px] px-2 py-1',
    lg: 'text-[10px] px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md font-mono
        tracking-wider uppercase border
        ${sizeClasses[size]}
      `}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {/* 状态指示点 */}
      <span
        className={`
          w-1.5 h-1.5 rounded-full flex-shrink-0
          ${showPulse || status === 'syncing' ? 'animate-pulse' : ''}
        `}
        style={{ backgroundColor: colors.text }}
      />
      {label}
    </span>
  );
};

export default SyncStatusBadge;
