import React from 'react';
import { motion } from 'framer-motion';

interface BaseConnectionIndicatorProps {
  isConnected: boolean;
  baseName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BaseConnectionIndicator: React.FC<BaseConnectionIndicatorProps> = ({
  isConnected,
  baseName = 'PersonalBase',
  size = 'md',
}) => {
  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-[8px]',
      gap: 'gap-1',
    },
    md: {
      dot: 'w-2.5 h-2.5',
      text: 'text-[9px]',
      gap: 'gap-1.5',
    },
    lg: {
      dot: 'w-3 h-3',
      text: 'text-[10px]',
      gap: 'gap-2',
    },
  };

  const { dot, text, gap } = sizeConfig[size];

  return (
    <div className={`flex items-center ${gap}`}>
      {/* 连接状态点 */}
      <div className="relative">
        <motion.div
          className={`${dot} rounded-full`}
          style={{
            backgroundColor: isConnected 
              ? 'var(--color-base-success)' 
              : 'var(--color-base-error)',
          }}
          animate={isConnected ? {
            boxShadow: [
              '0 0 0 0 rgba(61, 139, 122, 0.4)',
              '0 0 0 6px rgba(61, 139, 122, 0)',
            ],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: isConnected ? Infinity : 0,
            ease: 'easeOut',
          }}
        />
        
        {/* 未连接时的脉冲效果 */}
        {!isConnected && (
          <motion.div
            className={`absolute inset-0 ${dot} rounded-full`}
            style={{
              backgroundColor: 'var(--color-base-error)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      {/* 标签 */}
      <div className={`flex flex-col ${gap}`}>
        <span 
          className={`
            font-mono tracking-wider uppercase
            ${text}
          `}
          style={{
            color: isConnected 
              ? 'var(--color-base-success)' 
              : 'var(--color-base-error)',
          }}
        >
          {isConnected ? '已连接' : '未连接'}
        </span>
        
        {baseName && isConnected && (
          <motion.span
            className={`font-mono ${text} opacity-60`}
            style={{ color: 'var(--color-base-text-light)' }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 0.6, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {baseName}
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default BaseConnectionIndicator;
