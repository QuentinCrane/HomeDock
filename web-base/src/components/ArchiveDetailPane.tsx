import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Capsule, CapsuleStatus } from '../api';
import dayjs from 'dayjs';
import {
  Edit3, Trash2, RotateCcw, Archive, Heart, FileText, Check, X,
} from 'lucide-react';

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

interface ArchiveDetailPaneProps {
  selectedCapsule: Capsule | null;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onStatusChange: (status: CapsuleStatus) => Promise<void>;
  onDelete: () => Promise<void>;
  onRestore: () => Promise<void>;
}

export const ArchiveDetailPane: React.FC<ArchiveDetailPaneProps> = ({
  selectedCapsule,
  isEditing,
  setIsEditing,
  editContent,
  setEditContent,
  isSaving,
  onSave,
  onStatusChange,
  onDelete,
  onRestore,
}) => {
  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
      <AnimatePresence mode="wait">
        {selectedCapsule ? (
          <motion.div
            key={selectedCapsule.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* 详情头部 */}
            <div className="p-4 border-b border-[var(--color-base-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${getStatusStyle(selectedCapsule.status).color} ${getStatusStyle(selectedCapsule.status).bgColor}`}>
                  {getStatusStyle(selectedCapsule.status).label}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50">
                  #{selectedCapsule.id.toString().padStart(4, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedCapsule.type === 'text' ? 'bg-blue-400' : selectedCapsule.type === 'image' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></div>
                <span className="text-[10px] font-mono text-[var(--color-base-text)] uppercase tracking-widest">
                  {selectedCapsule.type === 'text' ? '文字碎片' : selectedCapsule.type === 'image' ? '图片碎片' : '音频碎片'}
                </span>
              </div>
            </div>

            {/* 详情内容 */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {selectedCapsule.deletedAt && (
                <div className="mb-4 p-2 bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-400">
                  已删除 · {dayjs(selectedCapsule.deletedAt).format('YYYY-MM-DD HH:mm')}
                </div>
              )}

              {selectedCapsule.type === 'text' && (
                isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[150px] bg-[var(--color-base-bg)] border border-[var(--color-base-border)] p-3 text-sm text-[var(--color-base-text-light)] font-serif resize-none focus:outline-none focus:border-[var(--color-base-border-highlight)]"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-[var(--color-base-text-light)] font-serif leading-relaxed whitespace-pre-wrap">
                    {selectedCapsule.content || '(空)'}
                  </p>
                )
              )}

              {selectedCapsule.type === 'image' && selectedCapsule.fileUrl && (
                <div className="space-y-3">
                  <img
                    src={`http://localhost:3000${selectedCapsule.fileUrl}`}
                    alt="档案图片"
                    className="w-full object-contain border border-[var(--color-base-border)]"
                  />
                  {selectedCapsule.content && (
                    <p className="text-sm text-[var(--color-base-text-light)] font-serif">{selectedCapsule.content}</p>
                  )}
                </div>
              )}

              {selectedCapsule.type === 'audio' && selectedCapsule.fileUrl && (
                <div className="space-y-3">
                  <audio controls src={`http://localhost:3000${selectedCapsule.fileUrl}`} className="w-full" />
                  {selectedCapsule.content && (
                    <p className="text-sm text-[var(--color-base-text-light)] font-serif">{selectedCapsule.content}</p>
                  )}
                </div>
              )}

              {/* 元信息 */}
              <div className="mt-6 pt-4 border-t border-[var(--color-base-border)] space-y-2 text-[10px] font-mono text-[var(--color-base-text)] opacity-70">
                <div className="flex justify-between">
                  <span>创建时间</span>
                  <span>{dayjs(selectedCapsule.timestamp).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                {selectedCapsule.updatedAt && (
                  <div className="flex justify-between">
                    <span>更新时间</span>
                    <span>{dayjs(selectedCapsule.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 详情操作 */}
            <div className="p-4 border-t border-[var(--color-base-border)] space-y-2">
              {/* 状态切换 */}
              {!selectedCapsule.deletedAt && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={() => onStatusChange('pending')}
                    disabled={selectedCapsule.status === 'pending'}
                    className="px-2 py-1 text-[9px] font-mono bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <FileText size={10} /> 待整理
                  </button>
                  <button
                    onClick={() => onStatusChange('favorited')}
                    disabled={selectedCapsule.status === 'favorited'}
                    className="px-2 py-1 text-[9px] font-mono bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <Heart size={10} /> 收藏
                  </button>
                  <button
                    onClick={() => onStatusChange('archived')}
                    disabled={selectedCapsule.status === 'archived'}
                    className="px-2 py-1 text-[9px] font-mono bg-slate-400/10 text-slate-400 hover:bg-slate-400/20 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <Archive size={10} /> 归档
                  </button>
                  <button
                    onClick={() => onStatusChange('draft')}
                    disabled={selectedCapsule.status === 'draft'}
                    className="px-2 py-1 text-[9px] font-mono bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <FileText size={10} /> 草稿
                  </button>
                </div>
              )}

              {/* 编辑/保存 */}
              {selectedCapsule.deletedAt ? (
                <button
                  onClick={onRestore}
                  className="w-full py-2 flex items-center justify-center gap-2 bg-[var(--color-base-accent)]/20 text-[var(--color-base-accent)] font-mono text-xs tracking-widest transition-colors"
                >
                  <RotateCcw size={14} /> 恢复
                </button>
              ) : (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 flex items-center justify-center gap-1 bg-[var(--color-base-border)] text-[var(--color-base-text-bright)] font-mono text-xs transition-colors"
                      >
                        <X size={12} /> 取消
                      </button>
                      <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-1 py-2 flex items-center justify-center gap-1 bg-[var(--color-base-success)] text-[var(--color-base-bg)] font-mono text-xs transition-colors disabled:opacity-50"
                      >
                        <Check size={12} /> {isSaving ? '保存中' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-xs tracking-widest transition-colors"
                    >
                      <Edit3 size={14} /> 编辑
                    </button>
                  )}
                </div>
              )}

              {/* 删除 */}
              {!selectedCapsule.deletedAt && (
                <button
                  onClick={onDelete}
                  className="w-full py-2 flex items-center justify-center gap-2 text-[var(--color-base-text)] hover:text-red-400 font-mono text-xs tracking-widest transition-colors"
                >
                  <Trash2 size={14} /> 删除
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-sm font-mono text-[var(--color-base-text)] opacity-50 tracking-widest">
              选择一个档案查看详情
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArchiveDetailPane;