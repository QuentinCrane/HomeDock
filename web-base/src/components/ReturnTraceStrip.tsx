import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Mic } from 'lucide-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import type { Capsule } from '../api';

// === Helpers ===
const getTypeIcon = (type: string, size = 12) => {
  switch (type) {
    case 'text': return <FileText size={size} />;
    case 'image': return <Image size={size} />;
    case 'audio': return <Mic size={size} />;
    default: return <FileText size={size} />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'text': return 'text-[var(--color-base-text)]';
    case 'image': return 'text-amber-500/70';
    case 'audio': return 'text-emerald-500/70';
    default: return 'text-[var(--color-base-text)]';
  }
};

interface ReturnTraceStripProps {
  returnTimeline: Capsule[];
  getTimelineMessage: (capsule: Capsule) => string;
  navigate: ReturnType<typeof useNavigate>;
}

export const ReturnTraceStrip: React.FC<ReturnTraceStripProps> = ({
  returnTimeline,
  getTimelineMessage,
  navigate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.3 }}
      className="w-full panel bg-[var(--color-base-panel)] border border-[var(--color-base-border)] px-4 md:px-5 py-2 md:py-3 overflow-x-auto"
      whileHover={{ y: -2, boxShadow: '0 2px 16px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="flex items-center gap-1 min-w-max">
        <motion.span
          className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40 mr-3 whitespace-nowrap"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          回港轨迹
        </motion.span>
        {returnTimeline.length === 0 ? (
          <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30">暂无记录</span>
        ) : (
          returnTimeline.map((cap, idx) => (
            <React.Fragment key={cap.id}>
              {idx > 0 && <div className="w-4 h-px bg-[var(--color-base-border)]" />}
              <motion.div
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--color-base-border)]/30 transition-colors cursor-pointer"
                onClick={() => navigate('/wall')}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(28, 34, 48, 0.5)' }}
              >
                <span className={`${getTypeColor(cap.type)}`}>{getTypeIcon(cap.type, 10)}</span>
                <span className="text-[9px] font-mono text-[var(--color-base-text-light)] whitespace-nowrap">
                  {getTimelineMessage(cap)}
                </span>
                <span className="text-[8px] font-mono text-[var(--color-base-text)] opacity-40">
                  {dayjs(cap.timestamp).format('HH:mm')}
                </span>
              </motion.div>
            </React.Fragment>
          ))
        )}
      </div>
    </motion.div>
  );
};
