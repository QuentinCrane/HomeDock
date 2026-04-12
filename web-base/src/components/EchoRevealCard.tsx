import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Capsule } from '../api';
import dayjs from 'dayjs';

interface EchoRevealCardProps {
  capsule: Capsule | null;
  loading: boolean;
}

const EchoRevealCard: React.FC<EchoRevealCardProps> = ({ capsule, loading }) => {
  return (
    <div className="relative bg-[var(--color-base-panel)] border border-[var(--color-base-border)] p-10 flex flex-col items-center justify-center min-h-[400px] rounded-lg overflow-hidden">
      {/* 柔和光晕 - 从中心向外扩散 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-[var(--color-base-panel-light)] via-transparent to-transparent opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--color-base-accent)] opacity-[0.03] rounded-full blur-[40px]" />
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
            />
            <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest">
              LOADING
            </p>
          </motion.div>
        ) : capsule ? (
          <motion.div
            key={capsule.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: { 
                duration: 0.25
              }
            }}
            exit={{ 
              opacity: 0, 
              x: -20,
              transition: { 
                duration: 0.25
              }
            }}
            className="text-center relative z-10 w-full"
          >
            {/* 类型标记 */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-2 h-2 rounded-full ${
                capsule.type === 'text' ? 'bg-amber-400/70' : capsule.type === 'image' ? 'bg-amber-500/70' : 'bg-emerald-400/70'
              }`}></div>
              <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-[0.25em] uppercase">
                {capsule.type === 'text' ? '文字记忆' : capsule.type === 'image' ? '图片记忆' : '音频记忆'}
              </span>
            </div>

            {/* 文字记忆 */}
            {capsule.type === 'text' && capsule.content && (
              <div className="relative">
                {/* 装饰性引号 */}
                <span className="absolute -left-6 top-0 text-[var(--color-base-text)] opacity-10 text-6xl font-serif leading-none">"</span>
                <span className="absolute -right-6 bottom-0 text-[var(--color-base-text)] opacity-10 text-6xl font-serif leading-none rotate-180">"</span>
                
                <p className="text-2xl md:text-3xl text-[var(--color-base-text-bright)] font-serif leading-relaxed whitespace-pre-wrap px-4">
                  {capsule.content}
                </p>
              </div>
            )}

            {/* 图片记忆 */}
            {capsule.type === 'image' && capsule.fileUrl && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  {/* 图片边框光晕 */}
                  <div className="absolute -inset-2 bg-gradient-to-b from-[var(--color-base-accent)]/10 to-transparent rounded-lg blur-[8px]" />
                  <img
                    src={`http://localhost:3000${capsule.fileUrl}`}
                    alt="记忆"
                    className="relative max-h-72 object-contain border border-[var(--color-base-border)] rounded-lg shadow-lg"
                  />
                </div>
                {capsule.content && (
                  <p className="text-lg text-[var(--color-base-text-light)] font-serif italic">{capsule.content}</p>
                )}
              </div>
            )}

            {/* 音频记忆 */}
            {capsule.type === 'audio' && capsule.fileUrl && (
              <div className="flex flex-col items-center gap-6 w-full max-w-md">
                {/* 音频可视化装饰 */}
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-base-accent)] animate-pulse opacity-70" />
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-0.5 bg-[var(--color-base-accent)]/50 rounded-full animate-pulse"
                        style={{ 
                          height: `${8 + Math.sin(i * 0.8) * 6}px`,
                          animationDelay: `${i * 0.1}s`
                        }} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] tracking-[0.2em] font-mono uppercase text-[var(--color-base-text)]">音频片段</span>
                </div>
                
                {/* 音频播放器 */}
                <audio 
                  controls 
                  src={`http://localhost:3000${capsule.fileUrl}`} 
                  className="w-full h-10 rounded-lg bg-[var(--color-base-bg)] border border-[var(--color-base-border)]"
                />
                
                {capsule.content && (
                  <p className="text-sm text-[var(--color-base-text-light)] font-serif italic">{capsule.content}</p>
                )}
              </div>
            )}

            {/* 时间戳 */}
            <p className="mt-10 text-xs text-[var(--color-base-text)] font-mono tracking-wider opacity-60">
              {dayjs(capsule.timestamp).format('YYYY 年 MM 月 DD 日')}
            </p>

            {/* ID */}
            <p className="mt-2 text-[10px] text-[var(--color-base-text)] opacity-30 font-mono">
              #{capsule.id.toString().padStart(4, '0')}
            </p>
          </motion.div>
        ) : (
          /* 空状态 */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {/* 柔和的图标 */}
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-base-accent)] opacity-5 rounded-full blur-[20px]" />
              <Sparkles size={32} className="relative text-[var(--color-base-text)] opacity-20" />
            </div>
            <p className="text-[var(--color-base-text)] font-serif italic text-lg opacity-50">
              档案馆中暂无记忆
            </p>
            <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30 tracking-widest">
              THE ARCHIVE AWAITS
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EchoRevealCard;
