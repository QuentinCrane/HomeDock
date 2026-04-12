# Technical Route / Architecture Notes

<p align="right">
  🌐 Language:
  English | <a href="./TECHNICAL_ROUTE.zh-CN.md">简体中文</a>
</p>

> Extended technical notes for **HomeDock / 归航**  
> This document is intended to live inside `assets/` or be linked from the main README.

---

## 1. Project Positioning

**HomeDock** is an offline-first, LAN-native dual-device system built around a simple idea:

> collect on mobile, return on LAN, organize on desktop.

The project is composed of two main parts:

- **Web Base** — the desktop-side local base
- **Android Terminal** — the mobile-side collector and return terminal

The system is designed for **private local use**, especially in environments where internet access is absent, unnecessary, or intentionally avoided.

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        Local LAN                            │
│                                                             │
│   ┌─────────────────┐        ┌──────────────────────────┐   │
│   │ Android         │  HTTP  │ Web Base                 │   │
│   │ Terminal        │ <───→  │ (local service)          │   │
│   │                 │  +     │                          │   │
│   │ • collect       │  SSE   │ • store capsules         │   │
│   │ • local drafts  │        │ • manage and display     │   │
│   │ • return sync   │        │ • archive and echo       │   │
│   └────────┬────────┘        └────────┬─────────────────┘   │
│            │                           │                     │
│            └──── mDNS / service discovery ─────────────────┘ │
│                    _returnport._tcp                          │
└─────────────────────────────────────────────────────────────┘
```

### Core communication layers

- **mDNS / NSD** for local service discovery
- **HTTP API** for create / update / sync operations
- **SSE** for real-time event broadcasting to web clients

---

## 3. Web Base

### Responsibilities

The Web Base acts as the center of the system. It is responsible for:

- serving the web UI
- receiving uploaded capsules from Android
- storing metadata in SQLite
- storing uploaded files in a local directory
- broadcasting update events
- presenting content through pages such as:
  - Home
  - Fragment Wall
  - Echo
  - Archive
  - Todos
  - Settings

### Main stack

- **Frontend**: React + Vite
- **Backend**: Express (Node.js)
- **Database**: SQLite
- **Realtime**: Server-Sent Events
- **Discovery**: bonjour-service (mDNS)
- **Styling**: Tailwind CSS + Framer Motion

### Main file layout

```text
web-base/
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── db.ts
│   ├── nsd.ts
│   └── events.ts
├── src/
│   ├── App.tsx
│   ├── api.ts
│   ├── sound.ts
│   ├── index.css
│   ├── pages/
│   ├── components/
│   └── hooks/
├── database.sqlite
├── uploads/
└── package.json
```

---

## 4. Android Terminal

### Responsibilities

The Android Terminal is designed as a lightweight local collector. It is responsible for:

- capturing text / image / audio capsules
- storing them locally first
- discovering the Web Base inside the LAN
- syncing pending content through the “Return to Dock” action
- keeping track of draft / pending / archived state

### Main stack

- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Database**: Room
- **Networking**: Retrofit + OkHttp
- **Architecture**: MVVM + Repository
- **State**: StateFlow + ViewModel
- **Discovery**: NsdManager

### Main file layout

```text
android-terminal/
└── app/src/main/java/com/personalbase/terminal/
    ├── TerminalApp.kt
    ├── MainActivity.kt
    ├── data/
    ├── ui/
    └── nsd/
```

---

## 5. API Surface

The current backend exposes a small REST-like API.

### Capsule endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/capsules` | GET | fetch capsule list |
| `/api/capsules` | POST | create capsule (multipart) |
| `/api/capsules/:id` | PUT | update capsule |
| `/api/capsules/:id` | DELETE | soft delete capsule |
| `/api/capsules/:id/recapture` | POST | clone capsule |
| `/api/capsules/:id/restore` | POST | restore deleted capsule |

### Todo endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/todos` | GET | fetch todos |
| `/api/todos` | POST | create todo |
| `/api/todos/sync` | POST | batch sync todos |

### System / event endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/events` | GET | SSE event stream |
| `/api/status` | GET | base status summary |

---

## 6. Data Flow

### Capsule creation and return flow

```text
[User creates capsule on Android]
        ↓
[Stored in Room]  (status: DRAFT or local pending)
        ↓
[User taps Return to Dock]
        ↓
[NsdHelper discovers _returnport._tcp]
        ↓
[Resolve service to host + port]
        ↓
[Retrofit POST /api/capsules]
        ↓
[Express stores file + metadata]
        ↓
[SSE event emitted by Web Base]
        ↓
[Local Android state updated]
```

### Why this matters

This flow gives the system three important properties:

1. **Offline-first** — content exists before sync
2. **Local ownership** — content stays on devices and LAN
3. **Low-friction return** — LAN discovery reduces manual setup

---

## 7. Service Discovery

A key part of the project is removing the need for manual IP entry in normal cases.

### Web side
The Web Base publishes a local service through mDNS / Bonjour:

- service name: `_returnport._tcp`
- port: usually `3000`

### Android side
The Android Terminal listens for services using `NsdManager`:

1. start discovery
2. wait for service found
3. resolve service
4. build base URL from resolved host + port
5. use resolved endpoint for sync

This is the mechanism that makes the “return to dock” action feel local and automatic rather than configuration-heavy.

---

## 8. Capsule State Model

The conceptual capsule lifecycle is:

```text
DRAFT
  ↓
PENDING
  ↓
ARCHIVED
  ↓
FAVORITED
```

In practice, this supports a content flow like:

- create locally
- keep as draft
- mark pending for return
- archive after successful return
- optionally favorite later

This state model is intentionally simple and easy to reason about.

---

## 9. Data Storage

### Web Base

The Web Base stores data in two places:

1. **SQLite**  
   - capsule metadata
   - todo metadata
   - status / timestamps

2. **uploads/** directory  
   - uploaded images
   - uploaded audio

### Android Terminal

The Android side stores data locally using:

- **Room database** for structured metadata
- local file paths for media assets

This separation supports a practical hybrid model:

- metadata in database
- files on disk
- sync through explicit transfer

---

## 10. Automatic Initialization

One useful quality of the current architecture is that it is designed to be easy to start.

### Web side
On first run, the system automatically creates:

- `database.sqlite`
- `uploads/`
- required tables if they do not exist

### Android side
Room creates the local database automatically during initialization.

This keeps setup friction low and makes the project easier to run for contributors.

---

## 11. Theme and UX Layer

The project is not only a data flow experiment; it also has a clear interface goal.

### UI direction
The desired interface is:

- calm
- low-stimulation
- spatial
- personal
- not dashboard-like

### Theme system
The web UI supports a theme system through CSS variables and `data-theme` switching.

Typical modes include:

- day
- night
- auto

The current implementation also allows theme changes to affect rendered visual components such as the base map.

---

## 12. Realtime Updates

The system includes an SSE layer for Web-side realtime updates.

### Event types

- `capsule:created`
- `capsule:updated`
- `capsule:deleted`
- `fallback:poll`

### Intended role of SSE

SSE is used to:

- notify connected web clients of capsule changes
- keep multiple views in sync
- reduce the need for heavy polling

There is also room for future enhancement on the Android side if full event listening is introduced later.

---

## 13. Core Design Patterns

### Repository pattern (Android)

The Android project follows a Repository structure:

```text
ViewModel → Repository → DAO → Room
```

This makes it easier to separate UI logic from storage and networking.

### Offline-first sync

The sync model is:

1. create/update locally
2. update local UI immediately
3. enqueue for sync
4. sync when LAN/base is available
5. mark as synced after confirmation

### Optimistic update (Web)

The Web UI can use optimistic updates where needed:

1. create temporary local item
2. render immediately
3. send request
4. replace / confirm on success
5. rollback if needed

---

## 14. Security Notes

This is a personal LAN-focused system, so its security model is intentionally simple.

### Current considerations

- cleartext HTTP may be enabled intentionally for local traffic
- no public internet exposure by default
- no account system / auth layer by default
- file upload validation should happen server-side
- SQL queries should use parameterized statements

This is suitable for a local personal environment, but it is not a public internet deployment model.

---

## 15. Known Limitations

Current limitations include:

- Android emulator mDNS limitations
- temporary SSE reconnect gaps
- no strong upload size constraints yet
- simple last-write-wins conflict handling
- UI / structure still under active refinement

---

## 16. Why This Technical Route?

This architecture was chosen because it balances four goals:

### 1. Local-first usability
The system should remain useful without internet access.

### 2. Minimal infrastructure
It should run on a local machine without complex deployment.

### 3. Dual-device experience
Phone and computer should have clearly different but complementary roles.

### 4. Experiment-friendly design
The codebase should be easy to evolve as the idea changes.

In other words:

> HomeDock is not trying to be a cloud product.  
> It is trying to be a small, local, personal system that actually feels alive.

---

