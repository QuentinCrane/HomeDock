/**
 * Sidebar.tsx - 侧边导航栏组件
 * 
 * 功能说明：
 *   - 显示主基地系统的导航菜单
 *   - 高亮当前活跃页面
 *   - 提供流畅的页面切换动画
 * 
 * 导航项目：
 *   - / 主基地
 *   - /wall 碎片墙
 *   - /echo 回响池
 *   - /archive 档案馆
 * 
 * 视觉特性：
 *   - 使用 Framer Motion 的 layoutId 实现平滑的高亮过渡
 *   - 顶部显示系统状态指示灯
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, Radio, Archive } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '主基地', icon: Home },
    { path: '/wall', label: '碎片墙', icon: Grid },
    { path: '/echo', label: '回响', icon: Radio },
    { path: '/archive', label: '档案馆', icon: Archive },
  ];

  return (
    <nav className="w-64 h-screen border-r border-[var(--color-base-border)] bg-[var(--color-base-panel)] p-6 flex flex-col justify-between">
      <div>
        <div className="mb-10 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--color-base-success)] shadow-[0_0_8px_var(--color-base-success)] animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-widest text-[var(--color-base-text-light)]">BASE_SYSTEM</h1>
        </div>
        
        <ul className="space-y-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <NavLink to={item.path} className="relative block">
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[var(--color-base-accent-glow)] rounded-md border-l-2 border-[var(--color-base-accent)]"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative flex items-center gap-4 px-4 py-3 rounded-md transition-colors ${isActive ? 'text-[var(--color-base-text-light)] font-bold' : 'text-[var(--color-base-text)] hover:bg-[var(--color-base-border)] hover:text-[var(--color-base-text-light)]'}`}>
                    <Icon size={18} />
                    <span className="tracking-wider">{item.label}</span>
                  </div>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="text-xs text-gray-600 tracking-widest uppercase">
        <p>System V1.0</p>
        <p>Status: ONLINE</p>
      </div>
    </nav>
  );
};

export default Sidebar;
