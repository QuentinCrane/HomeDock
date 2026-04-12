import React from 'react';
import { RefreshCw, Send, Sparkles, Heart } from 'lucide-react';
import type { Capsule } from '../api';

interface EchoActionBarProps {
  current: Capsule | null;
  isFavorited: boolean;
  isRecapturing: boolean;
  activeCapsulesCount: number;
  onSourceJump: () => void;
  onToggleFavorite: () => void;
  onRepick: () => void;
  onRecapture: () => void;
}

const EchoActionBar: React.FC<EchoActionBarProps> = ({
  current,
  isFavorited,
  isRecapturing,
  activeCapsulesCount,
  onSourceJump,
  onToggleFavorite,
  onRepick,
  onRecapture,
}) => {
  return (
    <>
      {/* 操作按钮 */}
      <div className="flex justify-center gap-8 py-10">
        {/* 来源跳转 */}
        {current?.sourceId && (
          <button
            onClick={onSourceJump}
            className="flex flex-col items-center gap-3 group cursor-pointer transition-all"
          >
            <div className="w-18 h-18 border border-[var(--color-base-text)]/30 bg-[var(--color-base-panel)] flex items-center justify-center group-hover:border-[var(--color-base-text)]/60 group-hover:bg-[var(--color-base-panel-light)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-black/10">
              <Sparkles 
                size={22} 
                className="text-[var(--color-base-text)]/60 group-hover:text-[var(--color-base-text)] transition-colors" 
              />
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-base-text)]/60 group-hover:text-[var(--color-base-text)] transition-colors">
              来源: #{current.sourceId.toString().padStart(4, '0')}
            </span>
          </button>
        )}

        {/* 收藏 */}
        <button
          onClick={onToggleFavorite}
          disabled={!current}
          className="flex flex-col items-center gap-3 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <div className={`w-18 h-18 border transition-all duration-300 rounded-lg hover:shadow-lg ${
            isFavorited 
              ? 'border-red-500/60 bg-red-500/10 hover:border-red-500 hover:shadow-red-500/10' 
              : 'border-[var(--color-base-border)] bg-[var(--color-base-panel)] group-hover:border-[var(--color-base-text-light)] group-hover:bg-[var(--color-base-panel-light)] hover:shadow-black/10'
          }`}>
            <Heart 
              size={22} 
              className={`transition-all ${isFavorited 
                ? 'text-red-500 fill-red-500' 
                : 'text-[var(--color-base-text)] group-hover:text-red-400'}`} 
            />
          </div>
          <span className={`text-[10px] font-mono tracking-[0.2em] transition-colors ${
            isFavorited ? 'text-red-500' : 'text-[var(--color-base-text)] group-hover:text-red-400'
          }`}>
            {isFavorited ? '已收藏' : '收藏'}
          </span>
        </button>

        {/* 再抽一条 */}
        <button
          onClick={onRepick}
          disabled={activeCapsulesCount === 0}
          className="flex flex-col items-center gap-3 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <div className="w-18 h-18 border border-[var(--color-base-border)] bg-[var(--color-base-panel)] flex items-center justify-center group-hover:border-[var(--color-base-text-light)] group-hover:bg-[var(--color-base-panel-light)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-black/10">
            <RefreshCw 
              size={22} 
              className="text-[var(--color-base-text)] group-hover:text-[var(--color-base-text-bright)] group-hover:rotate-180 transition-all duration-700" 
            />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-base-text)] group-hover:text-[var(--color-base-text-light)] transition-colors">
            再抽一条
          </span>
        </button>

        {/* 重新投放 */}
        <button
          onClick={onRecapture}
          disabled={!current || isRecapturing}
          className="flex flex-col items-center gap-3 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <div className="w-18 h-18 border border-[var(--color-base-accent)]/40 bg-[var(--color-base-accent)]/5 flex items-center justify-center group-hover:bg-[var(--color-base-accent)]/15 group-hover:border-[var(--color-base-accent)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-[var(--color-base-accent)]/10">
            <Send 
              size={22} 
              className={`text-[var(--color-base-accent)] transition-transform ${isRecapturing ? 'animate-spin' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} 
            />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--color-base-accent)] group-hover:text-[var(--color-base-accent)] transition-colors">
            {isRecapturing ? '投放中...' : '重新投放'}
          </span>
        </button>
      </div>

      {/* 提示 */}
      <div className="text-center pb-8">
        <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-40 tracking-widest leading-relaxed">
          重新投放会将此记忆克隆为新碎片，原记忆保留在回响池中
        </p>
      </div>
    </>
  );
};

export default EchoActionBar;
