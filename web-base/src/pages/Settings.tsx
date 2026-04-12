/**
 * Settings.tsx - 设置页面
 * 
 * 功能说明：
 *   - 主题设置（日间/夜间/自动）
 *   - 动画强度控制（关闭/低/中/高）
 *   - 声音与震动反馈开关
 *   - 基地信息展示
 *   - 快捷导航入口
 * 
 * 状态管理：
 *   - themeMode: 主题模式（接收自父组件 App）
 *   - animationIntensity: 动画强度
 *   - soundOnSubmit/echoPick/newCapsule: 各场景声音开关
 *   - vibrationEnabled: 震动反馈开关
 * 
 * 用户交互：
 *   - onThemeModeChange: 通知父组件切换主题
 *   - onAnimationIntensityChange: 通知父组件改变动画强度
 *   - 声音/震动设置：直接保存到 localStorage
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStatus } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Monitor,
  HardDrive,
  Clock,
  Database,
  Info,
  Heart,
  Settings as SettingsIcon,
  RefreshCw,
  AlertCircle,
  Check,
  Sparkles,
  Zap,
  Layers,
  Flame,
  Volume2,
  Vibrate
} from 'lucide-react';
import { 
  getSoundPreference, 
  setSoundPreference, 
  getVibrationPreference, 
  setVibrationPreference 
} from '../sound';
import dayjs from 'dayjs';

/// 基地信息接口
interface BaseInfo {
  totalCapsules: number;
  lastReturnTime: number | null;
  status: string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-6 h-6 border-2 border-[var(--color-base-border)] border-t-[var(--color-base-accent)] rounded-full"
    />
  </div>
);

const ErrorBanner: React.FC<{ message: string; onDismiss: () => void; onRetry?: () => void }> = ({ 
  message, 
  onDismiss, 
  onRetry 
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mb-4 p-3 bg-[var(--color-base-error)]/20 border border-[var(--color-base-error)]/40 flex items-center justify-between"
  >
    <div className="flex items-center gap-2 text-[var(--color-base-error)]">
      <AlertCircle size={14} />
      <span className="text-xs font-mono">{message}</span>
    </div>
    <div className="flex items-center gap-2">
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-[10px] font-mono text-[var(--color-base-error)] hover:underline"
        >
          重试
        </button>
      )}
      <button onClick={onDismiss} className="text-[var(--color-base-error)] hover:opacity-70">
        <Check size={12} />
      </button>
    </div>
  </motion.div>
);

interface SettingsPageProps {
  themeMode?: 'day' | 'night' | 'auto';
  effectiveTheme?: 'day' | 'night';
  onThemeModeChange?: (mode: 'day' | 'night' | 'auto') => void;
  animationIntensity?: 'off' | 'low' | 'medium' | 'high';
  onAnimationIntensityChange?: (intensity: 'off' | 'low' | 'medium' | 'high') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  themeMode = 'auto',
  effectiveTheme = 'night',
  onThemeModeChange,
  animationIntensity = 'medium',
  onAnimationIntensityChange
}) => {
  const navigate = useNavigate();
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Sound preferences - loaded from localStorage
  const [soundOnSubmit, setSoundOnSubmit] = useState(() => getSoundPreference('submit'));
  const [soundOnEchoPick, setSoundOnEchoPick] = useState(() => getSoundPreference('echo_pick'));
  const [soundOnNewCapsule, setSoundOnNewCapsule] = useState(() => getSoundPreference('new_capsule'));
  const [vibrationEnabled, setVibrationEnabled] = useState(() => getVibrationPreference());

  const loadBaseInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStatus();
      setBaseInfo(data);
    } catch (err) {
      setError('无法获取基地信息');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBaseInfo();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadBaseInfo();
    } catch (err) {
      setError('同步失败');
      console.error(err);
    }
    setSyncing(false);
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col relative max-w-6xl mx-auto" style={{ backgroundColor: 'var(--color-base-bg)' }}>
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--color-base-border)] pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[var(--color-base-text)] hover:text-[var(--color-base-accent)] transition-colors font-mono text-sm tracking-widest uppercase group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          [ 返回基地 ]
        </button>

        <h2 className="text-xl font-bold text-[var(--color-base-text-bright)] tracking-[0.2em]">
          设置
        </h2>

        <div className="w-24"></div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={loadBaseInfo} />
        )}
      </AnimatePresence>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {/* ── 主题设置 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              主题
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)] p-4">
            <div className="flex gap-3">
              {/* Auto mode */}
              <button
                onClick={() => onThemeModeChange?.('auto')}
                className={`flex-1 p-4 flex flex-col items-center gap-2 transition-all border-[var(--color-base-border)] ${
                  themeMode === 'auto'
                    ? 'border-[var(--color-base-accent)] bg-[var(--color-base-accent)]/10'
                    : 'hover:border-[var(--color-base-border-highlight)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  themeMode === 'auto' ? 'bg-[var(--color-base-accent)]/20' : 'bg-[var(--color-base-border)]'
                }`}>
                  <Monitor size={20} className={themeMode === 'auto' ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)]'} />
                </div>
                <span className={`text-xs font-mono ${
                  themeMode === 'auto' ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)]'
                }`}>
                  自动
                </span>
              </button>

              {/* Day mode */}
              <button
                onClick={() => onThemeModeChange?.('day')}
                className={`flex-1 p-4 flex flex-col items-center gap-2 transition-all border-[var(--color-base-border)] ${
                  themeMode === 'day'
                    ? 'border-[var(--color-base-accent)] bg-[var(--color-base-accent)]/10'
                    : 'hover:border-[var(--color-base-border-highlight)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  themeMode === 'day' ? 'bg-amber-400/20' : 'bg-[var(--color-base-border)]'
                }`}>
                  <Sun size={20} className={themeMode === 'day' ? 'text-amber-500' : 'text-[var(--color-base-text)]'} />
                </div>
                <span className={`text-xs font-mono ${
                  themeMode === 'day' ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)]'
                }`}>
                  日间
                </span>
              </button>

              {/* Night mode */}
              <button
                onClick={() => onThemeModeChange?.('night')}
                className={`flex-1 p-4 flex flex-col items-center gap-2 transition-all border-[var(--color-base-border)] ${
                  themeMode === 'night'
                    ? 'border-[var(--color-base-accent)] bg-[var(--color-base-accent)]/10'
                    : 'hover:border-[var(--color-base-border-highlight)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  themeMode === 'night' ? 'bg-[var(--color-base-accent)]/20' : 'bg-[var(--color-base-border)]'
                }`}>
                  <Moon size={20} className={themeMode === 'night' ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)]'} />
                </div>
                <span className={`text-xs font-mono ${
                  themeMode === 'night' ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)]'
                }`}>
                  夜间
                </span>
              </button>
            </div>

            <p className="mt-3 text-[10px] font-mono text-[var(--color-base-text)] opacity-60 text-center">
              {themeMode === 'auto' ? `自动模式：当前${effectiveTheme === 'day' ? '日间' : '夜间'}` : '跟随系统时间自动切换'}
            </p>
          </div>
        </motion.section>

        {/* ── 动画强度 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              动画强度
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)] p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'off', label: '关闭', desc: '无动画', icon: <Zap size={16} /> },
                { value: 'low', label: '低', desc: '仅页面切换', icon: <Layers size={16} /> },
                { value: 'medium', label: '中', desc: '标准效果', icon: <Sparkles size={16} /> },
                { value: 'high', label: '高', desc: '完整动效', icon: <Flame size={16} /> },
              ].map(({ value, label, desc, icon }) => (
                <button
                  key={value}
                  onClick={() => onAnimationIntensityChange?.(value as 'off' | 'low' | 'medium' | 'high')}
                  className={`p-3 flex flex-col items-center gap-2 transition-all border ${
                    animationIntensity === value
                      ? 'border-[var(--color-base-accent)] bg-[var(--color-base-accent)]/10'
                      : 'border-[var(--color-base-border)] hover:border-[var(--color-base-border-highlight)]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    animationIntensity === value
                      ? 'bg-[var(--color-base-accent)]/20 text-[var(--color-base-accent)]'
                      : 'bg-[var(--color-base-border)] text-[var(--color-base-text)]'
                  }`}>
                    {icon}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-mono ${
                      animationIntensity === value ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text-bright)]'
                    }`}>
                      {label}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-0.5">
                      {desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-3 text-[10px] font-mono text-[var(--color-base-text)] opacity-60 text-center">
              {animationIntensity === 'off' && '所有动画已禁用'}
              {animationIntensity === 'low' && '仅保留必要的页面过渡动画'}
              {animationIntensity === 'medium' && '标准动画效果'}
              {animationIntensity === 'high' && '完整动画，包括增强特效'}
            </p>
          </div>
        </motion.section>

        {/* ── 声音与震动 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Volume2 size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              声音与震动
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
            {/* 投放成功提示音 */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-base-accent)]/10 flex items-center justify-center">
                  <Volume2 size={14} className="text-[var(--color-base-accent)]" />
                </div>
                <div>
                  <p className="text-xs font-mono text-[var(--color-base-text-bright)]">
                    投放成功提示音
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-0.5">
                    胶囊提交成功后播放
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !soundOnSubmit;
                  setSoundOnSubmit(newVal);
                  setSoundPreference('submit', newVal);
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  soundOnSubmit 
                    ? 'bg-[var(--color-base-accent)]' 
                    : 'bg-[var(--color-base-border)]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  soundOnSubmit ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* 回响抽取提示音 */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-base-accent)]/10 flex items-center justify-center">
                  <Volume2 size={14} className="text-[var(--color-base-accent)]" />
                </div>
                <div>
                  <p className="text-xs font-mono text-[var(--color-base-text-bright)]">
                    回响抽取提示音
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-0.5">
                    随机抽取胶囊时播放
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !soundOnEchoPick;
                  setSoundOnEchoPick(newVal);
                  setSoundPreference('echo_pick', newVal);
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  soundOnEchoPick 
                    ? 'bg-[var(--color-base-accent)]' 
                    : 'bg-[var(--color-base-border)]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  soundOnEchoPick ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* 新碎片到达提示 */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-base-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-base-accent)]/10 flex items-center justify-center">
                  <Volume2 size={14} className="text-[var(--color-base-accent)]" />
                </div>
                <div>
                  <p className="text-xs font-mono text-[var(--color-base-text-bright)]">
                    新碎片到达提示
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-0.5">
                    Android 端推送新胶囊时播放
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !soundOnNewCapsule;
                  setSoundOnNewCapsule(newVal);
                  setSoundPreference('new_capsule', newVal);
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  soundOnNewCapsule 
                    ? 'bg-[var(--color-base-accent)]' 
                    : 'bg-[var(--color-base-border)]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  soundOnNewCapsule ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* 震动反馈 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-base-border)] flex items-center justify-center">
                  <Vibrate size={14} className="text-[var(--color-base-text)]" />
                </div>
                <div>
                  <p className="text-xs font-mono text-[var(--color-base-text-bright)]">
                    震动反馈
                  </p>
                  <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-0.5">
                    关键操作时震动（仅移动设备）
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !vibrationEnabled;
                  setVibrationEnabled(newVal);
                  setVibrationPreference(newVal);
                }}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  vibrationEnabled 
                    ? 'bg-[var(--color-base-accent)]' 
                    : 'bg-[var(--color-base-border)]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  vibrationEnabled ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── 基地信息 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              基地信息
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
            {loading ? (
              <LoadingSpinner />
            ) : baseInfo ? (
              <div>
                {/* 基地名称 */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-base-accent)]/20 flex items-center justify-center">
                      <Database size={14} className="text-[var(--color-base-accent)]" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-[var(--color-base-text)] opacity-60 uppercase tracking-wider">
                        基地名称
                      </p>
                      <p className="text-sm text-[var(--color-base-text-bright)] mt-0.5">
                        私人基地
                      </p>
                    </div>
                  </div>
                </div>

                {/* 胶囊总数 */}
                <div className="p-4 flex items-center justify-between border-t border-[var(--color-base-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-base-border)] flex items-center justify-center">
                      <span className="text-xs font-mono text-[var(--color-base-text-bright)]">#</span>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-[var(--color-base-text)] opacity-60 uppercase tracking-wider">
                        胶囊总数
                      </p>
                      <p className="text-sm text-[var(--color-base-text-bright)] mt-0.5">
                        {baseInfo.totalCapsules} 份
                      </p>
                    </div>
                  </div>
                </div>

                {/* 上次回港时间 */}
                <div className="p-4 flex items-center justify-between border-t border-[var(--color-base-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-base-border)] flex items-center justify-center">
                      <Clock size={14} className="text-[var(--color-base-text)]" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-[var(--color-base-text)] opacity-60 uppercase tracking-wider">
                        上次回港
                      </p>
                      <p className="text-sm text-[var(--color-base-text-bright)] mt-0.5">
                        {baseInfo.lastReturnTime 
                          ? dayjs(baseInfo.lastReturnTime).format('YYYY-MM-DD HH:mm')
                          : '暂无记录'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 同步按钮 */}
                <div className="p-4 border-t border-[var(--color-base-border)]">
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-[var(--color-base-border)] hover:bg-[var(--color-base-border-highlight)] text-[var(--color-base-text-bright)] font-mono text-xs tracking-widest transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? '同步中...' : '刷新数据'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs font-mono text-[var(--color-base-text)] opacity-60">
                  无法获取基地信息
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── 关于 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              关于
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)] p-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[var(--color-base-accent)]/10 flex items-center justify-center">
                <SettingsIcon size={28} className="text-[var(--color-base-accent)]" />
              </div>
              <h4 className="text-lg font-mono text-[var(--color-base-text-bright)] tracking-wider">
                个人基地 / 回港系统
              </h4>
              <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-60 mt-1">
                Personal Base & Return-to-Port System
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-[var(--color-base-text)] border-t border-[var(--color-base-border)] pt-4">
              <div className="flex justify-between">
                <span className="opacity-60">版本</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">构建日期</span>
                <span>2026.04</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">技术栈</span>
                <span>React + Express + SQLite</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-base-border)] text-center">
              <p className="text-[10px] font-mono text-[var(--color-base-text)] opacity-50 leading-relaxed">
                局域网闭环 · 仪式感同步 · 舱室美学
              </p>
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-mono text-[var(--color-base-text)] opacity-40">
                <span>Made with</span>
                <Heart size={10} className="text-red-400/60" />
                <span>for personal sanctuary</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 快捷导航 ── */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={14} className="text-[var(--color-base-accent)]" />
            <h3 className="text-sm font-mono text-[var(--color-base-text-bright)] tracking-widest uppercase">
              快捷导航
            </h3>
          </div>

          <div className="bg-[var(--color-base-panel)] border border-[var(--color-base-border)]">
            {[
              { label: '待办清单', path: '/todos', desc: '管理个人任务' },
              { label: '碎片墙', path: '/wall', desc: '浏览所有碎片' },
              { label: '回响池', path: '/echo', desc: '随机回忆' },
              { label: '档案馆', path: '/archive', desc: '归档与回收' },
            ].map(({ label, path, desc }, index) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full p-4 flex items-center justify-between hover:bg-[var(--color-base-border)]/30 transition-colors ${index > 0 ? 'border-t border-[var(--color-base-border)]' : ''}`}
              >
                <div className="text-left">
                  <p className="text-sm text-[var(--color-base-text-bright)]">{label}</p>
                  <p className="text-[10px] text-[var(--color-base-text)] opacity-60 mt-0.5">{desc}</p>
                </div>
                <span className="text-[var(--color-base-text)] opacity-30">›</span>
              </button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SettingsPage;