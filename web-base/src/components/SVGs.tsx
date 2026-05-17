/**
 * SVGs.tsx - Custom SVG assets for HomeDock
 *
 * Replacing generic Lucide icons with hand-crafted SVG for:
 * - Better visual consistency across all pages
 * - Smaller bundle (inline vs library import)
 * - Unique aesthetic that avoids AI-generic look
 * - Full control over stroke width (1.5 standard)
 */

import { memo } from 'react';

// ============================================================
// ICONS - All use strokeWidth 1.5 for consistency
// ============================================================

export const Icons = {
  // Navigation & UI
  Home: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6a1 1 0 011-1h4a1 1 0 011 1v6h4a1 1 0 001-1V10" />
    </svg>
  )),

  Settings: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )),

  Moon: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )),

  Sun: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )),

  Wifi: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
    </svg>
  )),

  WifiOff: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M1 1l22 22M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01M1 6.35a11 11 0 0 1 14.08 0M16.47 7.53a6 6 0 0 1 6.95 0" />
    </svg>
  )),

  // Content types
  FileText: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )),

  Image: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )),

  Mic: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 1v22M5 5a7 7 0 0014 0M9 9v3a3 3 0 006 0V9" />
    </svg>
  )),

  MicOff: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 1l22 22M9 9a3 3 0 006 0V9M5 5a7 7 0 0014 0M12 20h.01" />
    </svg>
  )),

  // Actions
  Send: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )),

  Save: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  )),

  Trash: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  )),

  X: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )),

  // Navigation
  ArrowLeft: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )),

  ArrowRight: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )),

  // Status & Meta
  Archive: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
    </svg>
  )),

  Heart: memo(({ size = 20, fill = false, className = '' }: { size?: number; fill?: boolean; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )),

  Radio: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m8.48-2.19l-2.12-2.12a1 1 0 00-1.41 0L12 5.06l-1.41-1.41a1 1 0 00-1.41 0L7.76 5.18a1 1 0 000 1.41l2.12 2.12" />
    </svg>
  )),

  Sparkles: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" opacity="0.5" />
      <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" opacity="0.5" />
    </svg>
  )),

  Inbox: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2M6 12V5a2 2 0 012-2h8a2 2 0 012 2v7" />
    </svg>
  )),

  Shuffle: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  )),

  Repeat: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )),

  Grid: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )),

  List: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )),

  Search: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )),

  RefreshCw: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )),

  AlertCircle: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )),

  Plus: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )),

  Folder: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )),

  FolderOpen: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1M2 10h20" />
    </svg>
  )),

  Edit3: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )),

  RotateCcw: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  )),

  Check: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )),

  ExternalLink: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  )),

  Layers: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )),

  Clock: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )),

  ChevronRight: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )),

  CheckCircle: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )),

  XCircle: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )),

  Circle: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )),

  Loader: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )),

  Zap: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )),

  Monitor: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )),

  Calendar: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )),

  // Echo 图标 - 用于回响页面导航项，波浪形状象征回声
  Echo: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12c0 0 3-6 9-6s9 6 9 6" />
      <path d="M3 16c0 0 3-4 9-4s9 4 9 4" />
      <path d="M3 8c0 0 3-4 9-4s9 4 9 4" />
    </svg>
  )),

  // CheckSquare 图标 - 用于待办页面导航项，复选框形状象征任务列表
  CheckSquare: memo(({ size = 20, className = '' }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )),
};

// ============================================================
// DECORATIVE COMPONENTS
// ============================================================

// Custom grid/dot pattern for backgrounds
export const GridPattern = memo(({ size = 48, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width={size} height={size} patternUnits="userSpaceOnUse">
        <path
          d={`M ${size} 0L 0 0 0 ${size}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={opacity}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
));
GridPattern.displayName = 'GridPattern';

// Custom noise texture
export const NoiseTexture = memo(({ opacity = 0.02 }: { opacity?: number }) => (
  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity={opacity} />
  </svg>
));
NoiseTexture.displayName = 'NoiseTexture';

// Pulsing dot with ring
export const PulseDot = memo(({ size = 12, color = 'var(--color-base-accent)', ring = true }: {
  size?: number;
  color?: string;
  ring?: boolean;
}) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
    {ring && (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1px solid ${color}`,
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.4,
          animation: 'pulse-ring 2s ease-out infinite',
        }}
      />
    )}
  </span>
));
PulseDot.displayName = 'PulseDot';

// Custom wave/audio visualization bars
export const WaveBars = memo(({ count = 12, height = 40, color = 'var(--color-base-accent)', gap = 2 }: {
  count?: number;
  height?: number;
  color?: string;
  gap?: number;
}) => {
  const bars = Array.from({ length: count }, (_, i) => {
    const h = Math.abs(Math.sin(i * 0.7 + 1) * 0.6 + 0.4) * height;
    return h;
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${count * gap + count} ${height}`} preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * (gap + 1)}
          y={(height - h) / 2}
          width={1}
          height={h}
          fill={color}
          opacity={0.4 + (i % 3) * 0.15}
          rx={0.5}
        />
      ))}
    </svg>
  );
});
WaveBars.displayName = 'WaveBars';

// Decorative corner brackets
export const CornerBrackets = memo(({ size = 24, color = 'var(--color-base-border)', opacity = 0.3 }: {
  size?: number;
  color?: string;
  opacity?: number;
}) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ position: 'absolute' }}>
    <path d={`M 2 8 L 2 2 L 8 2`} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={opacity} />
    <path d={`M ${size - 8} 2 L ${size - 2} 2 L ${size - 2} 8`} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={opacity} />
    <path d={`M 2 ${size - 8} L 2 ${size - 2} L 8 ${size - 2}`} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={opacity} />
    <path d={`M ${size - 8} ${size - 2} L ${size - 2} ${size - 2} L ${size - 2} ${size - 8}`} stroke={color} strokeWidth="1" strokeLinecap="round" opacity={opacity} />
  </svg>
));
CornerBrackets.displayName = 'CornerBrackets';

// Type indicator icons
export const TypeIcon = memo(({ type, size = 16 }: { type: 'text' | 'image' | 'audio'; size?: number }) => {
  switch (type) {
    case 'text': return <Icons.FileText size={size} />;
    case 'image': return <Icons.Image size={size} />;
    case 'audio': return <Icons.Mic size={size} />;
    default: return <Icons.FileText size={size} />;
  }
});
TypeIcon.displayName = 'TypeIcon';

// Status indicator dots
export const StatusDot = memo(({ status, size = 8 }: { status: string; size?: number }) => {
  const colors: Record<string, string> = {
    draft: '#9a8545',
    pending: '#4a7a9b',
    archived: '#5a6577',
    favorited: '#3d8b7a',
    echoing: '#a78bfa',
  };

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: colors[status] || colors.pending,
      }}
    />
  );
});
StatusDot.displayName = 'StatusDot';

// Ambient glow circle
export const GlowCircle = memo(({ size = 200, color = 'var(--color-base-accent)', opacity = 0.08 }: {
  size?: number;
  color?: string;
  opacity?: number;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity,
      pointerEvents: 'none',
    }}
  />
));
GlowCircle.displayName = 'GlowCircle';

// Animated recording indicator
export const RecordingIndicator = memo(({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-base-error)" strokeWidth="2" opacity="0.3" />
    <circle cx="12" cy="12" r="6" fill="var(--color-base-error)" opacity="0.6">
      <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1s" repeatCount="indefinite" />
    </circle>
  </svg>
));
RecordingIndicator.displayName = 'RecordingIndicator';