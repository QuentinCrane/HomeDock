import { Zap, Wind, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFeedback, type MotionLevel } from './GlobalFeedbackCenter';

export interface MotionLevelControlProps {
  /** Custom class for the container */
  className?: string;
  /** Layout variant */
  variant?: 'buttons' | 'select' | 'radio';
  /** Show labels */
  showLabel?: boolean;
}

const MOTION_LEVEL_OPTIONS: { value: MotionLevel; label: string; icon: typeof Zap }[] = [
  { value: 'full', label: '完整', icon: Zap },
  { value: 'light', label: '轻量', icon: Wind },
  { value: 'minimal', label: '极简', icon: Minimize2 },
];

/**
 * Animation intensity control.
 * Options: 完整(full) / 轻量(light) / 极简(minimal)
 * Persists to localStorage.
 * Affects animation duration across the app.
 */
export function MotionLevelControl({
  className = '',
  variant = 'buttons',
  showLabel = true,
}: MotionLevelControlProps) {
  const { motionLevel, setMotionLevel, motionEnabled } = useFeedback();

  // Transition class based on motionEnabled
  const transitionClass = motionEnabled ? 'transition-all duration-200' : 'transition-none';

  // ===========================================================================
  // Button Variant
  // ===========================================================================
  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="动画强度">
        {MOTION_LEVEL_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = motionLevel === value;
          
          return (
            <motion.button
              key={value}
              onClick={() => setMotionLevel(value)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px]
                ${transitionClass}
                ${isActive
                  ? 'text-[var(--color-base-text-light)] bg-[var(--color-base-accent)]/20 border border-[var(--color-base-accent)]/30'
                  : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30 border border-transparent'
                }
              `}
              whileTap={motionEnabled ? { scale: 0.95 } : {}}
              title={`动画强度: ${label}`}
              aria-pressed={isActive}
            >
              <Icon size={10} />
              {showLabel && <span>{label}</span>}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // ===========================================================================
  // Select Variant
  // ===========================================================================
  if (variant === 'select') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-70">
            动画
          </span>
        )}
        <select
          value={motionLevel}
          onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}
          className={`
            px-2 py-1 rounded-md font-mono text-[10px]
            bg-[var(--color-base-panel)] border border-[var(--color-base-border)]
            text-[var(--color-base-text)]
            ${transitionClass}
            focus:outline-none focus:border-[var(--color-base-accent)]
          `}
          aria-label="动画强度"
        >
          {MOTION_LEVEL_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ===========================================================================
  // Radio Variant
  // ===========================================================================
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="radiogroup" aria-label="动画强度">
      {showLabel && (
        <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-70 uppercase tracking-wider">
          动画强度
        </span>
      )}
      <div className="flex items-center gap-2">
        {MOTION_LEVEL_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = motionLevel === value;
          
          return (
            <motion.button
              key={value}
              onClick={() => setMotionLevel(value)}
              className={`
                flex items-center gap-1.5 px-2 py-1.5 rounded-md font-mono text-[10px]
                ${transitionClass}
                ${isActive
                  ? 'text-[var(--color-base-text-light)] bg-[var(--color-base-accent)]/20 border border-[var(--color-base-accent)]/30'
                  : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30 border border-transparent'
                }
              `}
              whileTap={motionEnabled ? { scale: 0.95 } : {}}
              role="radio"
              aria-checked={isActive}
              title={`动画强度: ${label}`}
            >
              <span className={`
                w-2 h-2 rounded-full border
                ${isActive 
                  ? 'border-[var(--color-base-accent)] bg-[var(--color-base-accent)]' 
                  : 'border-[var(--color-base-border)]'
                }
              `} />
              <Icon size={10} />
              {showLabel && <span>{label}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default MotionLevelControl;
