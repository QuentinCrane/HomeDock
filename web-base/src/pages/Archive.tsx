/**
 * Archive.tsx - 档案馆页面
 * 
 * 功能说明：
 *   - 三栏布局：左侧索引、中间列表、右侧详情
 *   - 按日期分组显示胶囊
 *   - 支持时间、类型、状态三维筛选
 *   - 支持搜索
 *   - 可对胶囊进行编辑、删除、恢复操作
 * 
 * 状态管理：
 *   - timeFilter: 时间筛选（全部/今日/本周/更早）
 *   - typeFilter: 类型筛选（全部/文字/图片/音频）
 *   - statusFilter: 状态筛选（全部/草稿/已归档/收藏）
 *   - searchQuery: 搜索关键词
 *   - selectedCapsule: 当前选中的胶囊
 * 
 * 数据流：
 *   - filtered: 根据多个筛选条件过滤后的胶囊
 *   - grouped: 按日期分组的胶囊
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Capsule, CapsuleStatus } from '../api';
import { fetchCapsules, updateCapsule, deleteCapsule, restoreCapsule, emptyTrash, permanentDeleteCapsule } from '../api';
import dayjs from 'dayjs';
import { 
  ArrowLeft, Edit3, Trash2, RotateCcw, Archive, Heart, FileText, Check, X, 
  Search, Image, Music, FolderOpen, 
  Folder, ArchiveIcon
} from 'lucide-react';

/// 简化筛选类型 - 档案柜索引
type ArchiveFilter = 'recent' | 'week' | 'older' | 'text' | 'image' | 'audio' | 'draft' | 'archived' | 'favorited' | 'trash';

/// 状态配置 - 使用 CSS 变量适配日/夜间模式
const statusConfig: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  draft: { label: '草稿', color: 'var(--color-base-warning)', bgColor: 'rgba(154, 133, 69, 0.15)', dotColor: '#d4a03a' },
  pending: { label: '待整理', color: 'var(--color-base-accent)', bgColor: 'rgba(74, 122, 155, 0.15)', dotColor: '#4a7a9b' },
  archived: { label: '已归档', color: 'var(--color-base-text)', bgColor: 'rgba(90, 101, 119, 0.15)', dotColor: '#5a6577' },
  favorited: { label: '收藏', color: 'var(--color-base-success)', bgColor: 'rgba(61, 139, 122, 0.15)', dotColor: '#3d8b7a' },
  echoing: { label: '回响中', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)', dotColor: '#a78bfa' },
};

const getStatusStyle = (status: CapsuleStatus | undefined) => {
  return statusConfig[status || 'pending'] || statusConfig.pending;
};

/// 筛选抽屉组件 - 档案柜索引项
interface FilterItemProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const FilterItem: React.FC<FilterItemProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all rounded-md"
    style={{
      backgroundColor: active ? 'rgba(74, 122, 155, 0.15)' : 'transparent',
      color: active ? 'var(--color-base-accent)' : 'var(--color-base-text-light)',
      borderLeft: active ? '2px solid var(--color-base-accent)' : '2px solid transparent'
    }}
  >
    <span className="text-[10px] opacity-60">{active ? '◈' : '▸'}</span>
    <span>{children}</span>
  </button>
);

const typeIcons = {
  text: FileText,
  image: Image,
  audio: Music,
};

/// 类型颜色配置 - 使用 CSS 变量适配日/夜间模式
const typeColors = {
  text: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa' },
  image: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  audio: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399' },
};

const ArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ArchiveFilter>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEmptyTrashDialog, setShowEmptyTrashDialog] = useState(false);

  const loadCapsules = async () => {
    setLoading(true);
    try {
      const data = await fetchCapsules({ includeDeleted: true });
      setCapsules(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  const filtered = useMemo(() => capsules.filter(cap => {
    // Trash filter: show only deleted capsules
    if (filter === 'trash') {
      if (!cap.deletedAt) return false;
    } else {
      // Non-trash filters: hide deleted capsules
      if (cap.deletedAt) return false;
    }

    const capDate = dayjs(cap.timestamp);
    const now = dayjs();

    // 简化筛选逻辑 - 单维度筛选
    switch (filter) {
      case 'recent':
        // 最近 - 显示所有（仅受搜索影响）
        break;
      case 'week':
        // 本周
        if (!capDate.isSame(now, 'week')) return false;
        break;
      case 'older':
        // 更早 - 本周之前的
        if (!capDate.isBefore(now.startOf('week'))) return false;
        break;
      case 'text':
        if (cap.type !== 'text') return false;
        break;
      case 'image':
        if (cap.type !== 'image') return false;
        break;
      case 'audio':
        if (cap.type !== 'audio') return false;
        break;
      case 'draft':
        if (cap.status !== 'draft') return false;
        break;
      case 'archived':
        if (cap.status !== 'archived') return false;
        break;
      case 'favorited':
        if (cap.status !== 'favorited') return false;
        break;
      case 'trash':
        // Already handled above
        break;
    }

    const matchesSearch = searchQuery === '' ||
      (cap.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cap.id.toString().includes(searchQuery);
    return matchesSearch;
  }), [capsules, filter, searchQuery]);

  const grouped = useMemo(() => {
    const result: Record<string, Capsule[]> = {};
    filtered.forEach(cap => {
      const dateKey = dayjs(cap.timestamp).format('YYYY.MM.DD');
      if (!result[dateKey]) result[dateKey] = [];
      result[dateKey].push(cap);
    });
    return result;
  }, [filtered]);

  const handleSelectCapsule = (cap: Capsule) => {
    setSelectedCapsule(cap);
    setEditContent(cap.content || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedCapsule) return;
    setIsSaving(true);
    try {
      await updateCapsule(selectedCapsule.id, { content: editContent });
      setIsEditing(false);
      loadCapsules();
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus: CapsuleStatus) => {
    if (!selectedCapsule) return;
    try {
      await updateCapsule(selectedCapsule.id, { status: newStatus });
      loadCapsules();
      setSelectedCapsule({ ...selectedCapsule, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedCapsule || !confirm('确定要删除这个碎片吗？')) return;
    try {
      await deleteCapsule(selectedCapsule.id);
      loadCapsules();
      setSelectedCapsule(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async () => {
    if (!selectedCapsule) return;
    try {
      await restoreCapsule(selectedCapsule.id);
      loadCapsules();
      setSelectedCapsule(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedCapsule || !confirm('确定要永久删除这个档案吗？此操作不可恢复。')) return;
    try {
      await permanentDeleteCapsule(selectedCapsule.id);
      loadCapsules();
      setSelectedCapsule(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('确定要清空回收站吗？所有已删除的档案将被永久删除，此操作不可恢复。')) return;
    try {
      await emptyTrash();
      setShowEmptyTrashDialog(false);
      loadCapsules();
      setSelectedCapsule(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative" style={{ backgroundColor: 'var(--color-base-bg)' }}>

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-base-border)]/40">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors font-mono text-xs tracking-widest uppercase group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          [ 返回基地 ]
        </button>

        <div className="flex items-center gap-3">
          <div className="w-px h-4 bg-[var(--color-base-border)]"></div>
          <h2 className="text-lg font-bold text-[var(--color-base-text-bright)] tracking-[0.25em]">
            档案馆
          </h2>
          <div className="w-px h-4 bg-[var(--color-base-border)]"></div>
        </div>

        <div className="text-xs font-mono text-[var(--color-base-text)] opacity-40 tracking-widest">
          私人档案室
        </div>
      </div>

      {/* Main: 3-column layout */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">

        {/* ── Left: Archive Directory (220px) ── */}
        <div className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden rounded-lg"
             style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)/30' }}>
          
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-base-border)]/30">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-[var(--color-base-accent)]" />
              <span className="text-[10px] font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase font-medium">档案柜</span>
            </div>
          </div>

          {/* Filter label */}
          <div className="px-4 pt-3 pb-2">
            <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40 tracking-widest uppercase">
              索引
            </span>
          </div>

          {/* Flat filter list */}
          <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-0.5">
            <FilterItem active={filter === 'recent'} onClick={() => setFilter('recent')}>最近</FilterItem>
            <FilterItem active={filter === 'week'} onClick={() => setFilter('week')}>本周</FilterItem>
            <FilterItem active={filter === 'older'} onClick={() => setFilter('older')}>更早</FilterItem>
            
            <div className="my-2 border-t border-[var(--color-base-border)]/20"></div>
            
            <FilterItem active={filter === 'text'} onClick={() => setFilter('text')}>文字</FilterItem>
            <FilterItem active={filter === 'image'} onClick={() => setFilter('image')}>图片</FilterItem>
            <FilterItem active={filter === 'audio'} onClick={() => setFilter('audio')}>音频</FilterItem>
            
            <div className="my-2 border-t border-[var(--color-base-border)]/20"></div>
            
            <FilterItem active={filter === 'draft'} onClick={() => setFilter('draft')}>草稿</FilterItem>
            <FilterItem active={filter === 'archived'} onClick={() => setFilter('archived')}>已归档</FilterItem>
            <FilterItem active={filter === 'favorited'} onClick={() => setFilter('favorited')}>收藏</FilterItem>
            
            <div className="my-2 border-t border-[var(--color-base-border)]/20"></div>
            
            <FilterItem active={filter === 'trash'} onClick={() => setFilter('trash')}>
              <span className="flex items-center gap-2">
                <Trash2 size={10} />
                回收站
              </span>
            </FilterItem>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--color-base-border)]/30">
            <div className="text-[9px] font-mono text-[var(--color-base-text)] opacity-25 tracking-widest text-center leading-relaxed">
              <div>私人档案室</div>
              <div className="text-[8px] opacity-50 mt-1">ARCHIVE VAULT</div>
            </div>
          </div>
        </div>

        {/* ── Middle: Archive List (flex-1) ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg"
             style={{ backgroundColor: 'var(--color-base-bg)', border: '1px solid var(--color-base-border)/20' }}>
          
          {/* Search header */}
          <div className="p-3 border-b border-[var(--color-base-border)]/20" style={{ backgroundColor: 'var(--color-base-panel)/30' }}>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-base-text)] opacity-40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索档案..."
                className="w-full pl-9 pr-4 py-2 rounded-md text-xs text-[var(--color-base-text-light)] placeholder:text-[var(--color-base-text)] placeholder:opacity-40 focus:outline-none font-mono"
                style={{ 
                  backgroundColor: 'var(--color-base-panel)/50', 
                  border: '1px solid var(--color-base-border)/40'
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40">
                {filtered.length} 份档案
              </span>
              {Object.keys(grouped).length > 0 && (
                <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30">
                  {Object.keys(grouped).length} 个日期分组
                </span>
              )}
              {filter === 'trash' && filtered.length > 0 && (
                <button
                  onClick={() => setShowEmptyTrashDialog(true)}
                  className="px-2 py-1 text-[9px] font-mono flex items-center gap-1 rounded-sm transition-colors"
                  style={{ 
                    backgroundColor: 'rgba(154, 133, 69, 0.15)', 
                    color: '#9a8545',
                    border: '1px solid rgba(154, 133, 69, 0.3)'
                  }}
                >
                  <Trash2 size={9} /> 清空回收站
                </button>
              )}
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 rounded-full"
                  style={{ 
                    border: '1px solid var(--color-base-border)',
                    borderTopColor: 'var(--color-base-accent)'
                  }}
                />
              </div>
            ) : filtered.length === 0 ? (
              /* Empty state */
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center" 
                     style={{ backgroundColor: 'var(--color-base-panel)/50', border: '1px solid var(--color-base-border)/30' }}>
                  <Folder size={28} className="text-[var(--color-base-text)] opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-mono text-[var(--color-base-text)] opacity-50 tracking-widest mb-1">
                    档案柜空置
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30">
                    从左侧选择分类筛选
                  </p>
                </div>
              </div>
            ) : (
              /* Grouped file list with stagger animation */
              <div className="space-y-5">
                {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, caps]) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Date label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                           style={{ 
                             backgroundColor: 'var(--color-base-panel)', 
                             border: '1px solid var(--color-base-border)/40' 
                           }}>
                        <Folder size={11} className="text-[var(--color-base-accent)] opacity-60" />
                        <span className="text-[10px] font-mono text-[var(--color-base-text-bright)] tracking-wider font-medium">{date}</span>
                      </div>
                      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-base-border)/30, transparent)' }}></div>
                      <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40">{caps.length}份</span>
                    </div>

                    {/* File cards with stagger animation */}
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-1.5 ml-1">
                        {caps.map((cap, index) => (
                          <motion.div
                            key={cap.id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ 
                              type: 'spring',
                              stiffness: 300,
                              damping: 25,
                              delay: index * 0.04,
                              layout: { type: 'spring', stiffness: 300, damping: 30 }
                            }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            layout
                          >
                            <ArchiveFileCard
                              capsule={cap}
                              isSelected={selectedCapsule?.id === cap.id}
                              onClick={() => handleSelectCapsule(cap)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Archive Detail (320px) ── */}
        <div className="w-[320px] flex-shrink-0 flex flex-col min-h-0 rounded-lg overflow-hidden"
             style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)/50' }}>
          <AnimatePresence mode="wait">
            {selectedCapsule ? (
              <motion.div
                key={selectedCapsule.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="flex flex-col h-full"
              >
                {/* Archive header */}
                <div className="p-4 border-b border-[var(--color-base-border)]/40" style={{ backgroundColor: 'var(--color-base-bg)/20' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider rounded-sm"
                      style={{ color: getStatusStyle(selectedCapsule.status).color, backgroundColor: getStatusStyle(selectedCapsule.status).bgColor }}>
                      {getStatusStyle(selectedCapsule.status).label}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-40">
                      #{selectedCapsule.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                  
                  {/* Type indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{
                      backgroundColor: selectedCapsule.type === 'text' ? '#60a5fa' : selectedCapsule.type === 'image' ? '#fbbf24' : '#34d399',
                      opacity: 0.6
                    }}></div>
                    {React.createElement(typeIcons[selectedCapsule.type], { size: 11, className: 'text-[var(--color-base-text)] opacity-50' })}
                    <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 uppercase tracking-widest">
                      {selectedCapsule.type === 'text' ? '文字档案' : selectedCapsule.type === 'image' ? '图片档案' : '音频档案'}
                    </span>
                  </div>
                </div>

                {/* Archive content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {/* Deleted notice */}
                  {selectedCapsule.deletedAt && (
                    <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: 'rgba(154, 133, 69, 0.1)', border: '1px solid rgba(154, 133, 69, 0.3)' }}>
                      <div className="flex items-center gap-2 text-[9px] font-mono mb-1.5" style={{ color: '#9a8545' }}>
                        <Trash2 size={10} />
                        <span>已从档案柜移除</span>
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: '#9a8545', opacity: 0.6 }}>
                        {dayjs(selectedCapsule.deletedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="mb-4">
                    <div className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FileText size={9} />
                      <span>原文内容</span>
                    </div>
                    {selectedCapsule.type === 'text' && (
                      isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full min-h-[120px] rounded-md p-3 text-sm text-[var(--color-base-text-light)] font-serif resize-none focus:outline-none"
                          style={{ 
                            backgroundColor: 'var(--color-base-bg)/80', 
                            border: '1px solid var(--color-base-border)/50' 
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="p-4 rounded-md" style={{ backgroundColor: 'var(--color-base-bg)/60', border: '1px solid var(--color-base-border)/30' }}>
                          <p className="text-sm text-[var(--color-base-text-light)] font-serif leading-relaxed whitespace-pre-wrap">
                            {selectedCapsule.content || '(空)'}
                          </p>
                        </div>
                      )
                    )}

                    {selectedCapsule.type === 'image' && selectedCapsule.fileUrl && (
                      <div className="space-y-3">
                        <img
                          src={`http://localhost:3000${selectedCapsule.fileUrl}`}
                          alt="档案图片"
                          className="w-full object-contain rounded-md"
                          style={{ backgroundColor: 'var(--color-base-bg)/60', border: '1px solid var(--color-base-border)/50' }}
                        />
                        {selectedCapsule.content && (
                          <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-base-bg)/60', border: '1px solid var(--color-base-border)/30' }}>
                            <p className="text-xs text-[var(--color-base-text-light)] font-serif">{selectedCapsule.content}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCapsule.type === 'audio' && selectedCapsule.fileUrl && (
                      <div className="space-y-3">
                        <audio controls src={`http://localhost:3000${selectedCapsule.fileUrl}`} className="w-full h-10 rounded-md" />
                        {selectedCapsule.content && (
                          <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-base-bg)/60', border: '1px solid var(--color-base-border)/30' }}>
                            <p className="text-xs text-[var(--color-base-text-light)] font-serif">{selectedCapsule.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="pt-3 border-t border-[var(--color-base-border)]/30 space-y-2">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-[var(--color-base-text)] opacity-40">存入时间</span>
                      <span className="text-[var(--color-base-text)] opacity-70">{dayjs(selectedCapsule.timestamp).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                    {selectedCapsule.updatedAt && (
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-[var(--color-base-text)] opacity-40">最后修改</span>
                        <span className="text-[var(--color-base-text)] opacity-70">{dayjs(selectedCapsule.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action area */}
                <div className="p-3 border-t border-[var(--color-base-border)]/50 space-y-2" style={{ backgroundColor: 'var(--color-base-bg)/20' }}>
                  {/* Trash view: Restore and Delete Forever buttons */}
                  {selectedCapsule.deletedAt ? (
                    <>
                      <button
                        onClick={handleRestore}
                        className="w-full py-2.5 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                        style={{ backgroundColor: 'rgba(74, 122, 155, 0.15)', color: 'var(--color-base-accent)', border: '1px solid rgba(74, 122, 155, 0.2)' }}
                      >
                        <RotateCcw size={13} /> 恢复档案
                      </button>
                      <button
                        onClick={handlePermanentDelete}
                        className="w-full py-2 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                        style={{ color: 'var(--color-base-text)', opacity: 0.6 }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                      >
                        <Trash2 size={12} /> 永久删除
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Status actions */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <button
                          onClick={() => handleStatusChange('pending')}
                          disabled={selectedCapsule.status === 'pending'}
                          className="px-2 py-1 text-[9px] font-mono flex items-center gap-1 rounded-sm transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                            color: '#60a5fa',
                            opacity: selectedCapsule.status === 'pending' ? 0.3 : 1
                          }}
                        >
                          <FileText size={9} /> 待整理
                        </button>
                        <button
                          onClick={() => handleStatusChange('favorited')}
                          disabled={selectedCapsule.status === 'favorited'}
                          className="px-2 py-1 text-[9px] font-mono flex items-center gap-1 rounded-sm transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(52, 211, 153, 0.1)', 
                            color: '#34d399',
                            opacity: selectedCapsule.status === 'favorited' ? 0.3 : 1
                          }}
                        >
                          <Heart size={9} /> 收藏
                        </button>
                        <button
                          onClick={() => handleStatusChange('archived')}
                          disabled={selectedCapsule.status === 'archived'}
                          className="px-2 py-1 text-[9px] font-mono flex items-center gap-1 rounded-sm transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(148, 163, 184, 0.1)', 
                            color: '#94a3b8',
                            opacity: selectedCapsule.status === 'archived' ? 0.3 : 1
                          }}
                        >
                          <ArchiveIcon size={9} /> 归档
                        </button>
                      </div>

                      {/* Main actions */}
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => { setIsEditing(false); setEditContent(selectedCapsule.content || ''); }}
                              className="flex-1 py-2 flex items-center justify-center gap-1 font-mono text-xs transition-colors rounded-md"
                              style={{ backgroundColor: 'var(--color-base-border)', color: 'var(--color-base-text-bright)' }}
                            >
                              <X size={11} /> 取消
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className="flex-1 py-2 flex items-center justify-center gap-1 font-mono text-xs transition-colors rounded-md disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(61, 139, 122, 0.8)', color: 'var(--color-base-bg)' }}
                            >
                              <Check size={11} /> {isSaving ? '保存中' : '保存'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 py-2 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                            style={{ backgroundColor: 'var(--color-base-border)/80', color: 'var(--color-base-text-bright)' }}
                          >
                            <Edit3 size={12} /> 编辑
                          </button>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={handleDelete}
                        className="w-full py-2 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                        style={{ color: 'var(--color-base-text)', opacity: 0.5 }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                      >
                        <Trash2 size={12} /> 移出档案柜
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Empty detail panel */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-6"
              >
                {/* Stacked folder illustration */}
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-xl transform rotate-3" style={{ backgroundColor: 'var(--color-base-border)', opacity: 0.2 }}></div>
                  <div className="absolute inset-0 rounded-xl transform -rotate-2" style={{ backgroundColor: 'var(--color-base-panel)', opacity: 0.6 }}></div>
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-base-bg)/80', border: '1px solid var(--color-base-border)/30' }}>
                    <Archive size={28} className="text-[var(--color-base-text)] opacity-20" />
                  </div>
                </div>
                <p className="text-xs font-mono text-[var(--color-base-text)] opacity-50 tracking-widest text-center mb-2">
                  从左侧选择分类
                </p>
                <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30 tracking-wider text-center">
                  点击档案查看详情
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Empty Trash Confirmation Dialog */}
      <AnimatePresence>
        {showEmptyTrashDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setShowEmptyTrashDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-[320px] rounded-xl p-5"
              style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)/50' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(154, 133, 69, 0.15)' }}>
                  <Trash2 size={18} className="text-[#9a8545]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-wider">清空回收站</h3>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50">此操作不可撤销</p>
                </div>
              </div>
              
              <p className="text-xs font-mono text-[var(--color-base-text)] opacity-70 leading-relaxed mb-5">
                确定要永久删除回收站中的所有档案吗？<br/>
                <span style={{ color: '#9a8545' }}>此操作无法恢复。</span>
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmptyTrashDialog(false)}
                  className="flex-1 py-2 flex items-center justify-center gap-1 font-mono text-xs transition-colors rounded-md"
                  style={{ backgroundColor: 'var(--color-base-border)', color: 'var(--color-base-text-bright)' }}
                >
                  <X size={11} /> 取消
                </button>
                <button
                  onClick={handleEmptyTrash}
                  className="flex-1 py-2 flex items-center justify-center gap-1 font-mono text-xs transition-colors rounded-md"
                  style={{ backgroundColor: 'rgba(154, 133, 69, 0.2)', color: '#9a8545', border: '1px solid rgba(154, 133, 69, 0.3)' }}
                >
                  <Trash2 size={11} /> 确认清空
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ArchiveFileCardProps {
  capsule: Capsule;
  isSelected: boolean;
  onClick: () => void;
}

const ArchiveFileCard: React.FC<ArchiveFileCardProps> = ({ capsule, isSelected, onClick }) => {
  const isDeleted = !!capsule.deletedAt;
  const TypeIcon = typeIcons[capsule.type];
  const typeStyle = typeColors[capsule.type] || typeColors.text;
  const statusStyle = getStatusStyle(capsule.status);

  return (
    <div
      onClick={onClick}
      className="p-3 cursor-pointer transition-all rounded-lg"
      style={{
        backgroundColor: isSelected ? 'rgba(74, 122, 155, 0.1)' : 'var(--color-base-panel)/70',
        border: isSelected ? '1px solid rgba(74, 122, 155, 0.4)' : '1px solid var(--color-base-border)/30',
        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeStyle.bg}`}>
          <TypeIcon size={15} className={typeStyle.text} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {capsule.type === 'text' && (
            <p className="text-xs text-[var(--color-base-text-light)] leading-relaxed line-clamp-2 mb-1.5">
              {capsule.content || '(空)'}
            </p>
          )}
          {capsule.type === 'image' && capsule.fileUrl && (
            <div className="flex items-center gap-2 mb-1.5">
              <img
                src={`http://localhost:3000${capsule.fileUrl}`}
                alt="档案"
                className="w-10 h-10 object-cover rounded-md"
                style={{ border: '1px solid var(--color-base-border)/30' }}
              />
              {capsule.content && (
                <p className="text-[10px] text-[var(--color-base-text-light)] line-clamp-2 flex-1">{capsule.content}</p>
              )}
            </div>
          )}
          {capsule.type === 'audio' && (
            <div className="flex items-center gap-2 mb-1.5">
              <audio controls src={`http://localhost:3000${capsule.fileUrl}`} className="h-5 w-28 opacity-70 rounded" />
              {capsule.content && (
                <span className="text-[10px] text-[var(--color-base-text-light)] truncate">{capsule.content}</span>
              )}
            </div>
          )}
          
          {/* Meta row */}
          <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor}`}></span>
            <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">
              {dayjs(capsule.timestamp).format('HH:mm')}
            </span>
            {isDeleted && (
              <span className="text-[9px] font-mono flex items-center gap-1" style={{ color: '#9a8545' }}>
                <Trash2 size={8} /> 已删除
              </span>
            )}
            <span className="ml-auto text-[8px] font-mono text-[var(--color-base-text)] opacity-30">
              #{capsule.id.toString().padStart(4, '0')}
            </span>
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--color-base-accent)' }}></div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
