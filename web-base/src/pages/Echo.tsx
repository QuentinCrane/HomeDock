/**
 * Echo.tsx - 回响池页面
 * 
 * Phase 2.4 重新设计：幽灵层效果
 * - 中央主卡片配合背景模糊层
 * - 周围幽灵胶囊营造深度氛围
 * - 平滑的淡入淡出+缩放+模糊过渡
 * - "记忆从深处被捞起"的沉浸感
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Capsule } from '../api';
import { fetchCapsules, recaptureCapsule, updateCapsule } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowLeft, Sparkles, AlertCircle, Heart, Shuffle, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import { playEchoPickSound, vibrateFeedback, getSoundPreference, getVibrationPreference } from '../sound';

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
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nestedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recaptureSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recaptureActionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get non-deleted capsules
  const activeCapsules = useMemo(() => 
    capsules.filter(c => !c.deletedAt),
    [capsules]
  );

  // Generate ghost capsules for deep atmospheric layering
  const ghostCapsules = useMemo(() => {
    const others = activeCapsules.filter(c => c.id !== current?.id);
    if (others.length === 0) return [];
    
    // 6 ghost positions around the center with blur-xl effect
    const positions = [
      { x: '-120px', y: '-100px', rotate: -6, scale: 0.7, opacity: 0.15, blur: 40 },
      { x: 'calc(100% + 100px)', y: '-80px', rotate: 8, scale: 0.65, opacity: 0.12, blur: 50 },
      { x: '-140px', y: '120px', rotate: -4, scale: 0.6, opacity: 0.1, blur: 45 },
      { x: 'calc(100% + 120px)', y: '100px', rotate: 5, scale: 0.55, opacity: 0.08, blur: 55 },
      { x: '10%', y: '70%', rotate: -10, scale: 0.5, opacity: 0.06, blur: 60 },
      { x: '80%', y: '20%', rotate: 12, scale: 0.45, opacity: 0.05, blur: 70 },
    ];
    
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
        await updateCapsule(current.id, { status: 'archived' });
        setFavoriteToastMessage('已取消收藏');
      } else {
        await updateCapsule(current.id, { status: 'favorited' });
        setFavoriteToastMessage('已添加收藏');
      }
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 2000);
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

  const pickRandomEcho = (list?: Capsule[]) => {
    const src = list || activeCapsules;
    if (src.length === 0) return;
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    if (nestedTimeoutRef.current) {
      clearTimeout(nestedTimeoutRef.current);
      nestedTimeoutRef.current = null;
    }
    
    // Select new echo first
    const picked = src[Math.floor(Math.random() * src.length)];
    
    // Play sound and vibration if enabled
    if (getSoundPreference('echo_pick')) {
      playEchoPickSound();
    }
    if (getVibrationPreference()) {
      vibrateFeedback();
    }
    
    setCurrent(picked);
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
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (nestedTimeoutRef.current) clearTimeout(nestedTimeoutRef.current);
      if (recaptureSuccessTimeoutRef.current) clearTimeout(recaptureSuccessTimeoutRef.current);
      if (recaptureActionTimeoutRef.current) clearTimeout(recaptureActionTimeoutRef.current);
    };
  }, []);

  const recaptureEcho = async () => {
    if (!current) return;
    setIsRecapturing(true);
    try {
      await recaptureCapsule(current.id, current.id);
      setShowRecaptureSuccess(true);

      if (recaptureSuccessTimeoutRef.current) clearTimeout(recaptureSuccessTimeoutRef.current);
      if (recaptureActionTimeoutRef.current) clearTimeout(recaptureActionTimeoutRef.current);

      recaptureSuccessTimeoutRef.current = setTimeout(() => {
        setShowRecaptureSuccess(false);
        recaptureSuccessTimeoutRef.current = null;
      }, 2000);

      recaptureActionTimeoutRef.current = setTimeout(() => {
        pickRandomEcho();
        loadCapsules();
        recaptureActionTimeoutRef.current = null;
      }, 500);
    } catch (err) {
      console.error(err);
    }
    setIsRecapturing(false);
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--color-base-bg)' }}>

      {/* === 深度氛围背景层 === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部暗角 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--color-base-bg)] to-transparent" />
        {/* 底部暗角 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-base-bg)] to-transparent" />
        {/* 中心微弱光晕 - 记忆的深度感 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-base-accent)] opacity-[0.015] rounded-full blur-[150px]" />
      </div>

      {/* === Toast 提示 === */}
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
            <button onClick={() => { setError(null); loadCapsules(); }} className="ml-2 underline hover:no-underline flex items-center gap-1">
              <RefreshCw size={12} /> 重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* === 顶栏 === */}
      <div className="flex items-center justify-between mb-4 px-6 pt-4 relative z-10">
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

      {/* === 中央记忆区 === */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-8 py-4">
        
        {/* === 幽灵胶囊层 - blur-xl 效果 === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence>
            {ghostCapsules.map((ghost, idx) => (
              <motion.div
                key={`ghost-${ghost.capsule.id}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: ghost.position.opacity }}
                exit={{ opacity: 0 }}
                className="absolute"
                style={{
                  left: ghost.position.x,
                  top: ghost.position.y,
                }}
              >
                <div
                  className="w-40 h-44 rounded-xl"
                  style={{
                    transform: `rotate(${ghost.position.rotate}deg) scale(${ghost.position.scale})`,
                    filter: `blur(${ghost.position.blur}px)`,
                  }}
                >
                  {/* 幽灵卡片 */}
                  <div className="w-full h-full bg-[var(--color-base-panel)] border border-[var(--color-base-border)] rounded-xl" />
                  {/* 幽灵内容 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    {ghost.capsule.type === 'text' && ghost.capsule.content && (
                      <p className="text-[var(--color-base-text)] font-serif text-xs text-center line-clamp-3 opacity-40">
                        {ghost.capsule.content}
                      </p>
                    )}
                    {ghost.capsule.type === 'image' && (
                      <div className="w-full h-16 bg-[var(--color-base-border)] rounded opacity-30" />
                    )}
                    {ghost.capsule.type === 'audio' && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-base-accent)]" />
                        <div className="w-12 h-0.5 bg-[var(--color-base-border)] rounded" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* === 中央主卡片 === */}
        <div className="relative w-full max-w-2xl mx-auto">
          
          {/* 背景模糊层 - 主卡片的倒影/余晕 */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={`blur-${current.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -translate-y-2 scale-105"
                style={{ filter: 'blur(40px)' }}
              >
                <div className="w-full h-full bg-[var(--color-base-panel-light)] rounded-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 主卡片 - 带柔和光晕 */}
          <div className="relative bg-[var(--color-base-panel)]/95 border border-[var(--color-base-border)]/50 rounded-2xl overflow-hidden">
            
            {/* 中心微光 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[var(--color-base-accent)] opacity-[0.03] rounded-full blur-[80px]" />
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
                  />
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50 tracking-widest">LOADING</p>
                </motion.div>
              ) : current ? (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="relative z-10 w-full p-10 text-center"
                >
                  {/* 类型标记 */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <div className={`w-2 h-2 rounded-full ${
                      current.type === 'text' ? 'bg-amber-400/70' : current.type === 'image' ? 'bg-amber-500/70' : 'bg-emerald-400/70'
                    }`} />
                    <span className="text-[10px] font-mono text-[var(--color-base-text)] tracking-[0.25em] uppercase">
                      {current.type === 'text' ? '文字记忆' : current.type === 'image' ? '图片记忆' : '音频记忆'}
                    </span>
                  </div>

                  {/* 文字记忆 */}
                  {current.type === 'text' && current.content && (
                    <div className="relative">
                      <span className="absolute -left-4 top-0 text-[var(--color-base-text)] opacity-10 text-5xl font-serif leading-none">"</span>
                      <span className="absolute -right-4 bottom-0 text-[var(--color-base-text)] opacity-10 text-5xl font-serif leading-none rotate-180">"</span>
                      <p className="text-2xl md:text-3xl text-[var(--color-base-text-bright)] font-serif leading-relaxed whitespace-pre-wrap px-6">
                        {current.content}
                      </p>
                    </div>
                  )}

                  {/* 图片记忆 */}
                  {current.type === 'image' && current.fileUrl && (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="absolute -inset-3 bg-gradient-to-b from-[var(--color-base-accent)]/10 to-transparent rounded-xl blur-[12px]" />
                        <img
                          src={`http://localhost:3000${current.fileUrl}`}
                          alt="记忆"
                          className="relative max-h-64 object-contain border border-[var(--color-base-border)] rounded-xl shadow-lg"
                        />
                      </div>
                      {current.content && (
                        <p className="text-lg text-[var(--color-base-text-light)] font-serif italic">{current.content}</p>
                      )}
                    </div>
                  )}

                  {/* 音频记忆 */}
                  {current.type === 'audio' && current.fileUrl && (
                    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-base-accent)] animate-pulse opacity-70" />
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-[var(--color-base-accent)]/50 rounded-full animate-pulse"
                              style={{ height: `${8 + Math.sin(i * 0.8) * 6}px`, animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] tracking-[0.2em] font-mono uppercase text-[var(--color-base-text)]">音频片段</span>
                      </div>
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
                  <p className="mt-10 text-xs text-[var(--color-base-text)] font-mono tracking-wider opacity-50">
                    {dayjs(current.timestamp).format('YYYY 年 MM 月 DD 日')}
                  </p>
                  <p className="mt-2 text-[10px] text-[var(--color-base-text)] opacity-25 font-mono">
                    #{current.id.toString().padStart(4, '0')}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[var(--color-base-accent)] opacity-5 rounded-full blur-[20px]" />
                    <Sparkles size={32} className="relative text-[var(--color-base-text)] opacity-20" />
                  </div>
                  <p className="text-[var(--color-base-text)] font-serif italic text-lg opacity-50">档案馆中暂无记忆</p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-30 tracking-widest">THE ARCHIVE AWAITS</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* === 操作按钮条 === */}
        <div className="flex justify-center gap-4 mt-10 relative z-10">
          
          {/* 再抽一条 */}
          <motion.button
            onClick={() => pickRandomEcho()}
            disabled={activeCapsules.length === 0}
            className="flex items-center gap-2 px-5 py-3 border border-[var(--color-base-accent)]/40 bg-[var(--color-base-accent)]/10 hover:bg-[var(--color-base-accent)]/20 hover:border-[var(--color-base-accent)] rounded-xl group disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Shuffle size={16} className="text-[var(--color-base-accent)]" />
            </motion.div>
            <span className="text-xs font-mono tracking-[0.15em] text-[var(--color-base-accent)]">再抽一条</span>
          </motion.button>

          {/* 重新投放 */}
          <motion.button
            onClick={recaptureEcho}
            disabled={!current || isRecapturing}
            className="flex items-center gap-2 px-5 py-3 border border-[var(--color-base-accent)]/30 bg-[var(--color-base-accent)]/5 hover:bg-[var(--color-base-accent)]/15 hover:border-[var(--color-base-accent)] rounded-xl group disabled:opacity-30 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={isRecapturing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRecapturing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { type: 'spring', stiffness: 200, damping: 15 }}
              whileHover={{ rotate: 180 }}
            >
              <RefreshCw size={16} className="text-[var(--color-base-accent)]" />
            </motion.div>
            <span className="text-xs font-mono tracking-[0.15em] text-[var(--color-base-accent)]">{isRecapturing ? '投放中...' : '重新投放'}</span>
          </motion.button>

          {/* 收藏 */}
          <motion.button
            onClick={handleToggleFavorite}
            disabled={!current}
            className={`flex items-center gap-2 px-5 py-3 border rounded-xl group disabled:opacity-30 disabled:cursor-not-allowed ${
              isFavorited
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-[var(--color-base-border)] bg-[var(--color-base-panel)]/80 hover:bg-[var(--color-base-panel-light)]'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.div
              animate={isFavorited ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Heart size={16} className={isFavorited ? 'text-red-500' : 'text-[var(--color-base-text)] group-hover:text-red-400'} />
            </motion.div>
            <span className={`text-xs font-mono tracking-[0.15em] ${isFavorited ? 'text-red-500' : 'text-[var(--color-base-text)] group-hover:text-red-400'}`}>
              {isFavorited ? '已收藏' : '收藏'}
            </span>
          </motion.button>

          {/* 查看来源 */}
          {current?.sourceId && (
            <motion.button
              onClick={handleSourceJump}
              className="flex items-center gap-2 px-5 py-3 border border-[var(--color-base-border)] bg-[var(--color-base-panel)]/80 hover:bg-[var(--color-base-panel-light)] hover:border-[var(--color-base-text-light)] rounded-xl group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <ExternalLink size={16} className="text-[var(--color-base-text)] group-hover:text-[var(--color-base-accent)]" />
              <span className="text-xs font-mono tracking-[0.15em] text-[var(--color-base-text)] group-hover:text-[var(--color-base-accent)]">查看来源</span>
            </motion.button>
          )}
        </div>

        {/* 提示文字 */}
        <div className="text-center mt-6 mb-4">
          <p className="text-[9px] font-mono text-[var(--color-base-text)] opacity-25 tracking-widest">
            重新投放会将此记忆克隆为新碎片，原记忆保留在回响池中
          </p>
        </div>
      </div>
    </div>
  );
};

export default EchoPage;