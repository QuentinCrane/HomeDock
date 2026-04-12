import React from 'react';
import { motion } from 'framer-motion';
import type { Capsule } from '../api';
import dayjs from 'dayjs';

interface ArchiveListPaneProps {
  capsules: Capsule[];
  selectedCapsuleId?: number | null;
  onSelect: (cap: Capsule) => void;
  loading: boolean;
}

interface ArchiveEntryProps {
  capsule: Capsule;
  isFirst: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const ArchiveEntry: React.FC<ArchiveEntryProps> = ({ capsule, isFirst, isSelected, onClick }) => {
  const isDeleted = !!capsule.deletedAt;

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[var(--color-base-border-highlight)]/30 border border-[var(--color-base-border-highlight)]'
          : 'bg-[var(--color-base-panel)] border border-[var(--color-base-border)] hover:border-[var(--color-base-border-highlight)]'
      } ${!isFirst && !isSelected ? 'ml-3' : ''} ${isDeleted ? 'opacity-60 border-amber-400/30' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* 类型标记 */}
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
          capsule.type === 'text' ? 'bg-blue-400' : capsule.type === 'image' ? 'bg-amber-500' : 'bg-emerald-500'
        }`}></div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {capsule.type === 'text' && (
            <p className="text-sm text-[var(--color-base-text-light)] leading-relaxed line-clamp-2">
              {capsule.content}
            </p>
          )}
          {capsule.type === 'image' && capsule.fileUrl && (
            <div className="flex items-center gap-3">
              <img
                src={`http://localhost:3000${capsule.fileUrl}`}
                alt="档案图片"
                className="w-12 h-12 object-cover border border-[var(--color-base-border)] grayscale-[0.2]"
              />
              {capsule.content && (
                <p className="text-xs text-[var(--color-base-text-light)] line-clamp-2 flex-1">{capsule.content}</p>
              )}
            </div>
          )}
          {capsule.type === 'audio' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--color-base-text)]">音频片段</span>
              <audio controls src={`http://localhost:3000${capsule.fileUrl}`} className="h-6 w-48 opacity-70" />
              {capsule.content && (
                <span className="text-xs text-[var(--color-base-text-light)] truncate">{capsule.content}</span>
              )}
            </div>
          )}
        </div>

        {/* 时间 + 状态 */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60">
            {dayjs(capsule.timestamp).format('HH:mm')}
          </p>
          <p className={`text-[9px] font-mono mt-0.5 ${
            isDeleted ? 'text-amber-400' : 'text-[var(--color-base-text)] opacity-40'
          }`}>
            {isDeleted ? '已删除' : `#${capsule.id.toString().padStart(4, '0')}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ArchiveListPane: React.FC<ArchiveListPaneProps> = ({
  capsules,
  selectedCapsuleId,
  onSelect,
  loading,
}) => {
  // Group by date
  const grouped: Record<string, Capsule[]> = {};
  capsules.forEach(cap => {
    const dateKey = dayjs(cap.timestamp).format('YYYY.MM.DD');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(cap);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 列表 */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
            />
          </div>
        ) : capsules.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-mono text-[var(--color-base-text)] tracking-widest animate-pulse">
              档案为空
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, caps]) => (
              <div key={date}>
                {/* 日期标题 */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-mono text-[var(--color-base-text)] tracking-widest">{date}</span>
                  <div className="flex-1 h-px bg-[var(--color-base-border)]"></div>
                  <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60">{caps.length} 份</span>
                </div>

                {/* 该日期的条目列表 */}
                <div className="space-y-2">
                  {caps.map((cap, idx) => (
                    <ArchiveEntry
                      key={cap.id}
                      capsule={cap}
                      isFirst={idx === 0}
                      isSelected={selectedCapsuleId === cap.id}
                      onClick={() => onSelect(cap)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveListPane;