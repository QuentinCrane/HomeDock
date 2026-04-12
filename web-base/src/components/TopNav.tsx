/**
 * TopNav.tsx - 顶部导航栏组件
 * 
 * 功能说明：
 *   - 显示当前页面名称和基地状态
 *   - 提供静默模式切换按钮
 *   - 提供主题模式切换（日间/夜间/自动）
 *   - 显示 LAN 连接状态
 *   - 提供设置页面入口
 * 
 * 状态管理：
 *   - silentMode: 静默模式状态（由父组件传入）
 *   - themeMode: 主题模式（由父组件控制）
 *   - motionEnabled: 动画开关（从 AnimationContext 获取）
 * 
 * 用户交互：
 *   - 点击静默按钮：切换静默模式
 *   - 点击主题按钮：循环切换日间/夜间/自动
 *   - 点击设置按钮：导航到设置页面
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Settings, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimation } from '../App';

interface TopNavProps {
  silentMode: boolean;
  onToggleSilent: () => void;
  themeMode: 'day' | 'night' | 'auto';
  effectiveTheme: 'day' | 'night';
  onThemeModeChange: (mode: 'day' | 'night' | 'auto') => void;
  isLANConnected?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({
  silentMode,
  onToggleSilent,
  themeMode,
  effectiveTheme,
  onThemeModeChange,
  isLANConnected = true,
}) => {
  // Show icon based on effective theme (actual day/night, not mode)
  const getThemeIcon = () => {
    if (themeMode === 'auto') {
      return effectiveTheme === 'day' ? <Sun size={11} /> : <Moon size={11} />;
    }
    return themeMode === 'day' ? <Sun size={11} /> : <Moon size={11} />;
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'auto': return '自动';
      case 'day': return '日间';
      case 'night': return '夜间';
    }
  };

  const handleThemeClick = () => {
    const nextMode = themeMode === 'auto' ? 'day' : themeMode === 'day' ? 'night' : 'auto';
    onThemeModeChange(nextMode);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const { motionEnabled } = useAnimation();

  // Get current page name from path
  const getPageName = (path: string) => {
    switch (path) {
      case '/': return '归航大厅';
      case '/wall': return '碎片墙';
      case '/echo': return '回响';
      case '/archive': return '档案馆';
      case '/todos': return '待办';
      case '/settings': return '设置';
      default: return '归航大厅';
    }
  };

  const currentPage = getPageName(location.pathname);

  return (
    <header className="h-10 bg-[var(--color-base-panel)]/95 backdrop-blur-sm border-b border-[var(--color-base-border)] z-50 px-4 flex items-center justify-between">
      {/* Left: Project name / current space */}
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            silentMode
              ? 'bg-[var(--color-base-text)]/40'
              : effectiveTheme === 'day'
                ? 'bg-amber-400'
                : 'bg-[var(--color-base-accent)]'
          }`}
          animate={motionEnabled && !silentMode ? {
            boxShadow: [
              '0 0 4px rgba(74, 122, 155, 0.4)',
              '0 0 8px rgba(74, 122, 155, 0.6)',
              '0 0 4px rgba(74, 122, 155, 0.4)',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[11px] font-mono tracking-[0.15em] text-[var(--color-base-text-light)]">
          <span className="opacity-50">私人基地</span>
          <span className="mx-2 opacity-30">/</span>
          <span className="text-[var(--color-base-text-bright)]">{currentPage}</span>
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* Silent mode toggle */}
        <motion.button
          onClick={onToggleSilent}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono ${
            motionEnabled ? 'transition-all duration-200' : ''
          } ${
            silentMode
              ? 'text-[var(--color-base-text-light)] bg-[var(--color-base-border)]/50'
              : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30'
          }`}
          title={silentMode ? '唤醒' : '静默'}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {silentMode ? <Sun size={11} /> : <Moon size={11} />}
          <span className="hidden sm:inline">{silentMode ? '唤醒' : '静默'}</span>
        </motion.button>

        {/* Theme mode toggle */}
        <motion.button
          onClick={handleThemeClick}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono ${
            motionEnabled ? 'transition-all duration-200' : ''
          } text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30`}
          title={`当前: ${getThemeLabel()}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {getThemeIcon()}
          <span className="hidden sm:inline">{getThemeLabel()}</span>
        </motion.button>

        {/* Separator */}
        <div className="w-px h-4 bg-[var(--color-base-border)] mx-1" />

        {/* LAN Status */}
        <div className="flex items-center gap-1.5 px-2 py-1">
          {isLANConnected ? (
            <Wifi size={11} className="text-[var(--color-base-success)]" />
          ) : (
            <WifiOff size={11} className="text-[var(--color-base-text)]/40" />
          )}
          <span className="text-[9px] font-mono text-[var(--color-base-text)]/50 tracking-widest">LAN</span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-[var(--color-base-border)] mx-1" />

        {/* Settings */}
        <motion.button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono ${
            motionEnabled ? 'transition-all duration-200' : ''
          } text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)] hover:bg-[var(--color-base-border)]/30`}
          title="设置"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings size={11} />
          <span className="hidden sm:inline">设置</span>
        </motion.button>
      </div>
    </header>
  );
};

export default TopNav;