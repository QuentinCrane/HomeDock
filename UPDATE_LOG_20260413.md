# 更新日志 - Session 2026.04.13 (下午)

本次 session 修复了以下问题：

---

## 🐛 问题修复

### 1. Android App 更新后数据被清除

**问题原因**：
- `AppDatabase.kt` 使用 `fallbackToDestructiveMigration()` 
- 数据库版本停留在 1，但代码已有多处 schema 变化
- `exportSchema = false` 导致无法生成迁移脚本

**修复方案**：
- 数据库版本从 1 升级到 2
- 启用 schema 导出 (`exportSchema = true`)
- 在 `build.gradle.kts` 添加 kapt 配置：
  ```kotlin
  kapt {
      arguments {
          arg("room.schemaLocation", "$projectDir/schemas")
      }
  }
  ```

**涉及文件**：
- `android-terminal/app/src/main/java/com/personalbase/terminal/data/AppDatabase.kt`
- `android-terminal/app/build.gradle.kts`

---

### 2. 前端页面无法连接后端基地服务

**问题原因**：
- `vite.config.ts` 缺少代理配置
- `api.ts` 使用硬编码 `http://localhost:3000/api`
- 开发时前端运行在 5173 端口，后端在 3000 端口，跨端口请求失败

**修复方案**：
- 在 `vite.config.ts` 添加 proxy 配置：
  ```typescript
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  }
  ```
- `api.ts` baseURL 改为相对路径 `/api`
- `createCapsule` 函数中的 XHR 上传 URL 改为 `/api/capsules`

**涉及文件**：
- `web-base/vite.config.ts`
- `web-base/src/api.ts`

---

### 3. Android 采集页面内部重复按钮

**问题原因**：
- `TextCapturePanel` 和 `ImageCapturePanel` 内部各自有一套"存草稿"和"投入待回港"按钮
- 全局 `CaptureActionBar` 也有一套相同的按钮
- 导致同一功能出现两套按钮

**修复方案**：
- 删除 `TextCapturePanel` 底部的按钮 Row
- 删除 `ImageCapturePanel` 底部的按钮 Row
- 保留全局 `CaptureActionBar` 作为唯一的操作入口

**涉及文件**：
- `android-terminal/app/src/main/java/com/personalbase/terminal/ui/screens/CaptureScreen.kt`

---

## 📚 文档更新

### Android 构建文档增强

**更新内容**：
- 在 `SKILL.md` 新增 CLI 构建命令：
  ```bash
  cd E:\Github Program\HomeDock\android-terminal
  .\gradlew.bat assembleDebug --no-daemon
  ```
- 现在可以完全不需要 Android Studio，纯命令行编译 APK

**涉及文件**：
- `C:\Users\CyanCrane\.config\opencode\skills\android-dev\SKILL.md`

---

## ✅ 构建验证

| 项目 | 状态 | 详情 |
|------|------|------|
| Android APK | ✅ 成功 | `app-debug.apk` (17 MB) |
| Web Build | ✅ 成功 | 812ms，无错误 |

---

## 🔧 下次构建命令

### Android APK（纯代码编译）
```bash
cd E:\Github Program\HomeDock\android-terminal
.\gradlew.bat assembleDebug --no-daemon
```

### Web 开发服务器
```bash
cd E:\Github Program\HomeDock\web-base
npm run dev
```

---

## 📝 CHANGELOG 更新

所有修改已同步到项目根目录 `CHANGELOG.md`
