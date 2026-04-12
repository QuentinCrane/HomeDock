import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Image, Mic, FileText, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';
import type { Capsule } from '../api';
import { useAnimation } from '../App';

interface EchoPreviewCardProps {
  capsule: Capsule | null;
  onNavigate: () => void;
}

// Soft gradient colors for echo preview
const getSoftGradient = (type: string, isDay: boolean) => {
  if (isDay) {
    switch (type) {
      case 'text': return 'from-amber-50/40 to-orange-50/30';
      case 'image': return 'from-rose-50/40 to-pink-50/30';
      case 'audio': return 'from-emerald-50/40 to-teal-50/30';
      default: return 'from-stone-50/40 to-stone-50/30';
    }
  }
  switch (type) {
    case 'text': return 'from-amber-900/10 to-orange-900/8';
    case 'image': return 'from-rose-900/10 to-pink-900/8';
    case 'audio': return 'from-emerald-900/10 to-teal-900/8';
    default: return 'from-slate-800/10 to-slate-800/8';
  }
};

const getSoftGlow = (type: string, isDay: boolean) => {
  if (isDay) {
    switch (type) {
      case 'text': return 'shadow-[0_0_30px_rgba(251,191,36,0.08)]';
      case 'image': return 'shadow-[0_0_30px_rgba(244,63,94,0.08)]';
      case 'audio': return 'shadow-[0_0_30px_rgba(52,211,153,0.08)]';
      default: return 'shadow-[0_0_30px_rgba(150,150,150,0.06)]';
    }
  }
  switch (type) {
    case 'text': return 'shadow-[0_0_40px_rgba(180,130,60,0.12)]';
    case 'image': return 'shadow-[0_0_40px_rgba(180,80,100,0.12)]';
    case 'audio': return 'shadow-[0_0_40px_rgba(60,160,130,0.12)]';
    default: return 'shadow-[0_0_40px_rgba(80,100,140,0.08)]';
  }
};

const TypeIcon: React.FC<{ type: string; size?: number; isDay: boolean }> = ({ type, size = 14, isDay }) => {
  const colorClass = isDay
    ? 'text-amber-600/50'
    : 'text-amber-400/40';

  switch (type) {
    case 'text': return <FileText size={size} className={colorClass} />;
    case 'image': return <Image size={size} className={colorClass} />;
    case 'audio': return <Mic size={size} className={colorClass} />;
    default: return <FileText size={size} className={colorClass} />;
  }
};

export const EchoPreviewCard: React.FC<EchoPreviewCardProps> = ({
  capsule,
  onNavigate,
}) => {
  const { motionEnabled } = useAnimation();

  // Empty state - no capsule
  if (!capsule) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-full min-h-[180px] rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-base-panel)]/60 to-[var(--color-base-panel)]/40 backdrop-blur-sm border border-[var(--color-base-border)]/30 rounded-2xl" />
        <div className="relative h-full flex flex-col items-center justify-center gap-3 p-6">
          <motion.div
            animate={motionEnabled ? { opacity: [0.3, 0.5, 0.3] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles size={24} className="text-[var(--color-base-text)] opacity-30" />
          </motion.div>
          <p className="text-xs font-mono text-[var(--color-base-text)] opacity-40 text-center">
            回响池暂无内容
          </p>
          <button
            onClick={onNavigate}
            className="mt-1 px-3 py-1.5 text-[10px] font-mono text-[var(--color-base-accent)] hover:text-[var(--color-base-text-bright)] transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
          >
            探索回响 <ChevronRight size={10} />
          </button>
        </div>
      </motion.div>
    );
  }

  const isDay = document.documentElement.getAttribute('data-theme') === 'day';
  const gradientClass = getSoftGradient(capsule.type, isDay);
  const glowClass = getSoftGlow(capsule.type, isDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative w-full h-full min-h-[180px] rounded-2xl overflow-hidden cursor-pointer group"
      onClick={onNavigate}
    >
      {/* Soft gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} backdrop-blur-md rounded-2xl`} />

      {/* Soft border */}
      <div className="absolute inset-0 border border-[var(--color-base-border)]/20 rounded-2xl group-hover:border-[var(--color-base-border)]/40 transition-all duration-500" />

      {/* Ambient glow effect */}
      <motion.div
        animate={motionEnabled ? { opacity: [0.3, 0.5, 0.3] } : { opacity: 0.4 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-2 rounded-xl ${glowClass}`}
      />

      {/* Content container */}
      <div className="relative h-full flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={motionEnabled ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={12} className="text-[var(--color-base-accent)]/50" />
            </motion.div>
            <span className="text-[10px] font-mono text-[var(--color-base-text)]/50 uppercase tracking-widest">
              回响碎片
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TypeIcon type={capsule.type} size={12} isDay={isDay} />
            <span className="text-[9px] font-mono text-[var(--color-base-text)]/40">
              {dayjs(capsule.timestamp).format('MM-DD')}
            </span>
          </div>
        </div>

        {/* Main content - soft and dreamy */}
        <div className="flex-1 flex items-center justify-center">
          {capsule.type === 'text' && capsule.content && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-sans text-[var(--color-base-text-light)]/70 leading-relaxed text-center line-clamp-3 px-2 italic"
            >
              "{capsule.content}"
            </motion.p>
          )}

          {capsule.type === 'image' && capsule.fileUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-[120px]"
            >
              <img
                src={`http://localhost:3000${capsule.fileUrl}`}
                alt=""
                className="w-full h-auto object-cover rounded-lg opacity-70 group-hover:opacity-85 transition-opacity duration-500"
                style={{ filter: 'blur(0.5px) saturate(0.9)' }}
              />
              {/* Soft overlay */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[var(--color-base-bg)]/30 to-transparent" />
            </motion.div>
          )}

          {capsule.type === 'audio' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                className="relative w-12 h-12 rounded-full border border-[var(--color-base-accent)]/20 flex items-center justify-center"
                animate={motionEnabled ? {
                  boxShadow: [
                    '0 0 0px rgba(74, 122, 155, 0.2)',
                    '0 0 20px rgba(74, 122, 155, 0.3)',
                    '0 0 0px rgba(74, 122, 155, 0.2)',
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mic size={16} className="text-[var(--color-base-accent)]/50" />
              </motion.div>
              <span className="text-[10px] font-mono text-[var(--color-base-text)]/40">
                音频回响
              </span>
            </motion.div>
          )}
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center mt-2"
        >
          <span className="text-[9px] font-mono text-[var(--color-base-text)]/30 group-hover:text-[var(--color-base-accent)]/50 transition-colors duration-300 flex items-center gap-1">
            探索更多回响 <ChevronRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EchoPreviewCard;
