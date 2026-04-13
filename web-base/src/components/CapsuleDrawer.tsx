/**
 * CapsuleDrawer.tsx - 胶囊详情抽屉组件
 * 
 * 功能说明：
 *   - 从右侧滑入的胶囊详情面板
 *   - 显示胶囊的完整内容（文字/图片/音频）
 *   - 支持编辑胶囊内容和备注
 *   - 支持修改胶囊状态（待整理/收藏/归档/草稿/回响中）
 *   - 支持删除和恢复胶囊
 * 
 * 状态管理：
 *   - isEditing: 是否处于编辑模式
 *   - editContent: 编辑中的内容
 *   - editRemarks: 编辑中的备注
 *   - toast: 操作成功提示
 * 
 * 数据流：
 *   - 接收 capsule 对象作为 props
 *   - 编辑保存后调用 onUpdate 刷新父组件
 *   - 关闭时调用 onClose
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Archive, Heart, Edit3, Check, FileText, Radio } from 'lucide-react';
import type { Capsule, CapsuleStatus } from '../api';
import { updateCapsule, deleteCapsule, restoreCapsule } from '../api';
import dayjs from 'dayjs';

interface CapsuleDrawerProps {
  capsule: Capsule | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 状态配置 - 使用 CSS 变量适配日/夜间模式
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'var(--color-base-warning)', bgColor: 'rgba(154, 133, 69, 0.15)' },
  pending: { label: '待整理', color: 'var(--color-base-accent)', bgColor: 'rgba(74, 122, 155, 0.15)' },
  archived: { label: '已归档', color: 'var(--color-base-text)', bgColor: 'rgba(90, 101, 119, 0.15)' },
  favorited: { label: '收藏', color: 'var(--color-base-success)', bgColor: 'rgba(61, 139, 122, 0.15)' },
  echoing: { label: '回响中', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' },
};

const getStatusStyle = (status: CapsuleStatus | undefined) => {
  return statusConfig[status || 'pending'] || statusConfig.pending;
};

const CapsuleDrawer: React.FC<CapsuleDrawerProps> = ({ capsule, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [imageFullscreen, setImageFullscreen] = useState(false);
  const [textFullscreen, setTextFullscreen] = useState(false);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2000);
  };

  useEffect(() => {
    if (capsule) {
      setEditContent(capsule.content || '');
      setEditRemarks(capsule.remarks || '');
      setIsEditing(false);
    }
  }, [capsule]);

  if (!capsule) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCapsule(capsule.id, { content: editContent, remarks: editRemarks });
      setIsEditing(false);
      onUpdate();
      showToast('已保存');
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleStatusChange = async (newStatus: CapsuleStatus) => {
    try {
      await updateCapsule(capsule.id, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个碎片吗？')) return;
    setIsDeleting(true);
    try {
      await deleteCapsule(capsule.id);
      onUpdate();
      onClose();
      showToast('已删除');
    } catch (err) {
      console.error(err);
    }
    setIsDeleting(false);
  };

  const handleRestore = async () => {
    try {
      await restoreCapsule(capsule.id);
      onUpdate();
      showToast('已恢复');
    } catch (err) {
      console.error(err);
    }
  };

  const isDeleted = !!capsule.deletedAt;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-[var(--color-base-panel)] border-l border-[var(--color-base-border)] z-50 flex flex-col shadow-2xl"
        >
          {/* Toast */}
          <AnimatePresence>
            {toast.visible && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--color-base-success)] text-[var(--color-base-bg)] text-xs font-mono tracking-widest shadow-lg z-50"
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with close button inside */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-base-border)] relative">
            {/* Close button - now inside header */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] hover:bg-[var(--color-base-border)] transition-colors rounded-lg"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${getStatusStyle(capsule.status).color} ${getStatusStyle(capsule.status).bgColor}`}>
                {getStatusStyle(capsule.status).label}
              </span>
              <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50">
                #{capsule.id.toString().padStart(4, '0')}
              </span>
            </div>
          </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {/* Type Badge - 使用 CSS 变量适配日/夜间模式 */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: capsule.type === 'text' ? '#60a5fa' : capsule.type === 'image' ? '#fbbf24' : '#34d399'
                }}></div>
                <span className="text-[10px] font-mono text-[var(--color-base-text)] uppercase tracking-widest">
                  {capsule.type === 'text' ? '文字碎片' : capsule.type === 'image' ? '图片碎片' : '音频碎片'}
                </span>
              </div>

              {/* Content Area */}
              {capsule.type === 'text' && (
                isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[200px] bg-[var(--color-base-bg)] border border-[var(--color-base-border)] p-3 text-sm text-[var(--color-base-text-light)] font-serif resize-none focus:outline-none focus:border-[var(--color-base-border-highlight)]"
                    autoFocus
                  />
                ) : (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => setTextFullscreen(true)}
                  >
                    <p className="text-base text-[var(--color-base-text-light)] font-serif leading-relaxed whitespace-pre-wrap">
                      {capsule.content || '(空)'}
                    </p>
                    {/* Hover hint */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                      <div className="bg-black/40 text-white text-xs font-mono px-3 py-1.5 rounded-full">
                        点击放大
                      </div>
                    </div>
                  </div>
                )
              )}

              {capsule.type === 'image' && capsule.fileUrl && (
                <div className="space-y-4">
                  <div 
                    className="relative cursor-pointer group overflow-hidden rounded-lg"
                    onClick={() => setImageFullscreen(true)}
                  >
                    <img
                      src={`http://localhost:3000${capsule.fileUrl}`}
                      alt="碎片图片"
                      className="w-full object-contain border border-[var(--color-base-border)] transition-all group-hover:brightness-105"
                    />
                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-all bg-black/40 text-white text-xs font-mono px-3 py-1.5 rounded-full">
                        点击放大
                      </div>
                    </div>
                  </div>
                  {capsule.content && (
                    <p className="text-sm text-[var(--color-base-text-light)] font-serif">{capsule.content}</p>
                  )}
                </div>
              )}

              {capsule.type === 'audio' && capsule.fileUrl && (
                <div className="space-y-4">
                  <audio controls src={`http://localhost:3000${capsule.fileUrl}`} className="w-full" />
                  {capsule.content && (
                    <p className="text-sm text-[var(--color-base-text-light)] font-serif">{capsule.content}</p>
                  )}
                </div>
              )}

              {/* Remarks */}
              <div className="mt-6 pt-4 border-t border-[var(--color-base-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-[var(--color-base-text)] uppercase tracking-widest opacity-70">
                    备注
                  </span>
                </div>
                {isEditing ? (
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="添加备注..."
                    className="w-full min-h-[80px] bg-[var(--color-base-bg)] border border-[var(--color-base-border)] p-3 text-sm text-[var(--color-base-text-light)] font-mono resize-none focus:outline-none focus:border-[var(--color-base-border-highlight)]"
                  />
                ) : (
                  <p className="text-sm text-[var(--color-base-text)] font-mono leading-relaxed whitespace-pre-wrap opacity-80">
                    {capsule.remarks || '(无备注)'}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="mt-8 pt-4 border-t border-[var(--color-base-border)] space-y-2 text-[10px] font-mono text-[var(--color-base-text)] opacity-70">
                <div className="flex justify-between">
                  <span>创建时间</span>
                  <span>{dayjs(capsule.timestamp).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                {capsule.updatedAt && (
                  <div className="flex justify-between">
                    <span>更新时间</span>
                    <span>{dayjs(capsule.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                )}
                {capsule.deletedAt && (
                  <div className="flex justify-between text-amber-400">
                    <span>删除时间</span>
                    <span>{dayjs(capsule.deletedAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--color-base-border)] space-y-3">
              {/* Status Actions */}
              {!isDeleted && (
                <div className="flex flex-wrap gap-2">
                  {capsule.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange('pending')}
                      className="px-3 py-1.5 text-[10px] font-mono bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors flex items-center gap-1"
                    >
                      <FileText size={12} /> 待整理
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(capsule.status === 'favorited' ? 'draft' : 'favorited')}
                    className={`px-3 py-1.5 text-[10px] font-mono transition-colors flex items-center gap-1 ${
                      capsule.status === 'favorited'
                        ? 'bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30'
                        : 'bg-[var(--color-base-border)] text-[var(--color-base-text)] hover:bg-[var(--color-base-border-highlight)] hover:text-[var(--color-base-text-bright)]'
                    }`}
                  >
                    <Heart size={12} fill={capsule.status === 'favorited' ? 'currentColor' : 'none'} />
                    {capsule.status === 'favorited' ? '已收藏' : '收藏'}
                  </button>
                  {capsule.status !== 'archived' && (
                    <button
                      onClick={() => handleStatusChange('archived')}
                      className="px-3 py-1.5 text-[10px] font-mono bg-slate-400/10 text-slate-400 hover:bg-slate-400/20 transition-colors flex items-center gap-1"
                    >
                      <Archive size={12} /> 归档
                    </button>
                  )}
                  {capsule.status !== 'draft' && (
                    <button
                      onClick={() => handleStatusChange('draft')}
                      className="px-3 py-1.5 text-[10px] font-mono bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors flex items-center gap-1"
                    >
                      <FileText size={12} /> 草稿
                    </button>
                  )}
                  {capsule.status !== 'echoing' && (
                    <button
                      onClick={() => handleStatusChange('echoing')}
                      className="px-3 py-1.5 text-[10px] font-mono bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors flex items-center gap-1"
                    >
                      <Radio size={12} /> 回响中
                    </button>
                  )}
                </div>
              )}

              {/* Edit / Save */}
              {isDeleted ? (
                <button
                  onClick={handleRestore}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-accent)] text-[var(--color-base-bg)] font-mono text-xs tracking-widest transition-colors"
                >
                  <RotateCcw size={14} /> 恢复
                </button>
              ) : (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-border)] text-[var(--color-base-text-bright)] font-mono text-xs tracking-widest transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-success)] text-[var(--color-base-bg)] font-mono text-xs tracking-widest transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> {isSaving ? '保存中...' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-xs tracking-widest transition-colors"
                    >
                      <Edit3 size={14} /> 编辑
                    </button>
                  )}
                </div>
              )}

              {/* Delete */}
              {!isDeleted && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-2 flex items-center justify-center gap-2 text-[var(--color-base-text)] hover:text-red-400 font-mono text-xs tracking-widest transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} /> {isDeleting ? '删除中...' : '删除'}
                </button>
              )}
            </div>

            {/* Image Fullscreen Modal with Frosted Glass */}
            <AnimatePresence>
              {imageFullscreen && capsule.fileUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                  onClick={() => setImageFullscreen(false)}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setImageFullscreen(false)}
                    className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  {/* Image container with frosted glass effect around edges */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative max-w-[90vw] max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Frosted glass frame */}
                    <div className="absolute -inset-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-none" />
                    
                    {/* Image */}
                    <img
                      src={`http://localhost:3000${capsule.fileUrl}`}
                      alt="碎片图片"
                      className="relative max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                      style={{ 
                        backdropFilter: 'blur(20px)',
                      }}
                    />

                    {/* Caption if exists */}
                    {capsule.content && (
                      <div className="absolute -bottom-12 left-0 right-0 text-center">
                        <p className="text-sm font-mono text-white/80 backdrop-blur-sm bg-black/30 inline-block px-4 py-2 rounded-lg">
                          {capsule.content}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Hint text */}
                  <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-white/40">
                    点击任意处关闭
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text Fullscreen Modal */}
            <AnimatePresence>
              {textFullscreen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
                  onClick={() => setTextFullscreen(false)}
                >
                  {/* Close button */}
                  <button
                    onClick={() => setTextFullscreen(false)}
                    className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  {/* Text container with frosted glass effect */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative max-w-[80vw] max-h-[85vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Frosted glass background */}
                    <div className="absolute inset-0 rounded-2xl bg-[var(--color-base-panel)]/95 backdrop-blur-xl border border-white/10 shadow-2xl" />
                    
                    {/* Text content */}
                    <div className="relative p-8 overflow-y-auto max-h-[80vh]">
                      <p className="text-xl text-[var(--color-base-text-light)] font-serif leading-relaxed whitespace-pre-wrap">
                        {capsule.content || '(空)'}
                      </p>
                    </div>
                  </motion.div>

                  {/* Hint text */}
                  <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-white/40">
                    点击任意处关闭
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CapsuleDrawer;