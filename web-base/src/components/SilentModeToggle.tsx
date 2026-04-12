import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFeedback } from './GlobalFeedbackCenter';

export interface SilentModeToggleProps {
  /** Custom class for the button */
  className?: string;
  /** Show text label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Global silent mode toggle button.
 * Works across all main spaces (Home/Wall/Echo/Archive).
 * 
 * When active:
 * - Dims brightness
 * - Reduces/disables animations
 * - Hides auxiliary labels
 */
export function SilentModeToggle({ 
  className = '', 
  showLabel = true,
  size = 'md',
}: SilentModeToggleProps) {
  const { silentMode, toggleSilentMode, motionEnabled } = useFeedback();

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-[9px]',
    md: 'px-3 py-1.5 text-[10px]',
    lg: 'px-4 py-2 text-xs',
  };

  const iconSize = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  // Animation classes
  const transitionClass = motionEnabled ? 'transition-all duration-200' : '';

  return (
    <motion.button
      onClick={toggleSilentMode}
      className={`
        flex items-center gap-1.5 rounded-md font-mono
        ${sizeClasses[size]}
        ${transitionClass}
        ${className}
        ${silentMode
          ? 'text-[var(--color-base-text-light)] bg-[var(--color-base-border)]/50'
          : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30'
        }
      `}
      title={silentMode ? '唤醒' : '静默'}
      whileTap={motionEnabled ? { scale: 0.95 } : {}}
      aria-label={silentMode ? '唤醒 (退出静默模式)' : '静默'}
      aria-pressed={silentMode}
    >
      <motion.span
        animate={motionEnabled && !silentMode ? { rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
      >
        {silentMode ? (
          <Sun size={iconSize[size]} />
        ) : (
          <Moon size={iconSize[size]} />
        )}
      </motion.span>
      
      {showLabel && (
        <span className="tracking-wider">
          {silentMode ? '唤醒' : '静默'}
        </span>
      )}
    </motion.button>
  );
}

export default SilentModeToggle;
