import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Inbox, Image, Mic, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import type { Capsule } from '../api';

interface RecentFragmentsRailProps {
  recentItems: Capsule[];
  loading: boolean;
  navigate: (path: string) => void;
}

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

export const RecentFragmentsRail: React.FC<RecentFragmentsRailProps> = ({
  recentItems,
  loading,
  navigate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15 }}
      className="flex-1 h-full panel bg-[var(--color-base-panel)] border border-[var(--color-base-border)] flex flex-col overflow-hidden min-h-[300px] lg:min-h-0"
      whileHover={{ y: -2, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-base-border)] flex justify-between items-center">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Clock size={13} className="text-[var(--color-base-accent)]" />
          <span className="text-xs font-mono tracking-wider text-[var(--color-base-text-bright)]">
            最近碎片
          </span>
        </motion.div>
        <motion.button
          onClick={() => navigate('/wall')}
          className="text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors flex items-center gap-1"
          whileHover={{ y: -2 }}
        >
          查看全部 <ChevronRight size={11} />
        </motion.button>
      </div>

      {/* Content - Loose grid with irregular heights */}
      <div className="flex-1 p-3 overflow-y-auto">
        {loading ? (
          <motion.div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
            />
          </motion.div>
        ) : recentItems.length === 0 ? (
          <motion.div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Inbox size={22} className="text-[var(--color-base-text)] opacity-30" />
            </motion.div>
            <p className="text-xs font-mono text-[var(--color-base-text)] opacity-40">暂无碎片</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {recentItems.map((cap, idx) => {
              const isNew = dayjs().diff(dayjs(cap.timestamp), 'minute') < 5;
              // Vary card heights for visual irregularity
              const heightClass = idx % 3 === 0 ? 'min-h-[100px]' : idx % 2 === 0 ? 'min-h-[80px]' : 'min-h-[90px]';
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                  onClick={() => navigate('/wall')}
                  className={`${heightClass} bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-lg p-3 hover:border-[var(--color-base-border-highlight)] transition-all cursor-pointer group flex flex-col ${
                    isNew ? 'shadow-[0_0_12px_rgba(74,122,155,0.08)]' : ''
                  }`}
                >
                  {/* Content - no labels */}
                  {cap.type === 'text' && (
                    <p className="text-xs text-[var(--color-base-text-light)] font-sans line-clamp-3 leading-relaxed flex-1">
                      {cap.content}
                    </p>
                  )}
                  {cap.type === 'image' && cap.fileUrl && (
                    <img
                      src={`http://localhost:3000${cap.fileUrl}`}
                      alt=""
                      className="w-full h-14 object-cover rounded border border-[var(--color-base-border)] group-hover:brightness-105 transition-all"
                    />
                  )}
                  {cap.type === 'audio' && (
                    <div className="flex items-center gap-2 flex-1">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[var(--color-base-accent)]"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[10px] text-[var(--color-base-text)]">音频片段</span>
                    </div>
                  )}
                  {/* Timestamp only, no ID */}
                  <div className="mt-auto pt-2 flex justify-between items-center">
                    <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">
                      {dayjs(cap.timestamp).format('MM-DD HH:mm')}
                    </span>
                    <span className={getTypeColor(cap.type)}>{getTypeIcon(cap.type, 10)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
