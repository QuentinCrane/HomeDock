# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Version 0.0.2 (Current - 2026.04.13)

### Web Base (web-base/)

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
- `TodoEntity`: Added `importance: Int` field (1-5 stars)
- `CapsuleDao`: Added `softDelete()`, `permanentDelete()`, `emptyTrash()`, `getDeletedCapsules()`, `restore()` methods

---

## Version 0.0.1 (Previous - 2026.04.12)

Initial release with core functionality:

- Web Base: Express + React + SQLite with Wall, Echo, Archive pages
- Android Terminal: Kotlin + Jetpack Compose with capture, pending, organize screens
- mDNS/NSD service discovery for local network
- Return-to-dock sync mechanism
