/**
 * Home.tsx - 首页（归航大厅）
 * 
 * 功能说明：
 *   - 投放舱：创建文字/图片/音频胶囊
 *   - 脉冲/地图视图：展示基地状态
 *   - 最近碎片：显示最新创建的胶囊
 *   - 待整理区域：显示草稿和待处理胶囊
 *   - 回响预览：随机展示一个胶囊
 *   - 档案摘要：统计数据
 * 
 * 状态管理：
 *   - capsules: 所有胶囊列表
 *   - statusCounts: 各状态胶囊数量统计
 *   - captureMode: 当前输入模式（text/image/audio）
 *   - mainViewMode: 主视图模式（pulse/map）
 * 
 * 实时同步：
 *   - 监听 Android 端通过 SSE/轮询推送的新胶囊
 *   - 数据流：Android → SSE → 前端 → 更新本地状态
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Capsule, CapsuleStatus } from '../api';
import { fetchStatus, fetchCapsules, createCapsule } from '../api';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Mic,
  MicOff,
  Send,
  Save,
  Trash2,
  X,
  FileText,
  Clock,
  Sparkles,
  Inbox,
  ChevronRight,
  Radio,
  AlertCircle,
  Shuffle,
  Archive,
  Heart,
  Map,
} from 'lucide-react';
import { useCapsuleSync } from '../hooks/useSSE';
import { playSuccessSound, vibrateFeedback, getSoundPreference, getVibrationPreference } from '../sound';
import BaseMapView from '../components/BaseMapView';

/// 输入模式类型
type CaptureMode = 'text' | 'image' | 'audio';

/// 获取类型图标
const getTypeIcon = (type: string, size = 12) => {
  switch (type) {
    case 'text': return <FileText size={size} />;
    case 'image': return <Image size={size} />;
    case 'audio': return <Mic size={size} />;
    default: return <FileText size={size} />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'text': return 'text-blue-400/70';
    case 'image': return 'text-amber-500/70';
    case 'audio': return 'text-emerald-500/70';
    default: return 'text-[var(--color-base-text)]';
  }
};

// === Time Since Helper ===
const getTimeSince = (timestamp: number | string | Date): string => {
  const now = dayjs();
  const time = dayjs(timestamp);
  const diffSeconds = now.diff(time, 'second');
  
  if (diffSeconds < 5) return '刚刚';
  if (diffSeconds < 60) return `${diffSeconds}秒前`;
  
  const diffMinutes = now.diff(time, 'minute');
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  
  const diffHours = now.diff(time, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;
  
  const diffDays = now.diff(time, 'day');
  if (diffDays < 7) return `${diffDays}天前`;
  
  return time.format('MM/DD');
};

// === CSS Pulse Component ===
const PulseDot: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="relative w-6 h-6 flex items-center justify-center">
    <style>{`
      @keyframes pulse-breathe {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.3); opacity: 1; }
      }
    `}</style>
    <div
      className="w-3 h-3 rounded-full"
      style={{
        backgroundColor: 'var(--color-base-accent)',
        animation: active ? 'pulse-breathe 2s ease-in-out infinite' : 'none',
        opacity: active ? 1 : 0.4,
        boxShadow: active ? '0 0 8px rgba(74, 122, 155, 0.5)' : 'none',
      }}
    />
  </div>
);

// === CSS Timeline Component ===
const ReturnTraceTimeline: React.FC<{
  capsules: Capsule[];
  onCapsuleClick: (capsule: Capsule) => void;
}> = ({ capsules, onCapsuleClick }) => {
  const getDotColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-400/70';
      case 'image': return 'bg-amber-500/70';
      case 'audio': return 'bg-emerald-500/70';
      default: return 'bg-slate-400/70';
    }
  };

  return (
    <div className="w-full h-full px-4 flex items-center gap-3" style={{ height: '48px', minHeight: '48px' }}>
      <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40 flex-shrink-0">
        回港轨迹
      </span>
      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        {capsules.length === 0 ? (
          <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30">
            暂无轨迹
          </span>
        ) : (
          capsules.map((cap, idx) => (
            <div
              key={cap.id}
              className="relative group flex-shrink-0"
              onClick={() => onCapsuleClick(cap)}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-[var(--color-base-bg)] border border-[var(--color-base-border)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <span className="text-[8px] font-mono text-[var(--color-base-text)]">
                  {dayjs(cap.timestamp).format('MM-DD HH:mm')}
                </span>
              </div>
              {/* Dot */}
              <div
                className={`w-2 h-2 rounded-full ${getDotColor(cap.type)} group-hover:scale-125 transition-transform cursor-pointer`}
                style={{
                  boxShadow: idx === 0 ? '0 0 4px currentColor' : 'none',
                }}
              />
            </div>
          ))
        )}
      </div>
      {capsules.length > 0 && (
        <div className="w-px h-3 flex-shrink-0" style={{ backgroundColor: 'var(--color-base-border)', opacity: 0.5 }} />
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<CapsuleStatus, number>>({
    draft: 0,
    pending: 0,
    archived: 0,
    favorited: 0,
    echoing: 0,
  });
  const [lastReturn, setLastReturn] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pulse state
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);
  const [mainViewMode, setMainViewMode] = useState<'pulse' | 'map'>('pulse');

  // Map modal state
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Capture dock state
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stat, caps] = await Promise.all([fetchStatus(), fetchCapsules()]);
      setLastReturn(stat.lastReturnTime);
      setCapsules(caps.filter((c) => !c.deletedAt));

      const counts: Record<CapsuleStatus, number> = { draft: 0, pending: 0, archived: 0, favorited: 0, echoing: 0 };
      caps.forEach((c) => {
        if (!c.deletedAt && counts[c.status] !== undefined) {
          counts[c.status]++;
        }
      });
      setStatusCounts(counts);
    } catch (err) {
      setError('加载失败，请重试');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for real-time capsule updates from Android sync
  useCapsuleSync((event) => {
    if (event.type === 'fallback:poll') {
      loadData();
      return;
    }

    const capsule = event.data as Capsule | undefined;
    if (!capsule) return;

    if (event.type === 'capsule:created') {
      setCapsules(prev => {
        // 忽略自己提交的胶囊（通过 pendingSubmitIdRef 或 pendingDraftIdRef 追踪）
        // 防止因 SSE 广播导致的重复添加
        if (pendingSubmitIdRef.current !== null || pendingDraftIdRef.current !== null) {
          return prev;
        }
        if (prev.some(c => c.id === capsule.id)) return prev;
        return [capsule, ...prev];
      });
      setStatusCounts(prev => ({
        ...prev,
        [capsule.status]: (prev[capsule.status] || 0) + 1,
      }));
      setLastActivityTime(Date.now());
    } else if (event.type === 'capsule:updated') {
      setCapsules(prev =>
        prev.map(c => c.id === capsule.id ? { ...c, ...capsule } : c)
      );
      setLastActivityTime(Date.now());
    } else if (event.type === 'capsule:deleted') {
      const deleteId = typeof event.data === 'number' ? event.data : capsule.id;
      setCapsules(prev => prev.filter(c => c.id !== deleteId));
      setStatusCounts(prev => {
        const target = prev[capsule.status] ?? 1;
        return { ...prev, [capsule.status]: Math.max(0, target - 1) };
      });
    }
  });

  const pendingItems = capsules.filter((c) => c.status === 'draft');
  const recentItems = capsules.filter((c) => c.status !== 'draft').slice(0, 12);
  const archivedCount = statusCounts.archived;
  const favoritedCount = statusCounts.favorited;

  // 独立的回响胶囊状态 - 只在用户点击刷新时更新
  const [echoCapsule, setEchoCapsule] = useState<Capsule | null>(null);

  // 初始化回响胶囊
  useEffect(() => {
    const nonDraftCapsules = capsules.filter((c) => c.status !== 'draft' && !c.deletedAt);
    if (nonDraftCapsules.length > 0 && !echoCapsule) {
      setEchoCapsule(nonDraftCapsules[Math.floor(Math.random() * nonDraftCapsules.length)]);
    }
  }, [capsules, echoCapsule]);

  // 手动刷新回响胶囊 - 不会触发整个页面刷新
  const refreshEchoCapsule = () => {
    const nonDraftCapsules = capsules.filter((c) => c.status !== 'draft' && !c.deletedAt);
    if (nonDraftCapsules.length > 0) {
      setEchoCapsule(nonDraftCapsules[Math.floor(Math.random() * nonDraftCapsules.length)]);
    }
  };

  // Return timeline items (last 8)
  const returnTimeline = capsules
    .filter((c) => c.status !== 'draft' && !c.deletedAt)
    .slice(0, 8);

  // Recording functions
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = []; // 重置音频 chunks
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        // 所有数据收集完毕后创建 Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // 清理轨道
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
      
      recorder.start(1000); // 每秒触发一次 ondataavailable
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 追踪存草稿的临时 ID
  const pendingDraftIdRef = useRef<number | null>(null);

  const handleSaveDraft = async () => {
    if (captureMode === 'text' && !textContent.trim()) return;
    if (captureMode === 'image' && !imageFile) return;
    if (captureMode === 'audio' && !audioBlob) return;

    // 防止重复提交
    if (pendingDraftIdRef.current !== null) return;

    const tempId = -Date.now();
    pendingDraftIdRef.current = tempId;
    
    const optimisticCapsule: Capsule = {
      id: tempId,
      type: captureMode,
      content: captureMode === 'text' ? textContent : '',
      fileUrl: null,
      timestamp: Date.now(),
      createdAt: Date.now(),
      status: 'draft',
    };

    setCapsules(prev => [optimisticCapsule, ...prev]);
    setStatusCounts(prev => ({ ...prev, draft: prev.draft + 1 }));

    setIsSaving(true);
    try {
      await createCapsule({
        type: captureMode,
        content: captureMode === 'text' ? textContent : '',
        file:
          captureMode === 'image'
            ? imageFile ?? undefined
            : captureMode === 'audio'
              ? new File([audioBlob!], 'audio.webm', { type: 'audio/webm' })
              : undefined,
        timestamp: Date.now(),
        status: 'draft',
      });

      // 成功后将待提交引用设为 null，让 SSE 可以正常添加真实胶囊
      pendingDraftIdRef.current = null;
      
      // 重新加载数据，确保从服务器获取最新的完整数据（包括 fileUrl）
      loadData();

      resetCapture();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setCapsules(prev => prev.filter(c => c.id !== tempId));
      setStatusCounts(prev => ({ ...prev, draft: Math.max(0, prev.draft - 1) }));
      pendingDraftIdRef.current = null;
      console.error(err);
    }
    setIsSaving(false);
  };

  // 追踪待替换的临时 ID，确保 SSE 创建的真实胶囊不会与临时胶囊冲突
  const pendingSubmitIdRef = useRef<number | null>(null);

  const handleSubmit = async () => {
    if (captureMode === 'text' && !textContent.trim()) return;
    if (captureMode === 'image' && !imageFile) return;
    if (captureMode === 'audio' && !audioBlob) return;

    // 防止重复提交
    if (pendingSubmitIdRef.current !== null) return;

    const tempId = -Date.now();
    pendingSubmitIdRef.current = tempId;
    
    const optimisticCapsule: Capsule = {
      id: tempId,
      type: captureMode,
      content: captureMode === 'text' ? textContent : '',
      fileUrl: null,
      timestamp: Date.now(),
      createdAt: Date.now(),
      status: 'pending',
    };

    setCapsules(prev => [optimisticCapsule, ...prev]);
    setStatusCounts(prev => ({ ...prev, pending: prev.pending + 1 }));

    setIsSaving(true);
    try {
      await createCapsule({
        type: captureMode,
        content: captureMode === 'text' ? textContent : '',
        file:
          captureMode === 'image'
            ? imageFile ?? undefined
            : captureMode === 'audio'
              ? new File([audioBlob!], 'audio.webm', { type: 'audio/webm' })
              : undefined,
        timestamp: Date.now(),
        status: 'pending',
      });

      // 成功后将待提交引用设为 null，让 SSE 可以正常添加真实胶囊
      pendingSubmitIdRef.current = null;
      
      // 重新加载数据，确保从服务器获取最新的完整数据（包括 fileUrl）
      loadData();

      if (getSoundPreference('submit')) {
        playSuccessSound();
      }
      if (getVibrationPreference()) {
        vibrateFeedback();
      }

      resetCapture();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      // 失败时移除临时胶囊
      setCapsules(prev => prev.filter(c => c.id !== tempId));
      setStatusCounts(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
      pendingSubmitIdRef.current = null;
      console.error(err);
    }
    setIsSaving(false);
  };

  const resetCapture = () => {
    setTextContent('');
    setImageFile(null);
    setImagePreview(null);
    setAudioBlob(null);
  };

  const isSubmitDisabled =
    captureMode === 'text'
      ? !textContent.trim()
      : captureMode === 'image'
        ? !imageFile
        : captureMode === 'audio'
          ? !audioBlob
          : true;

  const isDraftDisabled =
    captureMode === 'text'
      ? !textContent.trim()
      : captureMode === 'image'
        ? !imageFile
        : captureMode === 'audio'
          ? !audioBlob
          : true;

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden" style={{ minHeight: '0' }}>
      {/* Error/Success Toasts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-base-error)] text-white px-5 py-2 text-xs font-mono shadow-lg rounded-md flex items-center gap-2"
          >
            <AlertCircle size={12} />
            {error}
            <button
              onClick={() => { setError(null); loadData(); }}
              className="ml-2 underline hover:no-underline"
            >
              重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-base-success)] text-[var(--color-base-bg)] px-5 py-2 text-xs font-mono shadow-lg shadow-[var(--color-base-success)]/20 rounded-md"
          >
            <Sparkles size={12} className="inline mr-2 animate-spin" style={{ animationDuration: '3s' }} />
            投放成功
          </motion.div>
        )}
      </AnimatePresence>

      {/* === Main 3-Section Layout === */}
      <div className="flex-1 flex min-h-0 overflow-hidden" style={{ height: '100%' }}>

        {/* ── Left: Capture Dock (360px) ── */}
        <div className="flex flex-col border-r border-[var(--color-base-border)] w-[360px] flex-shrink-0 overflow-hidden"
             style={{ backgroundColor: 'var(--color-base-panel)' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="flex-1 flex flex-col m-3 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-base-accent)', opacity: 0.15 }}
                  whileHover={{ scale: 1.05 }}
                  animate={{
                    boxShadow: isRecording
                      ? '0 0 12px rgba(239, 68, 68, 0.3)'
                      : '0 0 8px rgba(74, 122, 155, 0.15)'
                  }}
                >
                  <Radio size={16} className={isRecording ? 'text-red-400' : 'text-[var(--color-base-accent)]'} />
                </motion.div>
                <div>
                  <h1 className="text-sm font-mono tracking-[0.15em] text-[var(--color-base-text-bright)]">
                    投放舱
                  </h1>
                  <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40 mt-0.5">
                    输入 → 投放 → 完成
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-[var(--color-base-border)]">
              {([
                { mode: 'text' as CaptureMode, icon: FileText, label: '文字' },
                { mode: 'image' as CaptureMode, icon: Image, label: '图片' },
                { mode: 'audio' as CaptureMode, icon: isRecording ? MicOff : Mic, label: '录音' },
              ] as const).map(({ mode, icon: Icon, label }) => (
                <motion.button
                  key={mode}
                  onClick={() => {
                    setCaptureMode(mode);
                    resetCapture();
                  }}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono transition-all duration-200 ${
                    captureMode === mode
                      ? 'bg-[var(--color-base-accent)]/10 text-[var(--color-base-accent)] border-b-2 border-[var(--color-base-accent)]'
                      : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/20'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
              {/* Text Input */}
              {captureMode === 'text' && (
                <motion.textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="在此输入内容..."
                  className="flex-1 bg-[var(--color-base-bg)] border border-[var(--color-base-border)] rounded-lg p-4 text-sm text-[var(--color-base-text-light)] placeholder:text-[var(--color-base-text)] placeholder:opacity-40 resize-none focus:outline-none focus:border-[var(--color-base-accent)] font-sans leading-relaxed"
                  autoFocus
                  whileFocus={{ borderColor: 'var(--color-base-accent)', boxShadow: '0 0 0 3px rgba(74, 122, 155, 0.1)' }}
                />
              )}

              {/* Image Upload */}
              {captureMode === 'image' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <motion.div
                      className="flex-1 relative group rounded-lg overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      <motion.button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-[var(--color-base-bg)]/80 border border-[var(--color-base-border)] rounded-md text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] backdrop-blur-sm transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X size={14} />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center gap-3 bg-[var(--color-base-bg)] border-2 border-dashed border-[var(--color-base-border)] hover:border-[var(--color-base-accent)] rounded-lg text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-all duration-200"
                      whileHover={{ y: -2, borderColor: 'var(--color-base-accent)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-base-border)', opacity: 0.4 }}
                        animate={{ boxShadow: ['0 0 8px rgba(74, 122, 155, 0.1)', '0 0 16px rgba(74, 122, 155, 0.2)', '0 0 8px rgba(74, 122, 155, 0.1)'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Image size={22} />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-xs font-mono mb-1">点击上传图片</p>
                        <p className="text-[9px] opacity-50">JPG, PNG, GIF 支持</p>
                      </div>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Audio Recording */}
              {captureMode === 'audio' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  {audioBlob ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} controls className="w-full h-10 rounded-lg" />
                      <motion.button
                        onClick={() => setAudioBlob(null)}
                        className="text-[10px] text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] flex items-center gap-1.5 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <Trash2 size={11} /> 重新录制
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isRecording
                          ? 'border-red-500/60 bg-red-500/10 text-red-500'
                          : 'border-[var(--color-base-accent)]/50 bg-[var(--color-base-accent)]/5 text-[var(--color-base-accent)]'
                      }`}
                      animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                      transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
                      whileHover={!isRecording ? { y: -2, boxShadow: '0 0 20px rgba(74, 122, 155, 0.3)' } : {}}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mic size={28} />
                    </motion.button>
                  )}
                  <div className="text-center">
                    <p className="text-xs font-mono text-[var(--color-base-text)]">
                      {isRecording ? '● 录音中' : audioBlob ? '已保存' : '点击开始录音'}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent hint */}
              <div className="mt-3 pt-3 border-t border-[var(--color-base-border)]/50">
                <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--color-base-text)] opacity-40">
                  <Clock size={9} />
                  <span>最近 {recentItems.length} 条记录</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-[var(--color-base-border)] flex gap-3">
              <motion.button
                onClick={handleSaveDraft}
                disabled={isSaving || isDraftDisabled}
                className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-[11px] tracking-wider transition-all rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={!isDraftDisabled && !isSaving ? { y: -1, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : {}}
                whileTap={!isDraftDisabled && !isSaving ? { scale: 0.98 } : {}}
              >
                <Save size={13} />
                存草稿
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                disabled={isSaving || isSubmitDisabled}
                className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-accent)] hover:brightness-110 text-[var(--color-base-bg)] font-mono text-[11px] tracking-wider transition-all rounded-md disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-base-accent)]/15"
                whileHover={!isSubmitDisabled && !isSaving ? { y: -2, boxShadow: '0 4px 16px rgba(74, 122, 155, 0.3)' } : {}}
                whileTap={!isSubmitDisabled && !isSaving ? { scale: 0.98 } : {}}
              >
                <Send size={13} />
                投放
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ── Center: Main Workbench - TRUE VISUAL CENTER ── */}
        <div className="flex flex-col min-w-0 relative flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--color-base-bg)' }}>

          {/* Layer 1: Base Core Status (subtle ambient zone - 72px) */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 border-b border-[var(--color-base-border)]/30 flex-row"
               style={{ height: '72px', backgroundColor: 'var(--color-base-bg)' }}>
            {/* Left: Pulse/Map */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setMainViewMode(v => v === 'pulse' ? 'map' : 'pulse')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-base-border)] bg-[var(--color-base-panel)]/50 hover:bg-[var(--color-base-panel)] transition-all text-[10px] font-mono"
                whileHover={{ scale: 1.05, borderColor: 'var(--color-base-border-highlight)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {mainViewMode === 'pulse' ? (
                  <>
                    <Map size={11} className="text-[var(--color-base-text)]" />
                    <span className="text-[var(--color-base-text)]">基地地图</span>
                  </>
                ) : (
                  <>
                    <Radio size={11} className="text-[var(--color-base-accent)]" />
                    <span className="text-[var(--color-base-accent)]">脉冲</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Center: Status indicators */}
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex items-center gap-2 cursor-pointer group">
                {/* Breathing pulse indicator */}
                <div className="relative">
                  {/* Outer ring pulse */}
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse-ring-svg"
                    style={{ 
                      backgroundColor: 'var(--color-base-accent)',
                      opacity: 0.3,
                      transform: 'scale(1.8)'
                    }}
                  />
                  {/* Inner breathing dot */}
                  <div 
                    className="w-2 h-2 rounded-full bg-[var(--color-base-accent)] animate-pulse-glow-intense"
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--color-base-text)] group-hover:text-[var(--color-base-text-bright)] transition-colors">
                  基地活跃
                </span>
              </div>
              {lastActivityTime && (
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--color-base-text)] opacity-60">
                  <Clock size={9} className="opacity-70" />
                  <span title={`最后活动: ${dayjs(lastActivityTime).format('YYYY-MM-DD HH:mm:ss')}`}>
                    {getTimeSince(lastActivityTime)}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Right: Quick stats */}
            <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--color-base-text)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                草稿 {statusCounts.draft}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                待整理 {statusCounts.pending}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/60" />
                已归档 {statusCounts.archived}
              </span>
            </div>
          </div>

          {/* Mini pulse/map view */}
          <motion.div
            className="flex-shrink-0 flex items-center justify-center border-b border-[var(--color-base-border)]/20 cursor-pointer hover:bg-[var(--color-base-panel)]/30"
            style={{ height: '64px', backgroundColor: 'var(--color-base-bg)' }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => {
              if (mainViewMode === 'map') {
                setMapModalOpen(true);
              } else {
                setMainViewMode('map');
              }
            }}
          >
            {mainViewMode === 'pulse' ? (
              <PulseDot active={true} />
            ) : (
              <motion.div 
                className="relative animate-float-subtle"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <BaseMapView
                  width={280}
                  height={50}
                  activeRoom="main"
                  roomCapsuleCounts={{
                    launch: capsules.filter(c => c.status === 'draft').length,
                    main: capsules.filter(c => c.status === 'pending').length,
                    auxiliary: capsules.filter(c => c.status === 'archived').length,
                    trace: capsules.filter(c => c.status === 'echoing').length,
                  }}
                />
                {/* Click hint overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 rounded text-[9px] font-mono bg-[var(--color-base-bg)]/90 border border-[var(--color-base-border)] text-[var(--color-base-text)]">
                    点击全屏
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Layer 2: Recent Fragments Work Area - DENSE CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="flex-1 mx-3 mt-3 flex flex-col overflow-hidden min-h-0 rounded-lg"
            style={{ backgroundColor: 'var(--color-base-panel)', border: '1px solid var(--color-base-border)' }}
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-[var(--color-base-border)] flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-[var(--color-base-accent)]" />
                <span className="text-xs font-mono tracking-wider text-[var(--color-base-text-bright)]">
                  最近碎片
                </span>
                <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40">
                  {recentItems.length} 条
                </span>
              </div>
              <motion.button
                onClick={() => navigate('/wall')}
                className="text-[10px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors flex items-center gap-1"
                whileHover={{ y: -2 }}
              >
                全部碎片 <ChevronRight size={11} />
              </motion.button>
            </div>

            {/* Content - Dense masonry grid */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
                  />
                </div>
              ) : recentItems.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <Inbox size={24} className="text-[var(--color-base-text)] opacity-20" />
                  <p className="text-xs font-mono text-[var(--color-base-text)] opacity-40">暂无碎片</p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-25">
                    在左侧投放舱添加内容
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 items-stretch content-start">
                  {recentItems.map((cap) => {
                    const isNew = dayjs().diff(dayjs(cap.timestamp), 'minute') < 5;
                    return (
                      <motion.div
                        key={cap.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                        onClick={() => navigate('/wall')}
                        className="rounded-lg p-3 cursor-pointer group flex flex-col"
                        style={{
                          backgroundColor: 'var(--color-base-panel-raised)',
                          border: '1px solid var(--color-base-border)',
                          minHeight: '100px',
                          flexBasis: 'calc(50% - 6px)',
                          flexGrow: 1
                        }}
                      >
                        {/* Content */}
                        <div className="flex-1">
                          {cap.type === 'text' && (
                            <p className="text-[11px] text-[var(--color-base-text-light)] font-sans line-clamp-3 leading-relaxed">
                              {cap.content}
                            </p>
                          )}
                          {cap.type === 'image' && cap.fileUrl && (
                            <div className="space-y-2">
                              <img
                                src={`http://localhost:3000${cap.fileUrl}`}
                                alt=""
                                className="w-full h-14 object-cover rounded border border-[var(--color-base-border)]/50 group-hover:brightness-105 transition-all"
                              />
                              {cap.content && (
                                <p className="text-[9px] text-[var(--color-base-text)] opacity-60 line-clamp-1">
                                  {cap.content}
                                </p>
                              )}
                            </div>
                          )}
                          {cap.type === 'audio' && (
                            <div className="flex items-center gap-2">
                              <motion.div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: 'var(--color-base-accent)' }}
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <span className="text-[10px] text-[var(--color-base-text)]">音频片段</span>
                            </div>
                          )}
                        </div>
                        {/* Timestamp & Type */}
                        <div className="mt-auto pt-2 flex justify-between items-center border-t border-[var(--color-base-border)]/30">
                          <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-50">
                            {dayjs(cap.timestamp).format('MM-DD HH:mm')}
                          </span>
                          <span className={getTypeColor(cap.type)}>{getTypeIcon(cap.type, 10)}</span>
                        </div>
                        {/* NEW indicator */}
                        {isNew && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[7px] font-mono"
                               style={{ backgroundColor: 'var(--color-base-accent)', color: 'var(--color-base-bg)' }}>
                            NEW
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Layer 3: Pending Track (horizontal scroll) */}
          {pendingItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2 }}
              className="mx-3 mb-3 mt-2 flex flex-col rounded-lg overflow-hidden flex-shrink-0"
              style={{
                maxHeight: '90px',
                backgroundColor: 'var(--color-base-panel)',
                border: '1px solid var(--color-base-border)'
              }}
            >
              <div className="px-3 py-2 border-b border-[var(--color-base-border)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={10} className="text-amber-400" />
                  <span className="text-[10px] font-mono tracking-wider text-[var(--color-base-text-bright)]">
                    待整理
                  </span>
                  <motion.span
                    className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono text-amber-400"
                    style={{ backgroundColor: 'rgba(154, 133, 69, 0.2)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {pendingItems.length}
                  </motion.span>
                </div>
                <motion.button
                  onClick={() => navigate('/wall?status=draft')}
                  className="text-[9px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors"
                  whileHover={{ y: -2 }}
                >
                  前往整理 ›
                </motion.button>
              </div>
              <div className="flex-1 p-2 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-2 h-full">
                  {pendingItems.slice(0, 8).map((cap, idx) => (
                    <motion.div
                      key={cap.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -2 }}
                      onClick={() => navigate('/wall')}
                      className="flex-shrink-0 w-[140px] rounded p-2 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-base-bg)',
                        border: '1px solid var(--color-base-border)'
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={getTypeColor(cap.type)}>{getTypeIcon(cap.type, 9)}</span>
                        <span className="text-[8px] font-mono text-[var(--color-base-text)] opacity-50">
                          {dayjs(cap.timestamp).format('HH:mm')}
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--color-base-text-light)] line-clamp-2 leading-relaxed">
                        {cap.type === 'text' ? cap.content : cap.type === 'image' ? '[图片]' : '[音频]'}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Right: Auxiliary Column (320px) ── */}
        <div className="flex flex-col border-l border-[var(--color-base-border)] w-[320px] flex-shrink-0 overflow-hidden"
             style={{ backgroundColor: 'var(--color-base-panel)' }}>

          {/* Echo Preview (60%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            className="flex flex-col m-3 mb-1.5 rounded-lg overflow-hidden flex-1"
            style={{ backgroundColor: 'var(--color-base-panel-raised)', border: '1px solid var(--color-base-border)' }}
          >
            <div className="px-4 py-2.5 border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-2">
                <Radio size={12} className="text-[var(--color-base-text)]/60" />
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-base-text-bright)]">
                  回响预览
                </span>
              </div>
            </div>
            <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden">
              {echoCapsule ? (
                <>
                  <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                    {echoCapsule.type === 'text' && echoCapsule.content && (
                      <p className="text-[10px] text-[var(--color-base-text-light)] font-sans leading-relaxed italic text-center px-1">
                        "{echoCapsule.content}"
                      </p>
                    )}
                    {echoCapsule.type === 'image' && echoCapsule.fileUrl && (
                      <img
                        src={`http://localhost:3000${echoCapsule.fileUrl}`}
                        alt=""
                        className="max-h-full w-auto object-contain rounded border border-[var(--color-base-border)]"
                      />
                    )}
                    {echoCapsule.type === 'audio' && (
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: 'var(--color-base-accent)' }}
                          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-wider">音频片段</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-base-border)]/50">
                    <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40">
                      {dayjs(echoCapsule.timestamp).format('YYYY-MM-DD')}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30">
                      #{echoCapsule.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      onClick={refreshEchoCapsule}
                      className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-mono text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] rounded transition-colors"
                      style={{ backgroundColor: 'var(--color-base-border)', opacity: 0.5 }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Shuffle size={9} /> 换一条
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/echo')}
                      className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-mono rounded transition-colors"
                      style={{ backgroundColor: 'var(--color-base-accent)', color: 'var(--color-base-bg)' }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles size={9} /> 回响池
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Radio size={20} className="text-[var(--color-base-text)] opacity-15" />
                  <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-40">暂无回响</p>
                  <p className="text-[8px] font-mono text-[var(--color-base-text)] opacity-25 text-center">
                    投放碎片后唤醒
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Archive Summary (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.25 }}
            className="flex flex-col m-3 mt-1.5 rounded-lg overflow-hidden"
            style={{
              flex: '0 0 auto',
              backgroundColor: 'var(--color-base-panel-raised)',
              border: '1px solid var(--color-base-border)'
            }}
          >
            <div className="px-4 py-2.5 border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-2">
                <Archive size={12} className="text-[var(--color-base-text)]/60" />
                <span className="text-[10px] font-mono tracking-wider text-[var(--color-base-text-bright)]">
                  档案摘要
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              {/* Stats */}
              <div className="space-y-1.5">
                {lastReturn && (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-60">最近归档</span>
                    <span className="text-[9px] font-mono text-[var(--color-base-text-light)]">
                      {dayjs(lastReturn).format('MM-DD HH:mm')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-60">已归档</span>
                  <span className="text-[9px] font-mono text-[var(--color-base-text-light)]">{archivedCount} 条</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-60">收藏</span>
                  <span className="text-[9px] font-mono text-[var(--color-base-text-light)] flex items-center gap-1">
                    <Heart size={8} className="text-[var(--color-base-error)]/60" /> {favoritedCount} 条
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-[var(--color-base-text)] opacity-60">回响中</span>
                  <span className="text-[9px] font-mono text-[var(--color-base-text-light)]">{statusCounts.echoing} 条</span>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="pt-2 border-t border-[var(--color-base-border)]">
                <div className="flex gap-1 mb-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-base-border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (statusCounts.pending / Math.max(1, capsules.length)) * 100)}%`,
                        backgroundColor: 'var(--color-base-accent)',
                        opacity: 0.6
                      }}
                    />
                  </div>
                </div>
                <p className="text-[8px] font-mono text-[var(--color-base-text)] opacity-40 text-center">
                  共 {capsules.filter(c => !c.deletedAt).length} 条记录
                </p>
              </div>

              <motion.button
                onClick={() => navigate('/archive')}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[9px] font-mono rounded transition-colors"
                style={{
                  backgroundColor: 'var(--color-base-border)',
                  color: 'var(--color-base-text)',
                  opacity: 0.7
                }}
                whileHover={{ y: -1, opacity: 1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Archive size={10} /> 进入档案馆
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom: Return Trace Bar (48px thin strip) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3 }}
        className="flex-shrink-0"
        style={{ 
          height: '48px', 
          backgroundColor: 'var(--color-base-panel)', 
          borderTop: '1px solid var(--color-base-border)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <ReturnTraceTimeline
          capsules={returnTimeline}
          onCapsuleClick={(_capsule) => navigate('/wall')}
        />
      </motion.div>

      {/* ── Map Modal ── */}
      <AnimatePresence>
        {mapModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            onClick={() => setMapModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-2xl mx-4 rounded-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--color-base-bg)',
                border: '1px solid var(--color-base-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-base-border)]">
                <div className="flex items-center gap-2">
                  <Map size={14} className="text-[var(--color-base-accent)]" />
                  <span className="text-xs font-mono tracking-wider text-[var(--color-base-text-bright)]">
                    基地全图
                  </span>
                </div>
                <motion.button
                  onClick={() => setMapModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-base-border)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} className="text-[var(--color-base-text)]" />
                </motion.button>
              </div>

              {/* Modal content */}
              <div className="w-full h-full p-6">
                <BaseMapView
                  activeRoom={null}
                  isModal={true}
                  isOpen={mapModalOpen}
                  onClose={() => setMapModalOpen(false)}
                  onRoomClick={(roomId) => {
                    // Navigate based on room clicked
                    switch (roomId) {
                      case 'launch':
                        navigate('/wall?status=draft');
                        break;
                      case 'workstation':
                        navigate('/');
                        break;
                      case 'aux':
                        navigate('/archive');
                        break;
                      case 'trace':
                        navigate('/echo');
                        break;
                    }
                    setMapModalOpen(false);
                  }}
                  roomCapsuleCounts={{
                    launch: capsules.filter(c => c.status === 'draft').length,
                    workstation: capsules.filter(c => c.status === 'pending').length,
                    aux: capsules.filter(c => c.status === 'archived').length,
                    trace: capsules.filter(c => c.status === 'echoing').length,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;