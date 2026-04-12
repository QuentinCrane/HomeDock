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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Capsule, CapsuleStatus } from '../api';
import { fetchCapsules, updateCapsule, deleteCapsule, restoreCapsule } from '../api';
import dayjs from 'dayjs';
import { 
  ArrowLeft, Edit3, Trash2, RotateCcw, Archive, Heart, FileText, Check, X, 
  Search, Clock, Image, Music, Star, Layers, FolderOpen, 
  Folder, ArchiveIcon
} from 'lucide-react';

/// 时间筛选类型
type TimeFilter = 'all' | 'today' | 'week' | 'older';
/// 类型筛选类型
type TypeFilter = 'all' | 'text' | 'image' | 'audio';
/// 状态筛选类型
type StatusFilter = 'all' | 'draft' | 'archived' | 'favorited';

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const filtered = capsules.filter(cap => {
    // 显示所有非草稿状态且未彻底删除的胶囊（包括 pending、archived、favorited）
    const matchesArchiveStatus = cap.status !== 'draft' && !cap.deletedAt;
    if (!matchesArchiveStatus) return false;

    const capDate = dayjs(cap.timestamp);
    const now = dayjs();
    const matchesTime = timeFilter === 'all' ||
      (timeFilter === 'today' && capDate.isSame(now, 'day')) ||
      (timeFilter === 'week' && capDate.isSame(now, 'week')) ||
      (timeFilter === 'older' && capDate.isBefore(now.startOf('week')));
    const matchesType = typeFilter === 'all' || cap.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'draft' && cap.status === 'draft') ||
      (statusFilter === 'archived' && cap.status === 'archived') ||
      (statusFilter === 'favorited' && cap.status === 'favorited') ||
      (statusFilter === 'draft' && !!cap.deletedAt);
    const matchesSearch = searchQuery === '' ||
      (cap.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cap.id.toString().includes(searchQuery);
    return matchesTime && matchesType && matchesStatus && matchesSearch;
  });

  const grouped: Record<string, Capsule[]> = {};
  filtered.forEach(cap => {
    const dateKey = dayjs(cap.timestamp).format('YYYY.MM.DD');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(cap);
  });

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
      <div className="flex-1 flex gap-4 overflow-hidden">

        {/* ── Left: Archive Directory (220px) ── */}
        <div className="w-[220px] flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar rounded-lg"
             style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)/30' }}>
          
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-base-border)]/30">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-[var(--color-base-accent)]" />
              <span className="text-[10px] font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase font-medium">档案柜</span>
            </div>
            <div className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30 mt-1 ml-6 tracking-wider">
              索引目录
            </div>
          </div>

          {/* Time filter */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Clock size={10} className="text-[var(--color-base-text)] opacity-50" />
              <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest uppercase">时间</span>
            </div>
            <div className="space-y-0.5 ml-2">
              {([
                { key: 'all' as TimeFilter, label: '全部档案', icon: '◈' },
                { key: 'today' as TimeFilter, label: '今日', icon: '▸' },
                { key: 'week' as TimeFilter, label: '本周', icon: '▸' },
                { key: 'older' as TimeFilter, label: '更早', icon: '▸' },
              ]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTimeFilter(key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all rounded-md"
                  style={{
                    backgroundColor: timeFilter === key ? 'rgba(74, 122, 155, 0.15)' : 'transparent',
                    color: timeFilter === key ? 'var(--color-base-accent)' : 'var(--color-base-text-light)',
                    borderLeft: timeFilter === key ? '2px solid var(--color-base-accent)' : '2px solid transparent'
                  }}
                >
                  <span className="text-[10px] opacity-60">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div className="p-3 pt-0">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Layers size={10} className="text-[var(--color-base-text)] opacity-50" />
              <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest uppercase">类型</span>
            </div>
            <div className="space-y-0.5 ml-2">
              {([
                { key: 'all' as TypeFilter, label: '全部', icon: '◈' },
                { key: 'text' as TypeFilter, label: '文字', icon: '▸' },
                { key: 'image' as TypeFilter, label: '图片', icon: '▸' },
                { key: 'audio' as TypeFilter, label: '音频', icon: '▸' },
              ]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all rounded-md"
                  style={{
                    backgroundColor: typeFilter === key ? 'rgba(74, 122, 155, 0.15)' : 'transparent',
                    color: typeFilter === key ? 'var(--color-base-accent)' : 'var(--color-base-text-light)',
                    borderLeft: typeFilter === key ? '2px solid var(--color-base-accent)' : '2px solid transparent'
                  }}
                >
                  <span className="text-[10px] opacity-60">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="p-3 pt-0">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Star size={10} className="text-[var(--color-base-text)] opacity-50" />
              <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest uppercase">状态</span>
            </div>
            <div className="space-y-0.5 ml-2">
              {([
                { key: 'all' as StatusFilter, label: '全部', icon: '◈' },
                { key: 'draft' as StatusFilter, label: '草稿', icon: '▸' },
                { key: 'archived' as StatusFilter, label: '已归档', icon: '▸' },
                { key: 'favorited' as StatusFilter, label: '收藏', icon: '▸' },
              ]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono transition-all rounded-md"
                  style={{
                    backgroundColor: statusFilter === key ? 'rgba(74, 122, 155, 0.15)' : 'transparent',
                    color: statusFilter === key ? 'var(--color-base-accent)' : 'var(--color-base-text-light)',
                    borderLeft: statusFilter === key ? '2px solid var(--color-base-accent)' : '2px solid transparent'
                  }}
                >
                  <span className="text-[10px] opacity-60">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto p-4 border-t border-[var(--color-base-border)]/30">
            <div className="text-[9px] font-mono text-[var(--color-base-text)] opacity-25 tracking-widest text-center leading-relaxed">
              <div>私人档案室</div>
              <div className="text-[8px] opacity-50 mt-1">ARCHIVE VAULT</div>
            </div>
          </div>
        </div>

        {/* ── Middle: Archive List (flex-1) ── */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-lg"
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
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
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
              /* Grouped file list */
              <div className="space-y-5">
                {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, caps]) => (
                  <div key={date}>
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

                    {/* File cards */}
                    <div className="space-y-1.5 ml-1">
                      {caps.map((cap) => (
                        <ArchiveFileCard
                          key={cap.id}
                          capsule={cap}
                          isSelected={selectedCapsule?.id === cap.id}
                          onClick={() => handleSelectCapsule(cap)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Archive Detail (320px) ── */}
        <div className="w-[320px] flex-shrink-0 flex flex-col rounded-lg overflow-hidden"
             style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)/50' }}>
          <AnimatePresence mode="wait">
            {selectedCapsule ? (
              <motion.div
                key={selectedCapsule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
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
                  {/* Status actions */}
                  {!selectedCapsule.deletedAt && (
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
                  )}

                  {/* Main actions */}
                  {selectedCapsule.deletedAt ? (
                    <button
                      onClick={handleRestore}
                      className="w-full py-2.5 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                      style={{ backgroundColor: 'rgba(74, 122, 155, 0.15)', color: 'var(--color-base-accent)', border: '1px solid rgba(74, 122, 155, 0.2)' }}
                    >
                      <RotateCcw size={13} /> 恢复档案
                    </button>
                  ) : (
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
                  )}

                  {/* Delete */}
                  {!selectedCapsule.deletedAt && (
                    <button
                      onClick={handleDelete}
                      className="w-full py-2 flex items-center justify-center gap-2 font-mono text-xs tracking-widest transition-colors rounded-md"
                      style={{ color: 'var(--color-base-text)', opacity: 0.5 }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={12} /> 移出档案柜
                    </button>
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
