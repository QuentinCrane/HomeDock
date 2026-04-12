import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CapsuleStatus } from '../api';

type FilterType = 'all' | 'text' | 'image' | 'audio';
type StatusFilter = 'all' | CapsuleStatus;
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'older';
type SortOrder = 'newest' | 'oldest';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'text-amber-400' },
  pending: { label: '待整理', color: 'text-blue-400' },
  archived: { label: '已归档', color: 'text-slate-400' },
  favorited: { label: '收藏', color: 'text-emerald-400' },
  echoing: { label: '回响中', color: 'text-purple-400' },
};

interface FragmentFilterBarProps {
  filterType: FilterType;
  setFilterType: (f: FilterType) => void;
  filterStatus: StatusFilter;
  setFilterStatus: (f: StatusFilter) => void;
  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;
  sortOrder: SortOrder;
  setSortOrder: (o: SortOrder) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const FragmentFilterBar: React.FC<FragmentFilterBarProps> = ({
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  dateFilter,
  setDateFilter,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
}) => {
  const handleReset = () => {
    setFilterType('all');
    setFilterStatus('all');
    setSearchQuery('');
    setDateFilter('all');
    setSortOrder('newest');
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 p-4 bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-lg"
    >
      <div className="flex flex-wrap gap-6">
        {/* 类型筛选 */}
        <div>
          <p className="text-[10px] text-[var(--color-base-text)] tracking-widest mb-2 uppercase opacity-60">类型</p>
          <div className="flex gap-1">
            {(['all', 'text', 'image', 'audio'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all rounded-md ${
                  filterType === f
                    ? 'bg-[var(--color-base-accent)] text-[var(--color-base-bg)]'
                    : 'bg-[var(--color-base-border)] text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)]'
                }`}
              >
                {f === 'all' ? '全部' : f === 'text' ? '文字' : f === 'image' ? '图片' : '音频'}
              </button>
            ))}
          </div>
        </div>

        {/* 状态筛选 */}
        <div>
          <p className="text-[10px] text-[var(--color-base-text)] tracking-widest mb-2 uppercase opacity-60">状态</p>
          <div className="flex gap-1">
            {(['all', 'draft', 'pending', 'archived', 'favorited'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all rounded-md ${
                  filterStatus === f
                    ? 'bg-[var(--color-base-accent)] text-[var(--color-base-bg)]'
                    : 'bg-[var(--color-base-border)] text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)]'
                }`}
              >
                {f === 'all' ? '全部' : statusConfig[f as CapsuleStatus].label}
              </button>
            ))}
          </div>
        </div>

        {/* 日期筛选 */}
        <div>
          <p className="text-[10px] text-[var(--color-base-text)] tracking-widest mb-2 uppercase opacity-60">日期</p>
          <div className="flex gap-1">
            {(['all', 'today', 'week', 'month', 'older'] as DateFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-mono tracking-widest transition-all rounded-md ${
                  dateFilter === f
                    ? 'bg-[var(--color-base-accent)] text-[var(--color-base-bg)]'
                    : 'bg-[var(--color-base-border)] text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)]'
                }`}
              >
                {f === 'all' ? '全部' : f === 'today' ? '今天' : f === 'week' ? '本周' : f === 'month' ? '本月' : '更早'}
              </button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div>
          <p className="text-[10px] text-[var(--color-base-text)] tracking-widest mb-2 uppercase opacity-60">排序</p>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-1.5 text-[10px] font-mono tracking-widest bg-[var(--color-base-border)] text-[var(--color-base-text)] border-none rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-base-accent)]"
          >
            <option value="newest">最新优先</option>
            <option value="oldest">最旧优先</option>
          </select>
        </div>

        {/* 重置 */}
        {(filterType !== 'all' || filterStatus !== 'all' || searchQuery || dateFilter !== 'all' || sortOrder !== 'newest') && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] flex items-center gap-1 transition-colors"
          >
            <X size={12} /> 重置
          </button>
        )}
      </div>
    </motion.div>
  );
};
