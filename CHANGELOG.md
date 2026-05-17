# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Version 0.0.2 (Current - 2026.05.12)

### Web Base (web-base/)

#### Critical Bug Fixes

- **TopNav Theme Toggle on PC**: Fixed theme toggle button not working on PC browsers. Root cause was `overflow-hidden` on the outer container clipping the ThemeButton's clickable area at the rounded edges, combined with nested `absolute inset-0` positioning intercepting clicks. Solution: removed `overflow-hidden` from outer container, moved compact state to use normal flow layout (`flex h-full`), and only applied `overflow-hidden` to the expanded state container with absolute positioning.
- **TopNav Animation Jitter**: Simplified DOM structure - removed nested wrapper div, compact state uses natural flow layout while expanded state uses absolute overlay. This eliminates z-index conflicts and ensures clean CSS width transitions.

#### UI Redesign - Phase 10: PC-First Responsive Layout

- **Home Page PC Layout**: Implemented PC-first large-screen layout (≥1024px):
  - Left column (1/3 width): Status card + Stats card + Echo preview card stacked vertically
  - Right column (2/3 width): Quick actions + Recent capsules with more horizontal space
  - Increased padding from p-4 to lg:p-8 for better breathing room on large screens
  - Mobile/tablet layout (<1024px): preserved original 12-column grid stacking pattern
- **Responsive Breakpoint Strategy**: Changed from md: (768px) to lg: (1024px) for major layout shifts, ensuring smooth transition for tablet-sized devices

### Web Base (web-base/)

#### UI Redesign - Phase 0: 主题闪烁修复（最高优先级）

- **阻塞式主题初始化脚本**：在 `index.html` `<head>` 中添加同步执行的 JavaScript，读取 localStorage 并在 CSS 渲染前设置 `data-theme` 属性，彻底消除刷新时的主题闪烁
- **阻塞脚本逻辑修正**：修复阻塞脚本与 App.tsx 初始化逻辑不一致的问题——当 localStorage 为空时，阻塞脚本默认 'night' 而 App.tsx 写入 'auto' 并计算为 'day'，导致从 night 到 day 的闪烁。现在两端逻辑完全一致：空值时写入 'auto' 并按时间计算有效主题
- **useLayoutEffect 替换 useEffect**：将 App.tsx 中主题同步的 `useEffect` 改为 `useLayoutEffect`，确保主题变更在浏览器绘制前完成，防止视觉跳变
- **移除 body transition**：移除 `body` 的 `transition: background-color` 属性，防止主题初始化时背景色的动画过渡造成可见闪烁
- **自动模式时间计算**：阻塞脚本中正确计算 'auto' 模式的有效主题（6:00-18:00 = day，其余 = night），与 React 状态逻辑一致

#### UI Redesign - Phase 1: 全局 CSS 基础重构

- **字体系统升级**：引入 Outfit 字体（现代几何无衬线）替代原有黑体栈，提升界面现代感并避免 AI 生成的 Inter 字体感
- **夜间模式强调色调整**：将 `accent` 从 `#4a7a9b`（青蓝）改为 `#5a8a7a`（青绿），降低 AI 蓝紫审美疲劳
- **胶囊类型颜色变量化**：新增 `--color-type-text`、`--color-type-image`、`--color-type-audio` 等 CSS 变量，统一管理三种胶囊类型的颜色，日间/夜间模式自动适配
- **交互式卡片系统**：新增 `.card-interactive` 工具类，提供统一的悬停上浮、按下回弹、边框高亮交互效果
- **面板微光优化**：将 `.panel::before` 微光透明度从 0.015 降低至 0.008，使深度暗示更微妙
- **移除未使用的切角样式**：删除 `.mech-panel`、`.mech-panel-right`、`.mech-door` 等 clip-path 样式，减少 CSS 冗余
- **背景光晕性能优化**：App.tsx 背景光晕模糊半径从 150px/120px 降至 100px/80px，添加 `will-change: opacity` 优化渲染性能
- **App.tsx 背景效果优化**：为背景光晕容器添加 `will-change-opacity` 类，提升动画流畅度

#### UI Redesign - Phase 2: TopNav Dynamic Island 导航重设计

- **Dynamic Island 风格导航**：将顶部导航栏从水平横条改为浮动胶囊设计，悬停展开显示所有导航项
- **滑动指示器**：使用 Framer Motion `layoutId` 实现当前页面指示器在不同导航项之间的平滑滑动动画
- **新增图标**：在 SVGs.tsx 中新增 `Echo` 和 `CheckSquare` 图标，分别用于回响和待办页面的导航标识
- **紧凑/展开双状态**：紧凑状态显示当前页面名 + LAN 状态点 + 主题图标；展开状态显示全部 6 个导航项及静默模式切换

#### UI Redesign - Phase 3: Home 归航大厅精炼

- **Bento 网格非对称布局优化**：调整列宽分配，使布局更富层次感
  - StatusCard: col-span-4（略宽，展示基地状态）
  - QuickActionsCard: col-span-5（快捷操作区）
  - StatsCard: col-span-3（统计摘要）
  - EchoPreviewCard: col-span-4（回响预览）
  - RecentCapsulesCard: col-span-8（最近碎片，更宽以展示更多）
- **MagneticButton 弹簧优化**：引入 SPRING_SNAPPY 配置（stiffness: 150, damping: 15），提升磁吸交互手感
- **PulsingDot 呼吸速度调整**：将 speed 从 2 调整为 3，使脉冲动画更柔和
- **AnimatedNumber 闪光效果**：为统计数据添加 shimmer 扫光动画，数据更具活力感
- **新增 SPRING_SNAPPY 常量**：快速弹簧动画配置，区分入场动画和交互反馈动画

#### UI Redesign - Phase 4: Wall 碎片墙精炼

- **分段筛选控件**：将类型筛选和状态筛选从普通按钮改为 iOS 风格分段控件，使用 Framer Motion `layoutId` 实现滑动指示器动画
- **空状态浮动动画**：为 EmptyState 砖墙插画添加 `animate-float` 浮动动画效果，使其更有生气
- **card-interactive 交互**：筛选按钮使用统一的交互式卡片类，增强悬停和按压反馈

#### UI Redesign - Phase 5: Echo 回响精炼

- **幽灵胶囊轨道动画**：将 6 个幽灵胶囊减少至 4 个，引入 CSS 轨道动画（ghost-orbit-1~4），30-35秒周期的缓慢漂移营造深邃氛围
- **玻璃态主卡片**：添加 `backdrop-blur-xl`、内边框高光 `border-white/5`、内阴影 `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`
- **进度指示器**：右上角显示 "MEMORY X/Y" 格式的栈位置指示
- **position delay 属性**：为每个幽灵位置添加 delay 参数，控制轨道动画的起始偏移

#### UI Redesign - Phase 6: Archive 档案馆精炼

- **粘性日期标题**：为分组日期标签添加 `sticky top-0 z-10 backdrop-blur-sm`，滚动时固定在顶部便于浏览长列表
- **右侧详情面板入场动画**：增强 `scale` 从 0.98 到 1 的过渡动画，使胶囊选择更流畅

#### UI Redesign - Phase 7: Todos 待办精炼

- **日历多点密度指示器**：将单点改为根据待办数量显示1-3个点，更直观地展示每天的待办密集程度
- ** ImportanceStars 保留**：保持现有的重要性星级显示系统

#### UI Redesign - Phase 8: Settings 设置精炼

- **窗口标题栏精简**：高度从 40px 减至 28px，添加渐变背景增强质感
- **macOS 风格窗口控制点**：红/黄/绿三色圆点按钮，悬停显示符号，关闭按钮保持原有功能

#### UI Redesign - Phase 9: 共享组件打磨

- **Toast 滑入动画**：从右侧滑入（`x: 50 → 0`）替代原来的静态显示，使用 Framer Motion spring 动画
- **Toast 进度条**：底部添加自动收缩的进度条，根据 duration 倒计时，让用户直观了解剩余显示时间
- **Toast 组件重构**：从 `<div>` 改为 `<motion.div>`，统一使用 Framer Motion 管理入场/退场动画

#### New Features

- **Todo Importance Stars**: Added 1-5 star rating system for todos. Users can now set importance level when creating/editing todos.
- **Todo Calendar View**: Added monthly calendar view to Todos page with day filtering and month navigation.
- **Recycle Bin/Trash**: Archive page now has dedicated "回收站" (Trash) tab showing soft-deleted capsules.
- **Empty Trash**: Added "清空回收站" button with confirmation dialog to permanently delete all trashed capsules.
- **Permanent Delete**: Individual capsules can be permanently deleted from trash via "永久删除" button.
- **Restore from Trash**: Trashed capsules can be restored via "恢复档案" button.
- **BaseMapView Animations**: Enhanced with spring-based hover effects, staggered entrance animations, and smooth Framer Motion pulse animations.
- **Settings Windows-Native Style**: Redesigned Settings page with Windows desktop window chrome - title bar with app icon, Settings title, and window controls (minimize, maximize, close). Draggable title bar region.
- **Settings Color Customization**: Added color picker section for Primary, Secondary, Background, and Surface colors. Custom colors persist to localStorage and apply via CSS custom properties.
- **BaseMap Visible on Home**: BaseMapView is now visible directly on Home page (not hidden in modal). Height 280px, shows 4 rooms with capsule counts and spring entrance animations. Click to open fullscreen modal with close button.
- **Unified Border Radius**: Fixed border-radius to 8px uniformly across all components. No customization option provided.
- **Image Drag-and-Drop Upload**: Added drag-and-drop support for image upload in the capture dock. Users can now drag images directly onto the upload area instead of clicking. Visual feedback shown during drag-over state with pulsing animation and "释放以上传" message.
- **Audio Recording Fix**: Fixed audio recording so that the stop button is properly displayed and clickable. Previously, clicking the record button might show an audio bar without a way to stop recording. Now the UI correctly shows "录音中 - 点击停止" when recording is active, and the same button triggers stopRecording when clicked. Also added guards to prevent duplicate recording starts.
- **Return Trace Strip Height Reduced**: The bottom return trace bar height reduced from 60px to 30px for a more compact layout.
- **Version Number Display**: Added version number (v0.0.2) in the bottom right corner of the Home page, visible in the return trace bar area.
- **Capsule Drawer Close Fix**: Fixed the drawer close button - moved it inside the header area for guaranteed clickability. No more being blocked by other elements.
- **Image Fullscreen Viewer**: Added fullscreen image preview to CapsuleDrawer with frosted glass effect. Click on any image in the drawer to view it fullscreen with a blurred glass frame.
- **Text Fullscreen Viewer**: Added fullscreen text preview to CapsuleDrawer. Click on any text content in the drawer to view it expanded in a modal with frosted glass styling.
- **TopNav Home-Only Display**: The top navigation bar (with 静默/日间/夜间切换 and settings) is now only visible on the Home page. All other pages (Wall, Echo, Archive, Todos, Settings) will not show the TopNav.

#### Bug Fixes

- Fixed Archive page filter bug where draft filter incorrectly showed deleted items.
- Soft delete properly sets `deletedAt` timestamp instead of hard delete.
- **Frontend-Backend Connection**: Added Vite proxy configuration for `/api` and `/uploads` routes. Changed `api.ts` baseURL from hardcoded `http://localhost:3000/api` to relative `/api` for proper proxy routing during development.
- **Todo Bidirectional Sync**: Fixed issue where todos created on Web Base couldn't sync to Android. Implemented complete bidirectional sync:
  - `POST /api/todos` always generates valid `localId` (format: `web_<timestamp>_<random>`)
  - `GET /api/todos` ensures legacy todos without `localId` get a fallback identifier
  - `POST /api/todos/sync` now has proper upsert logic: checks `serverId` first, then `localId`, returns full ID mapping
  - `PUT /api/todos/:id` now returns full updated todo data and broadcasts via SSE
  - `importance` field now properly synced in all endpoints
- **Todo Sync Error Display**: Android Settings screen now shows todo sync status with color-coded indicators (green=idle, blue=syncing, orange=partial, red=error)

#### API Changes

- `DELETE /api/capsules/:id` - Now soft deletes (sets `deletedAt`)
- `DELETE /api/capsules/:id/permanent` - New endpoint for permanent delete
- `DELETE /api/capsules/trash` - New endpoint to empty all trash
- `POST /api/todos` - Now accepts `importance` field (1-5)
- `PUT /api/todos/:id` - Now accepts `importance` field

---

### Android Terminal (android-terminal/)

#### New Features

- **Todo Importance Stars**: Added 1-5 star rating to `TodoEntity` and TodosScreen UI.
- **Todo Calendar View**: Added List/Calendar toggle in TodosScreen with month navigation.
- **TrashScreen**: New screen showing soft-deleted capsules with restore and permanent delete options.
- **Soft Delete**: Capsule deletion now sets `deletedAt` timestamp instead of hard delete.
- **Empty Trash**: Option to permanently delete all trashed capsules.
- **BaseMapScreen**: New base map screen showing 4 rooms (Launch Bay, Main Workstation, Auxiliary Cabin, Return Trace) with connection status and pulse animations.
- **CameraX Integration**: Full camera capture support with permission handling.
- **Quick Actions**: Edit, Archive, Delete, Echo callbacks properly wired.
- **Sync Retry Logic**: `returnToPort()` and `retryFailedCapsules()` now respect `syncRetryStrategy` setting.
- **Settings Color Customization**: Added color picker with 8 preset colors for Primary and Secondary colors. Colors persist via SharedPreferences.

#### Documentation

- **Android Build Skill**: Created comprehensive skill file at `skills/android-dev/SKILL.md` documenting development environment, build process, common issues, and troubleshooting.
- **CLI Build Commands**: Added `./gradlew assembleDebug` command to SKILL.md for pure code compilation without Android Studio.

#### Bug Fixes

- Fixed hard delete to soft delete conversion for all capsule removal.
- **Duplicate Buttons Removed**: Removed duplicate "存草稿" and "投入待回港" buttons from TextCapturePanel and ImageCapturePanel. Action buttons now only appear in the global CaptureActionBar at the bottom.
- **Database Schema Export**: Enabled Room schema export and bumped version to 2. Added `kapt` argument for schema location. This ensures proper migration support for future updates.

#### Data Model Changes

- `CapsuleEntity`: Added `deletedAt: Long?` field for soft delete
- `TodoEntity`: Added `importance: Int` field (1-5 stars) and `serverId: Int?` field for tracking server database ID
- `CapsuleDao`: Added `softDelete()`, `permanentDelete()`, `emptyTrash()`, `getDeletedCapsules()`, `restore()` methods
- `TodoDao`: Added `getTodoByServerId()`, `updateServerIdByLocalId()`, `updateByServerId()`, `updateServerIdBatch()` methods

#### Todo Sync Architecture

- **serverId Tracking**: Android now properly tracks `serverId` (server's database ID) in `TodoEntity`. This enables correct upsert operations during sync.
- **Bidirectional Sync**: `syncTodos()` now sends `serverId` with each todo, allowing server to distinguish between INSERT and UPDATE operations.
- **Fetch with Merge**: `fetchTodos()` now properly handles server updates, preserving local changes when local is newer than server.
- **Sync Status Display**: Settings screen now shows real-time todo sync status with color-coded error feedback.

---

## Version 0.0.1 (Previous - 2026.04.12)

Initial release with core functionality:

- Web Base: Express + React + SQLite with Wall, Echo, Archive pages
- Android Terminal: Kotlin + Jetpack Compose with capture, pending, organize screens
- mDNS/NSD service discovery for local network
- Return-to-dock sync mechanism
