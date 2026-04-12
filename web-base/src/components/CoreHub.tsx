import React from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { NavigateFunction } from 'react-router-dom';

interface CoreHubProps {
  baseStatus: string;
  pendingCount: number;
  archivedCount: number;
  lastReturn: number | null;
  isSSEConnected: boolean;
  navigate: NavigateFunction;
}

const CoreHub: React.FC<CoreHubProps> = ({
  baseStatus,
  pendingCount,
  archivedCount,
  lastReturn,
  isSSEConnected,
  navigate,
}) => {
  // Derive hasRecentActivity from baseStatus for internal animations
  const hasRecentActivity = baseStatus === '感知到回港';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.25 }}
      className="w-full panel bg-[var(--color-base-panel)] border border-[var(--color-base-border)] px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center gap-4 md:gap-8"
      whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(74, 122, 155, 0.06)' }}
    >
      {/* Base Status */}
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-2.5 h-2.5 rounded-full ${hasRecentActivity ? 'bg-[var(--color-base-success)]' : 'bg-[var(--color-base-accent)]/60'}`}
          animate={hasRecentActivity ? {
            boxShadow: ['0 0 4px rgba(61, 139, 122, 0.4)', '0 0 12px rgba(61, 139, 122, 0.6)', '0 0 4px rgba(61, 139, 122, 0.4)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div>
          <p className="text-sm font-mono text-[var(--color-base-text-bright)]">
            {baseStatus}
          </p>
        </div>
      </div>

      <div className="hidden sm:block w-px h-8 bg-[var(--color-base-border)]" />

      {/* Stats */}
      <div className="flex items-center gap-4 md:gap-6">
        <div>
          <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">待入舱</p>
          <p className="text-sm font-mono text-[var(--color-base-text-light)]">{pendingCount}</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">已沉淀</p>
          <p className="text-sm font-mono text-[var(--color-base-text-light)]">{archivedCount}</p>
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-[var(--color-base-border)]" />

      {/* Last Return Time */}
      <div className="hidden md:block">
        <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">上次回港</p>
        <p className="text-xs font-mono text-[var(--color-base-text-light)]">
          {lastReturn ? dayjs(lastReturn).format('MM-DD HH:mm') : '暂无记录'}
        </p>
      </div>

      {/* SSE Connection Status */}
      <div className="hidden md:flex items-center gap-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${isSSEConnected ? 'bg-[var(--color-base-success)]' : 'bg-[var(--color-base-error)]'}`}
          animate={isSSEConnected ? {
            boxShadow: ['0 0 4px rgba(61, 139, 122, 0.4)', '0 0 8px rgba(61, 139, 122, 0.6)', '0 0 4px rgba(61, 139, 122, 0.4)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">
          {isSSEConnected ? '实时同步' : '轮询模式'}
        </span>
      </div>

      <div className="flex-1 hidden md:block" />

      {/* Navigation hints */}
      <div className="flex items-center gap-3 md:gap-4">
        <motion.button
          onClick={() => navigate('/wall')}
          className="text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors"
          whileHover={{ y: -2 }}
        >
          碎片墙
        </motion.button>
        <motion.button
          onClick={() => navigate('/echo')}
          className="text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors"
          whileHover={{ y: -2 }}
        >
          回响
        </motion.button>
        <motion.button
          onClick={() => navigate('/archive')}
          className="text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors"
          whileHover={{ y: -2 }}
        >
          档案馆
        </motion.button>
      </div>
    </motion.div>
  );
};

export { CoreHub };
