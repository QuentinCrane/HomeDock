# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HomeDock is a dual-device LAN-first system: a **Web Base** (Express + React) running on a computer and an **Android Terminal** (Kotlin + Compose) for capturing capsules (text/image/audio). The central interaction is "Return to Dock" — syncing capsules from Android to Web Base when on the same network.

## Development Commands

### Web Base (`web-base/`)
```bash
cd web-base
npm install
npm run dev          # Runs both Vite (port 5173) and Express API (port 3000) concurrently
npm run dev:client    # Vite frontend only
npm run dev:server    # Express API only (tsx with nodemon watching server/)
npm run build         # TypeScript compile + Vite production build
npm run lint          # ESLint
npm run preview       # Preview production build (vite preview)
```

### Android Terminal (`android-terminal/`)
- Open in Android Studio, sync Gradle, and run on a physical device (not emulator — NSD/mDNS doesn't work on emulator)
- Min SDK 26, Target SDK 34, JVM 17
- Build APK: `cd android-terminal && ./gradlew assembleDebug`

## Architecture

### Web Base Stack
- **Frontend**: React 19 + Vite 8 + React Router 7 + Tailwind CSS 4 + Framer Motion 12
- **Backend**: Express 5 + TypeScript (tsx for dev, compiled for prod)
- **Database**: SQLite (`database.sqlite` in project root, managed in `web-base/server/db.ts`)
- **Real-time**: SSE (`/api/events`) via `web-base/server/events.ts` EventBroadcaster singleton
- **File uploads**: Multer to `uploads/` directory, served statically at `/uploads/`
- **Discovery**: Bonjour-service (`web-base/server/nsd.ts`) advertises the base on LAN

### Web Base API Design
- Express router in `web-base/server/routes.ts` mounted at `/api`
- All responses follow `{ success: true, data: ... }` or `{ success: false, message: "..." }` shape
- SSE events broadcast capsule/todo CRUD changes to all connected clients
- Database schema has two tables: `capsules` (type, content, fileUrl, timestamp, status, deletedAt) and `todos` (title, description, dueDate, completed, localId, syncedAt, importance)
- Soft delete on capsules sets `deletedAt` timestamp; permanent delete uses `/permanent` endpoint
- Todo sync supports both `localId` (client-generated) and `serverId` with upsert logic

### Android Terminal Stack
- Kotlin + Jetpack Compose + Material 3
- Room database (`data/`) for offline-first capsule/todo storage
- Retrofit + OkHttp for HTTP API calls to Web Base
- NsdHelper (`nsd/`) wraps Android NSD for mDNS discovery of Web Base
- CameraX for image/audio capture
- Sync strategy: local queue → discover base via mDNS → POST capsules → confirm sync

### Cross-Cutting Concerns
- NSD/Bonjour/mDNS service type: `_homedock._tcp.local.` — used by both Android (discovery) and Web Base (advertisement)
- All timestamps are Unix ms from client; server converts toms where needed
- Capsules have statuses: `draft`, `pending`, `archived`, `echoing`
- The `localId` field on todos enables cross-device sync without ID conflicts

## Key File Locations

| Purpose | Web Base | Android |
|---|---|---|
| API routes | `server/routes.ts` | — |
| SSE events | `server/events.ts` | — |
| DB schema/migrations | `server/db.ts` | `data/` (Room) |
| NSD/mDNS | `server/nsd.ts` | `nsd/NsdHelper.kt` |
| Repository pattern | — | `data/TodoRepository.kt` |
| ViewModel | — | `ui/MainViewModel.kt` |
| Screens | `src/pages/` | `ui/screens/` |

## Running Tests
- No test framework currently configured in either project
- Manual testing via: create capsule on Android → Return to Dock → verify in Web Base wall/archive

## Build Artifacts
- Web production build outputs to `web-base/dist/`
- Android debug APK: `android-terminal/app/build/outputs/apk/debug/`
- SQLite DB: `database.sqlite` (gitignored, created at runtime)