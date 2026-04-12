import React from 'react';
import { Search } from 'lucide-react';

export type TimeFilter = 'all' | 'today' | 'week' | 'older';
export type TypeFilter = 'all' | 'text' | 'image' | 'audio';

interface ArchiveSidebarProps {
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ArchiveSidebar: React.FC<ArchiveSidebarProps> = ({
  timeFilter,
  setTimeFilter,
  typeFilter,
  setTypeFilter,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar">
      {/* 搜索 */}
      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-base-text)] opacity-50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索档案..."
          className="w-full pl-9 pr-4 py-2 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] text-sm text-[var(--color-base-text-light)] placeholder:text-[var(--color-base-text)] placeholder:opacity-50 focus:outline-none focus:border-[var(--color-base-border-highlight)] font-mono"
        />
      </div>

      {/* 筛选器 */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase">时间</span>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'all' as TimeFilter, label: '全部' },
              { key: 'today' as TimeFilter, label: '今天' },
              { key: 'week' as TimeFilter, label: '本周' },
              { key: 'older' as TimeFilter, label: '更早' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`px-2 py-1 text-[10px] font-mono transition-colors ${
                  timeFilter === key
                    ? 'bg-[var(--color-base-border)] text-[var(--color-base-text-bright)]'
                    : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-widest uppercase">类型</span>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'all' as TypeFilter, label: '全部' },
              { key: 'text' as TypeFilter, label: '文字' },
              { key: 'image' as TypeFilter, label: '图片' },
              { key: 'audio' as TypeFilter, label: '音频' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-2 py-1 text-[10px] font-mono transition-colors ${
                  typeFilter === key
                    ? 'bg-[var(--color-base-border)] text-[var(--color-base-text-bright)]'
                    : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveSidebar;