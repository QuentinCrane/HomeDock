/**
 * Echo.tsx - 回响池页面
 * 
 * 功能说明：
 *   - 随机抽取一个胶囊进行回顾
 *   - 提供沉浸式的记忆回放体验
 *   - 背景有"幽灵胶囊"营造氛围
 *   - 支持重新投放（克隆）功能
 * 
 * 状态管理：
 *   - current: 当前显示的胶囊
 *   - isTransitioning: 是否正在切换（模糊过渡效果）
 *   - ghostCapsules: 周围的幽灵胶囊数组
 * 
 * 用户交互：
 *   - 再抽一条：从池中随机选择新胶囊
 *   - 收藏/取消收藏：切换 favorited 状态
 *   - 重新投放：克隆胶囊创建新碎片
 *   - 查看来源：如果有 sourceId，跳转到来源胶囊
 * 
 * 视觉效果：
 *   - 雾气层背景
 *   - 切换时的模糊过渡
 *   - 中心脉冲光晕
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Capsule } from '../api';
import { fetchCapsules, recaptureCapsule, updateCapsule } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, Send, Sparkles, AlertCircle, RefreshCw as RetryIcon, Heart } from 'lucide-react';
import dayjs from 'dayjs';
import { playEchoPickSound, vibrateFeedback, getSoundPreference, getVibrationPreference } from '../sound';

/// 幽灵胶囊数据结构 - 用于背景氛围效果
interface GhostCapsuleData {
  capsule: Capsule;
  position: { x: string; y: string; rotate: number; scale: number; opacity: number; blur: number };
}

const EchoPage: React.FC = () => {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [current, setCurrent] = useState<Capsule | null>(null);
  const [isRecapturing, setIsRecapturing] = useState(false);
  const [showRecaptureSuccess, setShowRecaptureSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [favoriteToastMessage, setFavoriteToastMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get non-deleted capsules
  const activeCapsules = useMemo(() => 
    capsules.filter(c => !c.deletedAt),
    [capsules]
  );

  // Generate ghost capsules for deep atmospheric layering
  const ghostCapsules = useMemo((): GhostCapsuleData[] => {
    const others = activeCapsules.filter(c => c.id !== current?.id);
    if (others.length === 0) return [];
    
    // Create 6-8 ghost positions around the center for deep atmosphere
    const positions: GhostCapsuleData['position'][] = [
      { x: '-180px', y: '-80px', rotate: -8, scale: 0.85, opacity: 0.12, blur: 4 },
      { x: 'calc(100% + 160px)', y: '-60px', rotate: 6, scale: 0.8, opacity: 0.1, blur: 5 },
      { x: '-200px', y: '80px', rotate: -5, scale: 0.75, opacity: 0.08, blur: 6 },
      { x: 'calc(100% + 180px)', y: '100px', rotate: 9, scale: 0.7, opacity: 0.07, blur: 7 },
      { x: '-120px', y: '60%', rotate: -12, scale: 0.6, opacity: 0.05, blur: 8 },
      { x: 'calc(100% + 140px)', y: '40%', rotate: 10, scale: 0.55, opacity: 0.04, blur: 9 },
    ];
    
    // Shuffle and pick
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    return positions.slice(0, Math.min(others.length, positions.length)).map((pos, i) => ({
      capsule: shuffled[i % shuffled.length],
      position: pos,
    }));
  }, [activeCapsules, current?.id]);

  // Check if current capsule is favorited
  const isFavorited = current?.status === 'favorited';

  const handleToggleFavorite = async () => {
    if (!current) return;
    try {
      if (isFavorited) {
        // Revert to previous status (default to 'archived')
        await updateCapsule(current.id, { status: 'archived' });
        setFavoriteToastMessage('已取消收藏');
      } else {
        await updateCapsule(current.id, { status: 'favorited' });
        setFavoriteToastMessage('已添加收藏');
      }
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 2000);
      // Refresh capsules to update UI
      loadCapsules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSourceJump = () => {
    if (!current?.sourceId) return;
    const sourceCapsule = capsules.find(c => c.id === current.sourceId);
    if (sourceCapsule) {
      setCurrent(sourceCapsule);
    }
  };

  const pickRandom = (list?: Capsule[]) => {
    const src = list || activeCapsules;
    if (src.length === 0) return;
    
    // Set transitioning state for blur/fog effect
    setIsTransitioning(true);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // After brief blur, switch content
    transitionTimeoutRef.current = setTimeout(() => {
      const picked = src[Math.floor(Math.random() * src.length)];
      setCurrent(picked);
      
      // Play echo pick sound and vibration if enabled
      if (getSoundPreference('echo_pick')) {
        playEchoPickSound();
      }
      if (getVibrationPreference()) {
        vibrateFeedback();
      }
      
      // End transitioning after new content fades in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 300);
  };

  const loadCapsules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCapsules({ includeDeleted: true });
      setCapsules(data);
      if (data.length > 0 && !current) {
        setCurrent(data.filter(c => !c.deletedAt)[Math.floor(Math.random() * data.filter(c => !c.deletedAt).length)]);
      }
    } catch (err) {
      setError('加载失败，请重试');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCapsules();
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecapture = async () => {
    if (!current) return;
    setIsRecapturing(true);
    try {
      await recaptureCapsule(current.id, current.id);
      setShowRecaptureSuccess(true);
      setTimeout(() => setShowRecaptureSuccess(false), 2000);
      setTimeout(() => {
        pickRandom();
        loadCapsules();
      }, 500);
    } catch (err) {
      console.error(err);
    }
    setIsRecapturing(false);
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative" style={{ backgroundColor: 'var(--color-base-bg)' }}>

      {/* === 背景雾气层 === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 底部雾气 */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[var(--color-base-bg)]/90 via-[var(--color-base-bg)]/40 to-transparent" />
        {/* 顶部雾气 */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-[var(--color-base-bg)]/80 via-[var(--color-base-bg)]/40 to-transparent" />
        {/* 中心微弱光晕 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-base-accent)] opacity-[0.02] rounded-full blur-[120px]" />
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-base-error)] text-white px-6 py-2 text-sm font-mono flex items-center gap-2"
          >
            <AlertCircle size={14} />
            {error}
            <button 
              onClick={() => { setError(null); loadCapsules(); }}
              className="ml-2 underline hover:no-underline flex items-center gap-1"
            >
              <RetryIcon size={12} /> 重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 成功提示 */}
      <AnimatePresence>
        {showRecaptureSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-base-success)] text-[var(--color-base-bg)] px-6 py-2 text-sm font-mono"
          >
            重新投放成功
          </motion.div>
        )}
      </AnimatePresence>

      {/* 收藏提示 */}
      <AnimatePresence>
        {showFavoriteToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-base-accent)] text-[var(--color-base-bg)] px-6 py-2 text-sm font-mono"
          >
            {favoriteToastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--color-base-border)]/50 pb-4 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors font-mono text-sm tracking-widest uppercase group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          [ 返回基地 ]
        </button>

        <h2 className="text-xl font-bold text-[var(--color-base-text-bright)] tracking-[0.2em] font-mono">
          回响池
        </h2>

        <div className="w-24 text-right text-[10px] text-[var(--color-base-text)] font-mono tracking-widest">
          记忆空间
        </div>
      </div>

      {/* 中央记忆区 - 充满氛围的容器 */}
      <div className="flex-1 flex items-center justify-center relative px-4 py-8">
        <div className="w-full max-w-3xl relative">

          {/* === 周围雾气层 - 多个幽灵胶囊 === */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence>
              {ghostCapsules.map((ghost, idx) => (
                <motion.div
                  key={`ghost-${ghost.capsule.id}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: ghost.position.opacity }}
                  exit={{ opacity: 0 }}
                  className="absolute select-none"
                  style={{
                    left: ghost.position.x,
                    top: ghost.position.y,
                    width: '160px',
                    height: '180px',
                  }}
                >
                  {/* 使用内部 div 应用 blur 和 transform，确保 overflow-hidden 生效 */}
                  <div
                    className="w-full h-full"
                    style={{
                      transform: `rotate(${ghost.position.rotate}deg) scale(${ghost.position.scale})`,
                      transformOrigin: 'center center',
                      filter: `blur(${ghost.position.blur}px)`,
                      overflow: 'hidden',
                    }}
                  >
                    <div className="w-full h-full relative">
                      {/* 幽灵卡片底层 */}
                      <div className="absolute inset-0 bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-lg" />
                      
                      {/* 幽灵内容预览 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                        {ghost.capsule.type === 'text' && ghost.capsule.content && (
                          <p className="text-[var(--color-base-text)] font-serif text-[10px] text-center line-clamp-4 opacity-50">
                            {ghost.capsule.content}
                          </p>
                        )}
                        {ghost.capsule.type === 'image' && (
                          <div className="w-full h-12 bg-[var(--color-base-border)] rounded opacity-40" />
                        )}
                        {ghost.capsule.type === 'audio' && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-base-accent)]" />
                            <div className="w-10 h-0.5 bg-[var(--color-base-border)] rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* === 主记忆卡 - 带雾气过渡效果 === */}
          <div className={`relative bg-[var(--color-base-panel)]/90 border border-[var(--color-base-border)]/60 p-10 flex flex-col items-center justify-center min-h-[400px] rounded-lg overflow-hidden transition-all duration-300 ${
            isTransitioning ? 'filter blur-[8px] opacity-40' : 'filter blur-0 opacity-100'
          }`}>

            {/* 柔和光晕 - 从中心向外扩散 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-radial from-[var(--color-base-panel-light)] via-transparent to-transparent opacity-40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--color-base-accent)] opacity-[0.04] rounded-full blur-[60px]" />
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
                  />
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest">
                    LOADING
                  </p>
                </motion.div>
              ) : current ? (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.96 }}
                  animate={{ 
                    opacity: 1, 
                    filter: 'blur(0px)',
                    scale: 1,
                    transition: { 
                      duration: 0.5,
                      ease: 'easeOut'
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    filter: 'blur(12px)',
                    scale: 0.98,
                    transition: { 
                      duration: 0.3
                    }
                  }}
                  className="text-center relative z-10 w-full"
                >
                  {/* 类型标记 */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`w-2 h-2 rounded-full ${
                      current.type === 'text' ? 'bg-amber-400/70' : current.type === 'image' ? 'bg-amber-500/70' : 'bg-emerald-400/70'
                    }`}></div>
                    <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-[0.25em] uppercase">
                      {current.type === 'text' ? '文字记忆' : current.type === 'image' ? '图片记忆' : '音频记忆'}
                    </span>
                  </div>

                  {/* 文字记忆 */}
                  {current.type === 'text' && current.content && (
                    <div className="relative">
                      {/* 装饰性引号 */}
                      <span className="absolute -left-6 top-0 text-[var(--color-base-text)] opacity-10 text-6xl font-serif leading-none">"</span>
                      <span className="absolute -right-6 bottom-0 text-[var(--color-base-text)] opacity-10 text-6xl font-serif leading-none rotate-180">"</span>
                      
                      <p className="text-2xl md:text-3xl text-[var(--color-base-text-bright)] font-serif leading-relaxed whitespace-pre-wrap px-4">
                        {current.content}
                      </p>
                    </div>
                  )}

                  {/* 图片记忆 */}
                  {current.type === 'image' && current.fileUrl && (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        {/* 图片边框光晕 */}
                        <div className="absolute -inset-2 bg-gradient-to-b from-[var(--color-base-accent)]/10 to-transparent rounded-lg blur-[8px]" />
                        <img
                          src={`http://localhost:3000${current.fileUrl}`}
                          alt="记忆"
                          className="relative max-h-72 object-contain border border-[var(--color-base-border)] rounded-lg shadow-lg"
                        />
                      </div>
                      {current.content && (
                        <p className="text-lg text-[var(--color-base-text-light)] font-serif italic">{current.content}</p>
                      )}
                    </div>
                  )}

                  {/* 音频记忆 */}
                  {current.type === 'audio' && current.fileUrl && (
                    <div className="flex flex-col items-center gap-6 w-full max-w-md">
                      {/* 音频可视化装饰 */}
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-base-accent)] animate-pulse opacity-70" />
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className="w-0.5 bg-[var(--color-base-accent)]/50 rounded-full animate-pulse"
                              style={{ 
                                height: `${8 + Math.sin(i * 0.8) * 6}px`,
                                animationDelay: `${i * 0.1}s`
                              }} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] tracking-[0.2em] font-mono uppercase text-[var(--color-base-text)]">音频片段</span>
                      </div>
                      
                      {/* 音频播放器 */}
                      <audio 
                        controls 
                        src={`http://localhost:3000${current.fileUrl}`} 
                        className="w-full h-10 rounded-lg bg-[var(--color-base-bg)] border border-[var(--color-base-border)]"
                      />
                      
                      {current.content && (
                        <p className="text-sm text-[var(--color-base-text-light)] font-serif italic">{current.content}</p>
                      )}
                    </div>
                  )}

                  {/* 时间戳 */}
                  <p className="mt-10 text-xs text-[var(--color-base-text)] font-mono tracking-wider opacity-60">
                    {dayjs(current.timestamp).format('YYYY 年 MM 月 DD 日')}
                  </p>

                  {/* ID */}
                  <p className="mt-2 text-[10px] text-[var(--color-base-text)] opacity-30 font-mono">
                    #{current.id.toString().padStart(4, '0')}
                  </p>
                </motion.div>
              ) : (
                /* 空状态 */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* 柔和的图标 */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-[var(--color-base-accent)] opacity-5 rounded-full blur-[20px]" />
                    <Sparkles size={32} className="relative text-[var(--color-base-text)] opacity-20" />
                  </div>
                  <p className="text-[var(--color-base-text)] font-serif italic text-lg opacity-50">
                    档案馆中暂无记忆
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30 tracking-widest">
                    THE ARCHIVE AWAITS
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* === 操作按钮 - 重新连接回响到主流程 === */}
      <div className="relative z-10 border-t border-[var(--color-base-border)]/40 pt-6 mt-auto">
        <div className="flex justify-center gap-10">
          {/* 来源跳转 */}
          {current?.sourceId && (
            <button
              onClick={handleSourceJump}
              className="flex flex-col items-center gap-2 group cursor-pointer transition-all"
            >
              <div className="w-16 h-16 border border-[var(--color-base-text)]/30 bg-[var(--color-base-panel)]/80 flex items-center justify-center group-hover:border-[var(--color-base-text)]/60 group-hover:bg-[var(--color-base-panel-light)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-black/10 backdrop-blur-sm">
                <Sparkles 
                  size={20} 
                  className="text-[var(--color-base-text)]/60 group-hover:text-[var(--color-base-text)] transition-colors" 
                />
              </div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--color-base-text)]/60 group-hover:text-[var(--color-base-text)] transition-colors">
                查看来源
              </span>
            </button>
          )}

          {/* 收藏 */}
          <button
            onClick={handleToggleFavorite}
            disabled={!current}
            className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <div className={`w-16 h-16 border transition-all duration-300 rounded-lg hover:shadow-lg backdrop-blur-sm ${
              isFavorited 
                ? 'border-red-500/60 bg-red-500/10 hover:border-red-500 hover:shadow-red-500/10' 
                : 'border-[var(--color-base-border)] bg-[var(--color-base-panel)]/80 group-hover:border-[var(--color-base-text-light)] group-hover:bg-[var(--color-base-panel-light)] hover:shadow-black/10'
            }`}>
              <Heart 
                size={20} 
                className={`transition-all ${isFavorited 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-[var(--color-base-text)] group-hover:text-red-400'}`} 
              />
            </div>
            <span className={`text-[9px] font-mono tracking-[0.2em] transition-colors ${
              isFavorited ? 'text-red-500' : 'text-[var(--color-base-text)] group-hover:text-red-400'
            }`}>
              {isFavorited ? '已收藏' : '收藏'}
            </span>
          </button>

          {/* 再抽一条 - 主要操作 */}
          <button
            onClick={() => pickRandom()}
            disabled={activeCapsules.length === 0}
            className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <div className="w-16 h-16 border border-[var(--color-base-accent)]/40 bg-[var(--color-base-accent)]/10 flex items-center justify-center group-hover:bg-[var(--color-base-accent)]/20 group-hover:border-[var(--color-base-accent)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-[var(--color-base-accent)]/10 backdrop-blur-sm">
              <RefreshCw 
                size={20} 
                className="text-[var(--color-base-accent)] group-hover:rotate-180 transition-all duration-700" 
              />
            </div>
            <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--color-base-accent)] group-hover:text-[var(--color-base-text-bright)] transition-colors">
              再抽一条
            </span>
          </button>

          {/* 重新投放 */}
          <button
            onClick={handleRecapture}
            disabled={!current || isRecapturing}
            className="flex flex-col items-center gap-2 group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <div className="w-16 h-16 border border-[var(--color-base-accent)]/30 bg-[var(--color-base-accent)]/5 flex items-center justify-center group-hover:bg-[var(--color-base-accent)]/15 group-hover:border-[var(--color-base-accent)] transition-all duration-300 rounded-lg hover:shadow-lg hover:shadow-[var(--color-base-accent)]/10 backdrop-blur-sm">
              <Send 
                size={20} 
                className={`text-[var(--color-base-accent)] transition-transform ${isRecapturing ? 'animate-spin' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} 
              />
            </div>
            <span className="text-[9px] font-mono tracking-[0.2em] text-[var(--color-base-accent)] group-hover:text-[var(--color-base-text-bright)] transition-colors">
              {isRecapturing ? '投放中...' : '重新投放'}
            </span>
          </button>
        </div>

        {/* 提示 */}
        <div className="text-center mt-6 pb-6">
          <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-30 tracking-widest leading-relaxed">
            重新投放会将此记忆克隆为新碎片，原记忆保留在回响池中
          </p>
        </div>
      </div>
    </div>
  );
};

export default EchoPage;