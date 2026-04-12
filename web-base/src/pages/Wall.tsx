/**
 * Wall.tsx - 碎片墙页面
 * 
 * 功能说明：
 *   - 以瀑布流/网格视图展示所有胶囊
 *   - 支持按类型和状态筛选
 *   - 支持关键词搜索
 *   - 点击胶囊打开详情抽屉
 * 
 * 状态管理：
 *   - capsules: 所有胶囊列表
 *   - filterType: 类型筛选（全部/文字/图片/音频）
 *   - filterStatus: 状态筛选（全部/草稿/待整理/已归档/收藏）
 *   - viewMode: 视图模式（瀑布流/列表）
 *   - selectedCapsule: 当前选中的胶囊
 * 
 * 数据流：
 *   - 初始加载：fetchCapsules 获取所有胶囊
 *   - 实时同步：通过 useCapsuleSync 监听 SSE 推送
 *   - 筛选：前端过滤（type + status + searchQuery）
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Capsule, CapsuleStatus } from '../api';
import { fetchCapsules } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Grid, List, Trash2, AlertCircle, RefreshCw, FileText, Image, Mic, Layers, Plus, Home, Radio } from 'lucide-react';
import dayjs from 'dayjs';
import CapsuleDrawer from '../components/CapsuleDrawer';
import { useCapsuleSync } from '../hooks/useSSE';
import { useSyncToast } from '../hooks/useToast';

/// 筛选类型
type FilterType = 'all' | 'text' | 'image' | 'audio';
/// 状态筛选类型
type StatusFilter = 'all' | 'draft' | 'pending' | 'archived' | 'favorited';
/// 视图模式
type ViewMode = 'grid' | 'masonry';

/// 状态配置 - 使用 CSS 变量适配日/夜间模式
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'var(--color-base-warning)', bgColor: 'rgba(154, 133, 69, 0.2)' },
  pending: { label: '待整理', color: 'var(--color-base-accent)', bgColor: 'rgba(74, 122, 155, 0.2)' },
  archived: { label: '已归档', color: 'var(--color-base-text)', bgColor: 'rgba(90, 101, 119, 0.2)' },
  favorited: { label: '收藏', color: 'var(--color-base-success)', bgColor: 'rgba(61, 139, 122, 0.2)' },
  echoing: { label: '回响中', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.2)' },
};

const getStatusStyle = (status: CapsuleStatus | undefined) => {
  return statusConfig[status || 'pending'] || statusConfig.pending;
};

/// 类型颜色配置 - 使用 CSS 变量适配日/夜间模式
const typeColors = {
  text: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', icon: FileText },
  image: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', icon: Image },
  audio: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', icon: Mic },
};

const WallPage: React.FC = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCapsules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCapsules({ includeDeleted: false });
      setCapsules(data);
    } catch (err) {
      setError('加载失败，请重试');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  const { showSyncToast } = useSyncToast();
  const { isSSEConnected } = useCapsuleSync(
    () => { loadCapsules(); },
    { onSyncToast: showSyncToast }
  );

  const filtered = capsules.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (searchQuery && !c.content?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toString().includes(searchQuery)) return false;
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const isRecent = (ts: number) => dayjs().diff(dayjs(ts), 'minute') < 10;

  const handleCapsuleClick = (capsule: Capsule) => {
    setSelectedCapsule(capsule);
    setIsDrawerOpen(true);
  };

  const handleQuickDelete = async (e: React.MouseEvent, capsule: Capsule) => {
    e.stopPropagation();
    if (confirm('确定要删除这个碎片吗？')) {
      try {
        await fetch(`/api/capsules/${capsule.id}`, { method: 'DELETE' });
        loadCapsules();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const TypeIcon = ({ type, size = 12 }: { type: string; size?: number }) => {
    const Icon = (typeColors as Record<string, typeof typeColors.text>)[type]?.icon || Layers;
    return <Icon size={size} />;
  };

  // Empty state content - meaningful scaffold
  const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center relative">
      {/* Wall structure illustration */}
      <div className="relative w-full max-w-md px-8">
        {/* Brick pattern to suggest wall structure */}
        <div className="grid grid-cols-4 gap-2 mb-8 opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-8 rounded"
              style={{ 
                backgroundColor: 'var(--color-base-border)',
                opacity: 0.3 + (i % 3) * 0.1
              }}
            />
          ))}
        </div>

        {/* Central message */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{ backgroundColor: 'var(--color-base-panel)' }}
          >
            <Grid size={28} className="text-[var(--color-base-text)] opacity-30" />
          </motion.div>
          
          <div>
            <p className="text-sm font-mono text-[var(--color-base-text)] opacity-50 tracking-widest mb-2">
              墙面空空如也
            </p>
            <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30">
              添加碎片后它们将显示在这里
            </p>
          </div>
        </div>

        {/* Action suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono transition-all"
            style={{ 
              backgroundColor: 'var(--color-base-accent)',
              color: 'var(--color-base-bg)'
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={12} />
            添加碎片
          </motion.button>
          
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono transition-all"
            style={{ 
              backgroundColor: 'var(--color-base-panel)',
              border: '1px solid var(--color-base-border)',
              color: 'var(--color-base-text)'
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home size={12} />
            返回首页
          </motion.button>
        </motion.div>

        {/* Hint about Android sync */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-mono"
               style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)' }}>
            <Radio size={9} className="text-[var(--color-base-accent)]" />
            <span className="text-[var(--color-base-text)] opacity-50">
              Android 端回港后将自动同步
            </span>
          </div>
        </motion.div>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, var(--color-base-accent) 0%, transparent 70%)',
            opacity: 0.03
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative" style={{ backgroundColor: 'var(--color-base-bg)' }}>
      {/* Top Bar */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-base-border)]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors font-mono text-sm tracking-wider"
          >
            <ArrowLeft size={16} className="hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">返回基地</span>
          </button>

          <h2 className="text-lg font-bold text-[var(--color-base-text-bright)] tracking-[0.2em] flex items-center gap-2">
            <Grid size={18} className="text-[var(--color-base-accent)]" />
            碎片墙
          </h2>

          {/* SSE Connection Status */}
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${isSSEConnected ? 'bg-[var(--color-base-success)]' : 'bg-[var(--color-base-error)]'}`}
              animate={isSSEConnected ? {
                boxShadow: ['0 0 4px rgba(61, 139, 122, 0.4)', '0 0 8px rgba(61, 139, 122, 0.6)', '0 0 4px rgba(61, 139, 122, 0.4)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50 hidden sm:inline">
              {isSSEConnected ? '实时同步' : '轮询'}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Type filter chips */}
          <div className="flex rounded-lg p-1 gap-0.5" style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)' }}>
            {([
              { key: 'all' as FilterType, label: '全部', icon: <Layers size={11} /> },
              { key: 'text' as FilterType, label: '文字', icon: <FileText size={11} /> },
              { key: 'image' as FilterType, label: '图片', icon: <Image size={11} /> },
              { key: 'audio' as FilterType, label: '音频', icon: <Mic size={11} /> },
            ] as { key: FilterType; label: string; icon: React.ReactNode }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider transition-all rounded-md ${
                  filterType === f.key
                    ? 'text-[var(--color-base-bg)]'
                    : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)]'
                }`}
                style={filterType === f.key ? { backgroundColor: 'var(--color-base-accent)' } : {}}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Status filter chips */}
          <div className="flex rounded-lg p-1 gap-0.5" style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)' }}>
            {([
              { key: 'all' as StatusFilter, label: '全部' },
              { key: 'draft' as StatusFilter, label: '草稿' },
              { key: 'pending' as StatusFilter, label: '待整理' },
              { key: 'archived' as StatusFilter, label: '已归档' },
              { key: 'favorited' as StatusFilter, label: '收藏' },
            ] as { key: StatusFilter; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-2.5 py-1.5 text-[10px] font-mono tracking-wider transition-all rounded-md ${
                  filterStatus === f.key
                    ? 'text-[var(--color-base-bg)]'
                    : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)]'
                }`}
                style={filterStatus === f.key ? { backgroundColor: 'var(--color-base-accent)' } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-[180px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-base-text)] opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索碎片..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-[var(--color-base-text-light)] placeholder:text-[var(--color-base-text)] placeholder:opacity-40 focus:outline-none font-mono"
              style={{ 
                backgroundColor: 'var(--color-base-panel)', 
                border: '1px solid var(--color-base-border)'
              }}
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden ml-auto" style={{ border: '1px solid var(--color-base-border)' }}>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 transition-all ${viewMode === 'masonry' ? 'text-[var(--color-base-bg)]' : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)]'}`}
              style={viewMode === 'masonry' ? { backgroundColor: 'var(--color-base-accent)' } : {}}
              title="瀑布流"
            >
              <Grid size={13} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-all ${viewMode === 'grid' ? 'text-[var(--color-base-bg)]' : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)]'}`}
              style={viewMode === 'grid' ? { backgroundColor: 'var(--color-base-accent)' } : {}}
              title="列表"
            >
              <List size={13} />
            </button>

          </div>
        </div>

        {/* Stats */}
        <div className="text-[10px] font-mono text-[var(--color-base-text)] opacity-40 flex items-center gap-3">
          <span>共 {filtered.length} 条</span>
          {filterType !== 'all' && <span style={{ color: 'var(--color-base-accent)' }}>· {filterType === 'text' ? '文字' : filterType === 'image' ? '图片' : '音频'}</span>}
          {filterStatus !== 'all' && <span style={{ color: 'var(--color-base-accent)' }}>· {getStatusStyle(filterStatus as CapsuleStatus).label}</span>}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: 'rgba(139, 74, 74, 0.2)', border: '1px solid rgba(139, 74, 74, 0.4)' }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--color-base-error)' }}>
              <AlertCircle size={14} />
              <span className="text-xs font-mono">{error}</span>
            </div>
            <button onClick={loadCapsules} className="text-[10px] font-mono flex items-center gap-1 hover:underline" style={{ color: 'var(--color-base-error)' }}>
              <RefreshCw size={10} /> 重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Wall - Real Masonry Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10" style={{ backgroundColor: 'var(--color-base-bg)' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full"
              style={{ 
                border: '2px solid var(--color-base-border)',
                borderTopColor: 'var(--color-base-accent)'
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'masonry' ? (
          /* Masonry Wall - Real content cards with varying heights */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((cap, idx) => {
              const typeStyle = typeColors[cap.type] || typeColors.text;
              const isDeleted = !!cap.deletedAt;
              const statusStyle = getStatusStyle(cap.status);
              
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.3 }}
                  className="break-inside-avoid relative"
                  layout
                >
                  <div
                    onClick={() => handleCapsuleClick(cap)}
                    className={`rounded-xl overflow-hidden cursor-pointer transition-all group ${
                      isDeleted ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                    style={{ 
                      backgroundColor: 'var(--color-base-panel)',
                      border: '1px solid var(--color-base-border)'
                    }}
                  >
                    {/* Subtle paper texture */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      }}
                    />

                    {/* Top bar: status + type icon */}
                    <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
                      <div className="flex flex-col gap-1">
                        {!isDeleted && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                            style={{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }}>
                            {statusStyle.label}
                          </span>
                        )}
                        {isDeleted && (
                          <span className="inline-flex items-center text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                            style={{ color: 'var(--color-base-warning)', backgroundColor: 'rgba(154, 133, 69, 0.2)' }}>
                            已删除
                          </span>
                        )}
                        {isRecent(cap.timestamp) && !isDeleted && (
                          <span className="inline-flex items-center text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded text-[var(--color-base-bg)]"
                                style={{ backgroundColor: 'var(--color-base-accent)' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}>
                        <TypeIcon type={cap.type} size={12} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-16">
                      {/* Text content */}
                      {cap.type === 'text' && (
                        <p className="text-[13px] text-[var(--color-base-text-light)] font-sans leading-relaxed whitespace-pre-wrap">
                          {cap.content}
                        </p>
                      )}

                      {/* Image content */}
                      {cap.type === 'image' && cap.fileUrl && (
                        <div className="space-y-3">
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={`http://localhost:3000${cap.fileUrl}`}
                              alt="碎片图片"
                              className="w-full object-cover transition-all hover:brightness-105"
                              loading="lazy"
                            />
                          </div>
                          {cap.content && (
                            <p className="text-[11px] text-[var(--color-base-text-light)] leading-relaxed line-clamp-2">
                              {cap.content}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Audio content */}
                      {cap.type === 'audio' && cap.fileUrl && (
                        <div className="space-y-3">
                          {/* Audio visualization bars */}
                          <div className="flex items-center gap-1 h-12">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-full"
                                style={{
                                  height: `${20 + Math.sin(i * 0.6 + (cap.id || 0) * 0.1) * 30 + Math.random() * 20}%`,
                                  minHeight: '4px',
                                  backgroundColor: 'var(--color-base-accent)',
                                  opacity: 0.3 + (i % 4) * 0.1
                                }}
                              />
                            ))}
                          </div>
                          <audio
                            controls
                            src={`http://localhost:3000${cap.fileUrl}`}
                            className="w-full h-8 rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {cap.content && (
                            <p className="text-[11px] text-[var(--color-base-text-light)] leading-relaxed line-clamp-2">
                              {cap.content}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bottom meta */}
                      <div className="mt-4 pt-3 border-t border-[var(--color-base-border)]/50 flex justify-between items-center text-[9px] font-mono text-[var(--color-base-text)]">
                        <span className="opacity-60">{dayjs(cap.timestamp).format('MM.DD HH:mm')}</span>
                        <span className="opacity-30">#{cap.id.toString().padStart(4, '0')}</span>
                      </div>
                    </div>

                    {/* Hover border glow */}
                    <div 
                      className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[var(--color-base-accent)]/20 transition-all pointer-events-none"
                    />

                    {/* Delete button */}
                    {!isDeleted && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => handleQuickDelete(e, cap)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--color-base-text)] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                        style={{ 
                          backgroundColor: 'var(--color-base-bg)',
                          border: '1px solid var(--color-base-border)'
                        }}
                      >
                        <Trash2 size={10} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filtered.map((cap, idx) => {
              const typeStyle = typeColors[cap.type] || typeColors.text;
              const statusStyle = getStatusStyle(cap.status);
              
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.25 }}
                >
                  <div
                    onClick={() => handleCapsuleClick(cap)}
                    className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all hover:border-[var(--color-base-border-highlight)]"
                    style={{ 
                      backgroundColor: 'var(--color-base-panel)',
                      border: '1px solid var(--color-base-border)'
                    }}
                  >
                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeStyle.bg} ${typeStyle.text}`}>
                      <TypeIcon type={cap.type} size={14} />
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--color-base-text-light)] truncate">
                        {cap.type === 'text' ? cap.content?.slice(0, 80) : cap.type === 'image' ? `[图片] ${cap.content?.slice(0, 40) || ''}` : `[音频] ${cap.content?.slice(0, 40) || ''}`}
                      </p>
                      <p className="text-[10px] text-[var(--color-base-text)] opacity-50">{dayjs(cap.timestamp).format('MM-DD HH:mm')}</p>
                    </div>

                    {/* Status */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }}>
                      {statusStyle.label}
                    </span>

                    {/* Delete */}
                    {!cap.deletedAt && (
                      <button
                        onClick={(e) => handleQuickDelete(e, cap)}
                        className="p-1.5 text-[var(--color-base-text)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <CapsuleDrawer
        capsule={selectedCapsule}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={loadCapsules}
      />
    </div>
  );
};

export default WallPage;
