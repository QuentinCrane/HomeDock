/**
 * BaseMapView.tsx - 基地地图可视化组件
 * 
 * 功能说明：
 *   - SVG 绘制的基地示意图，显示四个舱室
 *   - 投放舱（Launch Bay）- 左侧
 *   - 主工作台（Main Workstation）- 中央
 *   - 辅助舱（Auxiliary Cabin）- 右侧
 *   - 回港痕迹（Return Trace）- 底部
 * 
 * 视觉特性：
 *   - 支持日间/夜间主题颜色
 *   - 显示每个舱室的胶囊数量
 *   - 活跃舱室有脉冲动画效果
 *   - 支持模态框全屏显示
 * 
 * 交互：
 *   - 点击舱室可触发 onRoomClick 回调
 *   - 模态模式下点击背景关闭
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Modal spring animation - bouncy feel
const modalSpringTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

interface RoomData {
  id: string;
  name: string;
  nameCn: string;
  status: 'active' | 'idle' | 'inactive';
  capsuleCount: number;
}

interface BaseMapViewProps {
  /** Currently active/selected room */
  activeRoom?: string | null;
  /** Callback when a room is clicked */
  onRoomClick?: (roomId: string) => void;
  /** Capsule counts per room */
  roomCapsuleCounts?: Record<string, number>;
  /** Room status map */
  roomStatuses?: Record<string, 'active' | 'idle' | 'inactive'>;
  /** Width of the map */
  width?: number;
  /** Height of the map */
  height?: number;
  /** Theme for colors */
  theme?: 'day' | 'night';
  /** Whether to render as modal overlay */
  isModal?: boolean;
  /** Whether the modal is open (required when isModal is true) */
  isOpen?: boolean;
  /** Callback when modal is closed */
  onClose?: () => void;
  /** Trigger pulse animation when new capsule arrives */
  newCapsulePulse?: boolean;
}

interface ColorPalette {
  bg: string;
  panel: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  border: string;
  borderLight: string;
  text: string;
  textLight: string;
  textBright: string;
  success: string;
  warning: string;
}

// Night theme colors (original)
const NIGHT_COLORS: ColorPalette = {
  bg: '#0b0e14',
  panel: '#0d1117',
  accent: '#4a7a9b',
  accentDim: 'rgba(74, 122, 155, 0.4)',
  accentGlow: 'rgba(74, 122, 155, 0.6)',
  border: '#161b24',
  borderLight: '#1e2530',
  text: '#4a5568',
  textLight: '#6b7a8f',
  textBright: '#a8b4c4',
  success: '#3d8b7a',
  warning: '#7a6a4a',
};

// Day theme colors (warmer, lighter)
const DAY_COLORS: ColorPalette = {
  bg: '#f5f0e8',
  panel: '#e8e2d6',
  accent: '#b07a55',
  accentDim: 'rgba(176, 122, 85, 0.4)',
  accentGlow: 'rgba(176, 122, 85, 0.5)',
  border: '#c4b8a4',
  borderLight: '#d4cabb',
  text: '#6b5d4d',
  textLight: '#8a7a66',
  textBright: '#4a3d2e',
  success: '#5a9a7a',
  warning: '#a08060',
};

const getThemeColors = (theme?: 'day' | 'night'): ColorPalette => {
  return theme === 'day' ? DAY_COLORS : NIGHT_COLORS;
};

// Room definitions with layout positions (percentages for responsive)
const ROOMS: RoomData[] = [
  { id: 'launch', name: 'Launch Bay', nameCn: '投放舱', status: 'idle', capsuleCount: 0 },
  { id: 'workstation', name: 'Main Workstation', nameCn: '主工作台', status: 'idle', capsuleCount: 0 },
  { id: 'aux', name: 'Auxiliary Cabin', nameCn: '辅助舱', status: 'idle', capsuleCount: 0 },
  { id: 'trace', name: 'Return Trace', nameCn: '回港痕迹', status: 'idle', capsuleCount: 0 },
];

// Get room color based on status
const getRoomColor = (status: RoomData['status'], isActive: boolean, colors: ColorPalette): string => {
  if (isActive) return colors.accent;
  switch (status) {
    case 'active':
      return colors.success;
    case 'idle':
      return colors.accentDim;
    case 'inactive':
    default:
      return colors.border;
  }
};

export const BaseMapView: React.FC<BaseMapViewProps> = ({
  activeRoom = null,
  onRoomClick,
  roomCapsuleCounts = {},
  roomStatuses = {},
  width = 600,
  height = 300,
  theme,
  isModal = false,
  isOpen = false,
  onClose,
  newCapsulePulse = false,
}) => {
  // Pulse animation state for new capsule arrivals
  const [pulseActive, setPulseActive] = useState(false);

  // Auto-detect theme from document attribute if not provided
  const [detectedTheme, setDetectedTheme] = useState<'day' | 'night'>(() => {
    const docTheme = document.documentElement.getAttribute('data-theme');
    return docTheme === 'day' ? 'day' : 'night';
  });

  // Listen for theme changes via MutationObserver
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          setDetectedTheme(newTheme === 'day' ? 'day' : 'night');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle pulse animation when new capsule arrives
  useEffect(() => {
    if (newCapsulePulse) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [newCapsulePulse]);

  // Use provided theme or auto-detected
  const effectiveTheme = theme ?? detectedTheme;
  const colors = getThemeColors(effectiveTheme);

  const handleRoomClick = useCallback((roomId: string) => {
    onRoomClick?.(roomId);
  }, [onRoomClick]);

  // Merge room statuses
  const roomsWithStatus = ROOMS.map(room => ({
    ...room,
    status: roomStatuses[room.id] || room.status,
    capsuleCount: roomCapsuleCounts[room.id] || 0,
  }));

  // SVG viewBox dimensions
  const viewBoxWidth = 100;
  const viewBoxHeight = 100;

  // Calculate actual pixel dimensions from percentages (based on task spec)
  // Launch Bay (left, ~320-360px), Main Workstation (center, flex), Auxiliary Cabin (right, ~280-320px), Return Trace (bottom, ~56-64px)
  const leftRoomX = 8;      // ~8% for Launch Bay area
  const centerRoomX = 38;   // ~38% for Main Workstation
  const rightRoomX = 68;    // ~68% for Auxiliary Cabin
  const mainY = 15;         // Main rooms at 15-70%
  const traceY = 75;         // Return Trace at bottom 75-95%

  // Modal content render function for reuse
  const renderMapContent = () => (
    <div
      className="relative w-full h-full bg-transparent"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for active rooms */}
          <filter id="roomGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle glow for idle rooms */}
          {/* Pulse glow filter for new capsule arrivals */}
          <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pulse overlay when new capsule arrives */}
        {pulseActive && (
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke={colors.accent}
            strokeWidth="0.5"
            opacity="0.5"
            className="animate-pulse"
          />
        )}

        {/* Background structure */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke={colors.border}
          strokeWidth="0.5"
          strokeDasharray="2,2"
          rx="1"
        />

        {/* Base outline */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          fill={colors.panel}
          fillOpacity="0.3"
          stroke={colors.borderLight}
          strokeWidth="0.3"
          rx="0.5"
        />

        {/* === Launch Bay (Left) === */}
        <motion.g
          className="map-room"
          onClick={() => handleRoomClick('launch')}
          filter={activeRoom === 'launch' ? 'url(#roomGlow)' : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04, filter: activeRoom === 'launch' ? undefined : 'url(#roomGlow)' }}
          whileTap={{ scale: 0.97 }}
          style={{ transformOrigin: `${leftRoomX + 13}px ${mainY + 15}px` }}
        >
          {/* Room background */}
          <rect
            x={leftRoomX}
            y={mainY}
            width="26"
            height="55"
            fill={colors.panel}
            fillOpacity="0.6"
            stroke={getRoomColor(roomsWithStatus[0].status, activeRoom === 'launch', colors)}
            strokeWidth={activeRoom === 'launch' ? "1" : "0.5"}
            rx="2"
          />
          {/* Room icon area */}
          <circle
            cx={leftRoomX + 13}
            cy={mainY + 15}
            r="6"
            fill="none"
            stroke={getRoomColor(roomsWithStatus[0].status, activeRoom === 'launch', colors)}
            strokeWidth="0.8"
          />
          {/* Capsule indicator dots */}
          <circle
            cx={leftRoomX + 13}
            cy={mainY + 15}
            r="2"
            fill={getRoomColor(roomsWithStatus[0].status, activeRoom === 'launch', colors)}
            fillOpacity={roomsWithStatus[0].capsuleCount > 0 ? 1 : 0.3}
          />
          {/* Room label */}
          <text
            x={leftRoomX + 13}
            y={mainY + 35}
            textAnchor="middle"
            fill={activeRoom === 'launch' ? colors.textBright : colors.textLight}
            fontSize="3"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[0].nameCn}
          </text>
          {/* Capsule count */}
          <text
            x={leftRoomX + 13}
            y={mainY + 42}
            textAnchor="middle"
            fill={colors.text}
            fontSize="2.2"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[0].capsuleCount > 0 ? `${roomsWithStatus[0].capsuleCount}` : ''}
          </text>
          {/* Active indicator pulse - Framer Motion */}
          {(activeRoom === 'launch' || roomsWithStatus[0].status === 'active') && (
            <motion.circle
              cx={leftRoomX + 13}
              cy={mainY + 15}
              r="6"
              fill="none"
              stroke={getRoomColor(roomsWithStatus[0].status, activeRoom === 'launch', colors)}
              strokeWidth="0.5"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.8, 1.4, 2], opacity: [0.6, 0.25, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.g>

        {/* === Main Workstation (Center) === */}
        <motion.g
          className="map-room"
          onClick={() => handleRoomClick('workstation')}
          filter={activeRoom === 'workstation' ? 'url(#roomGlow)' : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04, filter: activeRoom === 'workstation' ? undefined : 'url(#roomGlow)' }}
          whileTap={{ scale: 0.97 }}
          style={{ transformOrigin: `${centerRoomX + 12}px ${mainY + 14}px` }}
        >
          {/* Room background */}
          <rect
            x={centerRoomX}
            y={mainY}
            width="24"
            height="55"
            fill={colors.panel}
            fillOpacity="0.6"
            stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
            strokeWidth={activeRoom === 'workstation' ? "1" : "0.5"}
            rx="2"
          />
          {/* Room icon - workstation grid */}
          <rect
            x={centerRoomX + 7}
            y={mainY + 10}
            width="10"
            height="8"
            fill="none"
            stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
            strokeWidth="0.6"
            rx="0.5"
          />
          <line
            x1={centerRoomX + 8.5}
            y1={mainY + 12}
            x2={centerRoomX + 15.5}
            y2={mainY + 12}
            stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
            strokeWidth="0.4"
          />
          <line
            x1={centerRoomX + 8.5}
            y1={mainY + 14}
            x2={centerRoomX + 13}
            y2={mainY + 14}
            stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
            strokeWidth="0.4"
          />
          <line
            x1={centerRoomX + 8.5}
            y1={mainY + 16}
            x2={centerRoomX + 15.5}
            y2={mainY + 16}
            stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
            strokeWidth="0.4"
          />
          {/* Room label */}
          <text
            x={centerRoomX + 12}
            y={mainY + 35}
            textAnchor="middle"
            fill={activeRoom === 'workstation' ? colors.textBright : colors.textLight}
            fontSize="2.8"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[1].nameCn}
          </text>
          {/* Capsule count */}
          <text
            x={centerRoomX + 12}
            y={mainY + 42}
            textAnchor="middle"
            fill={colors.text}
            fontSize="2.2"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[1].capsuleCount > 0 ? `${roomsWithStatus[1].capsuleCount}` : ''}
          </text>
          {/* Active indicator pulse - Framer Motion */}
          {(activeRoom === 'workstation' || roomsWithStatus[1].status === 'active') && (
            <motion.circle
              cx={centerRoomX + 12}
              cy={mainY + 14}
              r="6"
              fill="none"
              stroke={getRoomColor(roomsWithStatus[1].status, activeRoom === 'workstation', colors)}
              strokeWidth="0.5"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.8, 1.4, 2], opacity: [0.6, 0.25, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.g>

        {/* === Auxiliary Cabin (Right) === */}
        <motion.g
          className="map-room"
          onClick={() => handleRoomClick('aux')}
          filter={activeRoom === 'aux' ? 'url(#roomGlow)' : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.04, filter: activeRoom === 'aux' ? undefined : 'url(#roomGlow)' }}
          whileTap={{ scale: 0.97 }}
          style={{ transformOrigin: `${rightRoomX + 12}px ${mainY + 15}px` }}
        >
          {/* Room background */}
          <rect
            x={rightRoomX}
            y={mainY}
            width="24"
            height="55"
            fill={colors.panel}
            fillOpacity="0.6"
            stroke={getRoomColor(roomsWithStatus[2].status, activeRoom === 'aux', colors)}
            strokeWidth={activeRoom === 'aux' ? "1" : "0.5"}
            rx="2"
          />
          {/* Room icon - auxiliary/storage symbol */}
          <rect
            x={rightRoomX + 7}
            y={mainY + 10}
            width="10"
            height="10"
            fill="none"
            stroke={getRoomColor(roomsWithStatus[2].status, activeRoom === 'aux', colors)}
            strokeWidth="0.6"
            rx="0.5"
          />
          <line
            x1={rightRoomX + 7}
            y1={mainY + 13.3}
            x2={rightRoomX + 17}
            y2={mainY + 13.3}
            stroke={getRoomColor(roomsWithStatus[2].status, activeRoom === 'aux', colors)}
            strokeWidth="0.4"
          />
          <line
            x1={rightRoomX + 7}
            y1={mainY + 16.6}
            x2={rightRoomX + 17}
            y2={mainY + 16.6}
            stroke={getRoomColor(roomsWithStatus[2].status, activeRoom === 'aux', colors)}
            strokeWidth="0.4"
          />
          {/* Room label */}
          <text
            x={rightRoomX + 12}
            y={mainY + 35}
            textAnchor="middle"
            fill={activeRoom === 'aux' ? colors.textBright : colors.textLight}
            fontSize="2.8"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[2].nameCn}
          </text>
          {/* Capsule count */}
          <text
            x={rightRoomX + 12}
            y={mainY + 42}
            textAnchor="middle"
            fill={colors.text}
            fontSize="2.2"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[2].capsuleCount > 0 ? `${roomsWithStatus[2].capsuleCount}` : ''}
          </text>
          {/* Active indicator pulse - Framer Motion */}
          {(activeRoom === 'aux' || roomsWithStatus[2].status === 'active') && (
            <motion.circle
              cx={rightRoomX + 12}
              cy={mainY + 15}
              r="6"
              fill="none"
              stroke={getRoomColor(roomsWithStatus[2].status, activeRoom === 'aux', colors)}
              strokeWidth="0.5"
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.8, 1.4, 2], opacity: [0.6, 0.25, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.g>

        {/* === Return Trace (Bottom) === */}
        <motion.g
          className="map-room"
          onClick={() => handleRoomClick('trace')}
          filter={activeRoom === 'trace' ? 'url(#roomGlow)' : undefined}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02, filter: activeRoom === 'trace' ? undefined : 'url(#roomGlow)' }}
          whileTap={{ scale: 0.98 }}
          style={{ transformOrigin: `${leftRoomX + 30}px ${traceY + 7}px` }}
        >
          {/* Room background - full width strip at bottom */}
          <rect
            x={leftRoomX}
            y={traceY}
            width="60"
            height="14"
            fill={colors.panel}
            fillOpacity="0.6"
            stroke={getRoomColor(roomsWithStatus[3].status, activeRoom === 'trace', colors)}
            strokeWidth={activeRoom === 'trace' ? "1" : "0.5"}
            rx="2"
          />
          {/* Trace line pattern */}
          <line
            x1={leftRoomX + 5}
            y1={traceY + 7}
            x2={leftRoomX + 55}
            y2={traceY + 7}
            stroke={getRoomColor(roomsWithStatus[3].status, activeRoom === 'trace', colors)}
            strokeWidth="0.3"
            strokeDasharray="1,1"
            opacity="0.5"
          />
          {/* Trace dots representing recent activity */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx={leftRoomX + 10 + i * 10}
              cy={traceY + 7}
              r="1.2"
              fill={getRoomColor(roomsWithStatus[3].status, activeRoom === 'trace', colors)}
              fillOpacity={0.3 + (i * 0.15)}
              animate={roomsWithStatus[3].status === 'active' || activeRoom === 'trace' ? {
                scale: [1, 1.4, 1],
                opacity: [0.3 + (i * 0.15), 0.6 + (i * 0.15), 0.3 + (i * 0.15)]
              } : {}}
              transition={{ duration: 1.5 + (i * 0.1), repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          {/* Room label */}
          <text
            x={leftRoomX + 30}
            y={traceY + 11}
            textAnchor="middle"
            fill={activeRoom === 'trace' ? colors.textBright : colors.textLight}
            fontSize="2.5"
            fontFamily="JetBrains Mono, monospace"
          >
            {roomsWithStatus[3].nameCn}
          </text>
          {/* Active indicator pulse - Framer Motion */}
          {(activeRoom === 'trace' || roomsWithStatus[3].status === 'active') && (
            <motion.circle
              cx={leftRoomX + 30}
              cy={traceY + 7}
              r="5"
              fill="none"
              stroke={getRoomColor(roomsWithStatus[3].status, activeRoom === 'trace', colors)}
              strokeWidth="0.5"
              initial={{ scale: 0.7, opacity: 0.6 }}
              animate={{ scale: [0.7, 1.5, 2.2], opacity: [0.6, 0.2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.g>

        {/* Connection lines between rooms */}
        <line
          x1={leftRoomX + 26}
          y1={mainY + 27}
          x2={centerRoomX}
          y2={mainY + 27}
          stroke={colors.border}
          strokeWidth="0.3"
          strokeDasharray="1,2"
        />
        <line
          x1={centerRoomX + 24}
          y1={mainY + 27}
          x2={rightRoomX}
          y2={mainY + 27}
          stroke={colors.border}
          strokeWidth="0.3"
          strokeDasharray="1,2"
        />
        <line
          x1={centerRoomX + 12}
          y1={mainY + 55}
          x2={centerRoomX + 12}
          y2={traceY}
          stroke={colors.border}
          strokeWidth="0.3"
          strokeDasharray="1,2"
        />
      </svg>

      {/* Tooltip/info overlay - can be extended */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );

  // If not modal, render inline
  if (!isModal) {
    return (
      <div className="w-full h-full">
        {renderMapContent()}
      </div>
    );
  }

  // Modal mode with spring animation
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={modalSpringTransition}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
          >
            <motion.div 
              className="pointer-events-auto rounded-2xl overflow-hidden max-w-4xl w-full aspect-video"
              style={{
                backgroundColor: 'var(--color-base-bg)',
                border: '1px solid var(--color-base-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large map content */}
              <div className="w-full h-full p-6">
                {renderMapContent()}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BaseMapView;