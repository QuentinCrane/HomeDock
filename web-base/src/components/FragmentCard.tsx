/**
 * FragmentCard.tsx - 碎片卡片组件
 * 
 * 功能说明：
 *   - 展示单个胶囊的简洁视图
 *   - 显示内容预览、类型图标、状态标签
 *   - 支持点击事件（跳转到详情）
 *   - 自动检测是否为新胶囊（10分钟内创建）
 * 
 * 视觉特性：
 *   - 状态标签（草稿/待整理/已归档/收藏/回响中）
 *   - NEW 标记（最新胶囊）
 *   - 悬停时显示删除按钮
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, FileText, Image, Mic, Layers } from 'lucide-react';
import dayjs from 'dayjs';
import type { Capsule, CapsuleStatus } from '../api';

interface FragmentCardProps {
  capsule: Capsule;
  onClick?: () => void;
  isNew?: boolean;
}

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

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'text': return <FileText size={12} />;
    case 'image': return <Image size={12} />;
    case 'audio': return <Mic size={12} />;
    default: return <Layers size={12} />;
  }
};

// Deterministic pseudo-random based on capsule ID (no Math.random)
const getAudioBarHeight = (index: number, id: number): number => {
  const seed = id * 1000 + index;
  const noise = Math.sin(seed * 0.1) * 0.5 + 0.5; // 0-1 range
  return 20 + noise * 40; // 20-60% height
};

export const FragmentCard: React.FC<FragmentCardProps> = ({
  capsule,
  onClick,
  isNew = false,
}) => {
  const isRecent = (ts: number) => dayjs().diff(dayjs(ts), 'minute') < 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="break-inside-avoid"
    >
      <div
        onClick={onClick}
        className={`relative group cursor-pointer transition-all rounded-xl overflow-hidden ${
          capsule.deletedAt
            ? 'opacity-50'
            : 'hover:shadow-xl hover:-translate-y-1 border border-[var(--color-base-border)] hover:border-[var(--color-base-border-highlight)]'
        }`}
        style={{ backgroundColor: 'var(--color-base-panel)' }}
      >
        {/* 纸张纹理背景 */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* 状态与操作栏 */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            {!capsule.deletedAt && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: getStatusStyle(capsule.status).color, backgroundColor: getStatusStyle(capsule.status).bgColor }}>
                {getStatusStyle(capsule.status).label}
              </span>
            )}
            {capsule.deletedAt && (
              <span className="inline-flex items-center text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: 'var(--color-base-warning)', backgroundColor: 'rgba(154, 133, 69, 0.2)' }}>
                已删除
              </span>
            )}
            {isNew && isRecent(capsule.timestamp) && !capsule.deletedAt && (
              <span className="inline-flex items-center text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                style={{ color: 'var(--color-base-accent)', backgroundColor: 'rgba(74, 122, 155, 0.2)' }}>
                NEW
              </span>
            )}
          </div>
          {!capsule.deletedAt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确定要删除这个碎片吗？')) {
                  fetch(`/api/capsules/${capsule.id}`, { method: 'DELETE' });
                }
              }}
              className="p-1.5 rounded-lg bg-[var(--color-base-bg)]/80 backdrop-blur-sm border border-[var(--color-base-border)] text-[var(--color-base-text)] hover:text-red-400 hover:border-red-400/50 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>

        {/* 类型图标 */}
        <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: capsule.type === 'text' ? 'rgba(96, 165, 250, 0.2)' :
              capsule.type === 'image' ? 'rgba(251, 191, 36, 0.2)' :
              'rgba(52, 211, 153, 0.2)',
            color: capsule.type === 'text' ? '#60a5fa' :
              capsule.type === 'image' ? '#fbbf24' :
              '#34d399'
          }}>
          <TypeIcon type={capsule.type} />
        </div>

        {/* 内容区域 */}
        <div className="p-4 pt-16">
          {/* 文字碎片 */}
          {capsule.type === 'text' && (
            <p className="text-[var(--color-base-text-light)] text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {capsule.content}
            </p>
          )}

          {/* 图片碎片 */}
          {capsule.type === 'image' && capsule.fileUrl && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={`http://localhost:3000${capsule.fileUrl}`}
                  alt="碎片图片"
                  className="w-full object-cover transition-all hover:brightness-105"
                  loading="lazy"
                />
              </div>
              {capsule.content && (
                <p className="text-xs text-[var(--color-base-text-light)] leading-relaxed line-clamp-2">
                  {capsule.content}
                </p>
              )}
            </div>
          )}

          {/* 音频碎片 */}
          {capsule.type === 'audio' && capsule.fileUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-1 h-12">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[var(--color-base-accent)]/40 rounded-full"
                    style={{
                      height: `${getAudioBarHeight(i, capsule.id || 0)}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
              <audio
                controls
                src={`http://localhost:3000${capsule.fileUrl}`}
                className="w-full h-8 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              {capsule.content && (
                <p className="text-xs text-[var(--color-base-text-light)] leading-relaxed line-clamp-2">
                  {capsule.content}
                </p>
              )}
            </div>
          )}

          {/* 底部元信息 */}
          <div className="mt-4 pt-3 border-t border-[var(--color-base-border)]/50 flex justify-between items-center text-[9px] font-mono text-[var(--color-base-text)]">
            <span className="opacity-60">{dayjs(capsule.timestamp).format('MM.DD HH:mm')}</span>
            <span className="opacity-30">#{capsule.id.toString().padStart(4, '0')}</span>
          </div>
        </div>

        {/* 悬停边框 */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[var(--color-base-accent)]/30 transition-all pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default FragmentCard;