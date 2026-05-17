/**
 * TopNav.tsx - Dynamic Island 风格导航栏
 *
 * 交互逻辑（核心）：
 *   紧凑状态：页面名 + 状态点 + 主题按钮
 *   展开状态：所有导航项 + 静默模式 + 主题按钮
 *   主题按钮在两种状态下都存在，确保随时可切换
 *
 *   PC端：悬停展开/收起
 *   移动端：点击展开/收起
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnimation } from '../App';
import { Icons } from './SVGs';

interface TopNavProps {
  silentMode: boolean;
  onToggleSilent: () => void;
  themeMode: 'day' | 'night' | 'auto';
  effectiveTheme: 'day' | 'night';
  onThemeModeChange: (mode: 'day' | 'night' | 'auto') => void;
  isLANConnected?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: '归航大厅', icon: <Icons.Home size={14} /> },
  { path: '/wall', label: '碎片墙', icon: <Icons.Grid size={14} /> },
  { path: '/echo', label: '回响', icon: <Icons.Echo size={14} /> },
  { path: '/archive', label: '档案馆', icon: <Icons.Archive size={14} /> },
  { path: '/todos', label: '待办', icon: <Icons.CheckSquare size={14} /> },
  { path: '/settings', label: '设置', icon: <Icons.Settings size={14} /> },
];

const TopNav: React.FC<TopNavProps> = ({
  silentMode,
  onToggleSilent,
  themeMode,
  effectiveTheme,
  onThemeModeChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const location = useLocation();
  const navigate = useNavigate();
  const { motionEnabled } = useAnimation();

  const currentPath = location.pathname;
  const currentPage = navItems.find(item => item.path === currentPath)?.label || '归航大厅';

  // 主题图标
  const ThemeButton = () => {
    const icon = themeMode === 'auto'
      ? (effectiveTheme === 'day' ? <Icons.Sun size={12} /> : <Icons.Moon size={12} />)
      : (themeMode === 'day' ? <Icons.Sun size={12} /> : <Icons.Moon size={12} />);
    const label = themeMode === 'auto' ? '自动' : themeMode === 'day' ? '日间' : '夜间';
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          const next = themeMode === 'auto' ? 'day' : themeMode === 'day' ? 'night' : 'auto';
          onThemeModeChange(next);
        }}
        className="flex items-center justify-center w-6 h-6 rounded-full text-[var(--color-base-text)] hover:text-[var(--color-base-text-bright)] hover:bg-[var(--color-base-border)]/25 transition-colors"
        title={`主题: ${label}`}
        type="button"
      >
        {icon}
      </button>
    );
  };

  // PC端悬停
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current !== null) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    hoverTimeoutRef.current = window.setTimeout(() => setIsExpanded(false), 200);
  };

  // 移动端点击
  const handleToggle = () => {
    if (!isMobile) return;
    setIsExpanded(prev => !prev);
  };

  // 更新指示器
  useEffect(() => {
    if (!isExpanded) return;
    const activeItem = navItemRefs.current.get(currentPath);
    if (activeItem) {
      setIndicatorStyle({ left: activeItem.offsetLeft, width: activeItem.offsetWidth });
    }
  }, [currentPath, isExpanded]);

  return (
    <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div
        className="relative rounded-full bg-[var(--color-base-panel)]/95 backdrop-blur-md border border-[var(--color-base-border)] shadow-md overflow-hidden"
        style={{
          width: isExpanded ? (isMobile ? 320 : 460) : 180,
          height: 36,
          transition: 'width 0.2s ease-out',
        }}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 紧凑状态 - 展开时隐藏 */}
        {!isExpanded && (
          <div className="flex items-center gap-2 px-3 h-full">
            <div className={`w-2 h-2 rounded-full ${
              silentMode ? 'bg-[var(--color-base-text)]/40'
                : effectiveTheme === 'day' ? 'bg-amber-400'
                : 'bg-[var(--color-base-accent)]'
            }`}
            style={motionEnabled && !silentMode ? { boxShadow: '0 0 6px rgba(90, 138, 122, 0.5)' } : {}}
            />
            <span className="text-[11px] text-[var(--color-base-text-light)]">{currentPage}</span>
            <div className="ml-auto flex-shrink-0">
              <ThemeButton />
            </div>
          </div>
        )}

        {/* 展开状态 - 使用绝对定位覆盖整个容器 */}
        {isExpanded && (
          <div className="absolute inset-0 flex items-center px-1.5 py-1 gap-0.5 overflow-hidden rounded-full">
            <motion.div
              className="absolute top-1 bottom-1 rounded-full bg-[var(--color-base-accent)]/15"
              layoutId="nav-indicator"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  ref={(el) => { if (el) navItemRefs.current.set(item.path, el); }}
                  onClick={(e) => { e.stopPropagation(); navigate(item.path); }}
                  className={`relative flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] whitespace-nowrap
                    ${isActive ? 'text-[var(--color-base-accent)]' : 'text-[var(--color-base-text)] hover:text-[var(--color-base-text-light)]'}
                    transition-colors`}
                  type="button"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="w-px h-4 bg-[var(--color-base-border)] mx-0.5" />
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSilent(); }}
              className={`flex items-center justify-center w-6 h-6 rounded-full
                ${silentMode ? 'text-[var(--color-base-text-light)] bg-[var(--color-base-border)]/40' : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)]/25'}
                transition-colors`}
              title={silentMode ? '唤醒' : '静默'}
              type="button"
            >
              {silentMode ? <Icons.Sun size={11} /> : <Icons.Moon size={11} />}
            </button>
            <div className="w-px h-4 bg-[var(--color-base-border)] mx-0.5" />
            <ThemeButton />
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;