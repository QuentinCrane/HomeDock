# 🛰️ HomeDock

<p align="right">
  🌐 Language:
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="./assets/cover.png" width="50%" />
</p>

<p align="center">
  <b>A personal base that lives entirely inside your local network.</b><br/>
  <i>An open-source offline-first LAN playground for dorm rooms, desks, and disconnected spaces.</i>
</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-early%20but%20usable-4c8bf5">
  <img alt="license" src="https://img.shields.io/badge/license-Apache%202.0-2ea44f">
  <img alt="platform" src="https://img.shields.io/badge/platform-Web%20%2B%20Android-111827">
  <img alt="stack" src="https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20Kotlin%20%7C%20Compose-7c3aed">
  <img alt="offline" src="https://img.shields.io/badge/offline-first-0ea5e9">
  <img alt="lan" src="https://img.shields.io/badge/LAN-local%20only-f59e0b">
</p>

---

## ✨ What is HomeDock?

**HomeDock** is a dual-device system designed to run entirely inside a local network.

It is made of:

- **Web Base** — a local web app running on your computer, acting as the final home for your content.
- **Android Terminal** — a native Android app used to collect lightweight capsules such as text, images, and short audio.

It is **not**:

- a cloud product
- a serious productivity suite
- a team collaboration platform
- a traditional note-taking app

It is closer to:

- a personal base inside your dorm or room
- a tiny system that only exists in your LAN
- an offline toy with a ritualized sync experience

---

## 🧠 Core Idea

What can we still build when there is **no internet**?

HomeDock explores a simple answer:

> Build a small system that belongs only to you, and let it live entirely inside your local network.

That means:

- no accounts
- no cloud sync
- no internet dependency
- no public data flow
- no “upload to somewhere else” by default

Instead, the project focuses on:

- **LAN-first interaction**
- **offline-first collection**
- **ritualized return-to-base sync**
- **a private, low-stimulation digital space**

---

## 🔄 Core Loop

The central interaction of HomeDock is not just “upload” — it is:

> **Return to Dock**

A typical flow looks like this:

1. Capture something on your phone

   - a sentence
   - a photo
   - a short recording
2. Store it locally on Android
3. Return to the same local network
4. Let the Android app discover the Web Base
5. Tap **Return to Dock**
6. Watch the content arrive in your Web Base
7. View, organize, archive, and revisit it on desktop

This “return” loop is the heart of the project.

---

## 🧩 System Overview

### 🖥️ Web Base

The **Web Base** is the main base station running locally on your computer.

It is responsible for:

- receiving capsules from Android
- storing metadata in SQLite
- storing uploaded media locally
- providing the main desktop experience
- showing:
  - home base
  - fragment wall
  - echo
  - archive vault
  - todos
  - settings

### 📱 Android Terminal

The **Android Terminal** is the lightweight mobile side of the system.

It is responsible for:

- collecting capsules
- storing them offline first
- discovering the base on the local network
- triggering return-to-dock sync
- maintaining a local queue of pending items

Supported capsule types:

- text
- image
- audio

---

## 🚀 Features

### Current core features

- 📡 Automatic local network discovery via mDNS / NSD
- 📦 Offline-first local queue on Android
- 🔄 One-tap “Return to Dock” synchronization
- 🧱 Fragment Wall for browsing returned content
- 🎧 Support for text / image / audio capsules
- 🗂️ Archive Vault for browsing and managing stored items
- 📝 Todos page
- ⚙️ Settings page
- 🌙 Theme support (day / night / auto, depending on current implementation state)

### Experience goals

- no account needed
- no cloud dependency
- local ownership of data
- a calmer, more ritualized sync experience
- dual-device interaction that feels like “bringing things home”

---

## 🖼️ Screenshots

<p align="center">
  <img src="./assets/home.png" width="45%" />
  <img src="./assets/echo.png" width="45%" />
  <img src="./assets/wall.png" width="45%" />
  <img src="./assets/wall.png" width="45%" />
  <img src="./assets/archive.png" width="45%" />
  <img src="./assets/night.png" width="45%" />
  <img src="./assets/phone-home.png" width="30%" />
  <img src="./assets/phone-submit.png" width="30%" />
  <img src="./assets/phone-capsule.png" width="30%" />
</p>

---

## 🏗️ Architecture

For a more detailed technical route:

- [Technical Route](./assets/TECHNICAL_ROUTE.md)

### Web stack

- React
- Vite
- Node.js
- Express
- SQLite
- Tailwind CSS
- Framer Motion

### Android stack

- Kotlin
- Jetpack Compose
- Material 3
- Room
- Retrofit
- NSD / mDNS discovery

### Network / sync

- HTTP API for capsule upload
- mDNS / Bonjour / NSD for local service discovery
- SSE support exists in the codebase and is intended for real-time update feedback

---

## 📂 Project Structure

```text
.
├── web-base/
│   ├── server/
│   ├── src/
│   └── package.json
├── android-terminal/
│   ├── app/
│   └── build.gradle
├── README.md
└── README.zh-CN.md
```

---

## ⚡ Getting Started

### 1. Run the Web Base

```bash
cd web-base
npm install
npm run dev
```

This should start the local web base, including frontend and backend development services.

### 2. Run the Android Terminal

1. Open `android-terminal` in Android Studio
2. Connect a real Android device
3. Make sure the phone and computer are on the same Wi-Fi / LAN
4. Run the app

### 3. Try the full loop

- Create a capsule on Android
- Wait for the base to be discovered
- Trigger **Return to Dock**
- Check the Web Base for new content

---

## 🧪 Current Status

> **Early but usable**

What this means:

- the core dual-device flow is already present
- Android can create and store capsules locally
- the base can receive and store returned content
- the project is usable for experimentation and iteration
- the UI / UX is still evolving
- sync consistency and some edge cases are still being improved

This is an actively iterated project, not a polished final product.

---

## 🎯 Design Principles

HomeDock follows a few simple principles:

### 1. LAN-first

The system should still make sense even without internet access.

### 2. Offline-first

Create locally first. Decide later when to sync back.

### 3. Ritual over generic sync

“Return to Dock” should feel more intentional than a normal upload button.

### 4. Private by default

Content should stay in your personal network and your own devices.

### 5. Small systems are worth building

Even tiny, personal, offline systems can be meaningful and fun.

---

## 🛠️ Development Notes

Current areas of attention include:

- real-time sync feedback between Android and Web
- SSE verification and fallback strategy
- stronger UI structure and page density
- richer organization for fragments and archives
- better desktop layout utilization
- more cohesive interaction language across both ends

---

## 🗺️ Roadmap

Planned or possible next steps:

- improve real-time Web update after Android return
- richer archive and fragment organization
- better “echo” mechanics
- stronger visual system on desktop
- optional visualization layer
- more robust sync history / status feedback
- smoother empty states and editing flows

---

## 🤝 Contributing

Ideas, issues, design feedback, and pull requests are welcome.

You can contribute through:

- bug fixes
- UI / UX improvements
- sync / networking improvements
- Android experience polish
- architecture cleanup
- weird but fun experiments

This project is intentionally playful — thoughtful experiments are welcome.

---

## 📜 License

This project is licensed under the **Apache License 2.0**.

That means you are generally free to:

- use
- modify
- distribute
- build on top of it

while respecting the Apache-2.0 terms.

---

## 🌀 Final Note

HomeDock is not something you *need*.

It is something you build so that,even when the internet is gone,

> you still have a system that belongs only to you.
