/**
 * SwipeableCard.tsx - Touch swipe wrapper for card interactions
 *
 * Enables left/right swipe gestures on cards with:
 * - Smooth spring physics for swipe tracking
 * - Threshold-based action triggering
 * - Visual feedback during swipe
 * - Action buttons revealed on swipe
 */

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, type PanInfo } from 'framer-motion';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: (e: any) => void;
  onSwipeRight?: (e: any) => void;
  leftLabel?: string;
  swipeThreshold?: number;
  enabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = '归档',
  swipeThreshold = 80,
  enabled = true,
}) => {
  const x = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offsetX = info.offset.x;

    if (offsetX < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft(null);
    } else if (offsetX > swipeThreshold && onSwipeRight) {
      onSwipeRight(null);
    }
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-xl">
      {/* Background actions revealed on swipe */}
      <div className="absolute inset-0 flex">
        {/* Left action (revealed on swipe left) */}
        <div
          className="flex-1 flex items-center justify-start pl-4"
          style={{
            background: 'linear-gradient(90deg, rgba(139, 74, 74, 0.3) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-2 text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
            </svg>
            <span className="text-[10px] font-mono">删除</span>
          </div>
        </div>
        {/* Right action (revealed on swipe right) */}
        <div
          className="flex-1 flex items-center justify-end pr-4"
          style={{
            background: 'linear-gradient(-90deg, rgba(74, 122, 155, 0.3) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--color-base-accent)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
            </svg>
            <span className="text-[10px] font-mono">{leftLabel}</span>
          </div>
        </div>
      </div>

      {/* Swipeable card */}
      <motion.div
        style={{ x, cursor: 'grab' }}
        drag={enabled ? 'x' : false}
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Swipe hint indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 hover:opacity-30 transition-opacity pointer-events-none">
        <div className="w-1 h-1 rounded-full bg-[var(--color-base-text)]" />
        <div className="w-1 h-1 rounded-full bg-[var(--color-base-text)]" />
        <div className="w-1 h-1 rounded-full bg-[var(--color-base-text)]" />
      </div>
    </div>
  );
};
