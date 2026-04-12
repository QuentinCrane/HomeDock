import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Archive, Heart, Edit3, Check, FileText, Radio } from 'lucide-react';
import type { Capsule, CapsuleStatus } from '../api';
import { updateCapsule, deleteCapsule, restoreCapsule } from '../api';
import dayjs from 'dayjs';

interface FragmentEditorDrawerProps {
  capsule: Capsule | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  pending: { label: '待整理', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  archived: { label: '已归档', color: 'text-slate-400', bgColor: 'bg-slate-400/10' },
  favorited: { label: '收藏', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  echoing: { label: '回响中', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
};

const getStatusStyle = (status: CapsuleStatus | undefined) => {
  return statusConfig[status || 'pending'] || statusConfig.pending;
};

const FragmentEditorDrawer: React.FC<FragmentEditorDrawerProps> = ({ capsule, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--color-base-panel)] border-l border-[var(--color-base-border)] z-50 flex flex-col"
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
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${getStatusStyle(capsule.status).color} ${getStatusStyle(capsule.status).bgColor}`}>
                  {getStatusStyle(capsule.status).label}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50">
                  #{capsule.id.toString().padStart(4, '0')}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${
                  capsule.type === 'text' ? 'bg-blue-400' : capsule.type === 'image' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></div>
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
                  <p className="text-base text-[var(--color-base-text-light)] font-serif leading-relaxed whitespace-pre-wrap">
                    {capsule.content || '(空)'}
                  </p>
                )
              )}

              {capsule.type === 'image' && capsule.fileUrl && (
                <div className="space-y-4">
                  <img
                    src={`http://localhost:3000${capsule.fileUrl}`}
                    alt="碎片图片"
                    className="w-full object-contain border border-[var(--color-base-border)]"
                  />
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FragmentEditorDrawer;