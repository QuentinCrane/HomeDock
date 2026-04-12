import { motion } from 'framer-motion';
import type { SyncStatus } from './SyncStatusBadge';

interface SyncProgressRingProps {
  progress: number; // 0-100
  status?: SyncStatus | string;
  size?: number;
  strokeWidth?: number;
}

// 状态对应的颜色
const STATUS_COLORS: Record<string, string> = {
  disconnected: 'var(--color-base-text)',
  discovered: 'var(--color-base-accent)',
  pending_return: 'var(--color-base-warning)',
  syncing: 'var(--color-base-accent)',
  delivered: 'var(--color-base-success)',
  confirmed: 'var(--color-base-success)',
  failed: 'var(--color-base-error)',
};

const SyncProgressRing: React.FC<SyncProgressRingProps> = ({
  progress,
  status = 'syncing',
  size = 48,
  strokeWidth = 3,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const isSyncing = status === 'syncing';
  
  const strokeColor = STATUS_COLORS[status] || 'var(--color-base-accent)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-base-border)"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />
        
        {/* 进度环 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: offset,
            opacity: progress > 0 ? 1 : 0.5,
          }}
          transition={{ 
            duration: 0.5, 
            ease: 'easeOut',
          }}
        />
      </svg>
      
      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isSyncing ? (
          <motion.span
            className="text-[10px] font-mono"
            style={{ color: strokeColor }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {Math.round(progress)}%
          </motion.span>
        ) : (
          <span
            className="text-[10px] font-mono"
            style={{ color: strokeColor }}
          >
            {Math.round(progress)}%
          </span>
        )}
      </div>
      
      {/* 同步中时的旋转光效 */}
      {isSyncing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${strokeColor}`,
            opacity: 0.3,
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

export default SyncProgressRing;
