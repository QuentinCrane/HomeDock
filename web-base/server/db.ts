/**
 * ============================================================
 * 数据库模块 / Database Module
 * ============================================================
 * 
 * 本模块负责 SQLite 数据库的初始化和连接管理。
 * 数据库文件存储在项目根目录: database.sqlite
 * 
 * 数据库表结构:
 * 
 * 1. capsules (胶囊表)
 *    - 存储用户创建的胶囊数据
 *    - type: 胶囊类型 - text(文字), image(图片), audio(录音)
 *    - content: 文字内容或文件路径
 *    - status: 状态 - draft(草稿), pending(待回港), archived(已归档), favorited(收藏)
 *    - timestamp: 客户端创建时间戳
 *    - deletedAt: 软删除标记 (为 NULL 表示未删除)
 * 
 * 2. todos (待办表)
 *    - 存储待办事项，支持与 Android 端同步
 *    - title: 待办标题
 *    - description: 详细描述
 *    - dueDate: 截止日期时间戳
 *    - completed: 是否完成 (0/1)
 *    - localId: 客户端本地 ID，用于同步
 *    - syncedAt: 最后同步时间戳
 * 
 * 迁移策略:
 * - 使用 ALTER TABLE ADD COLUMN 处理新增字段
 * - 忽略"列已存在"错误，确保向后兼容
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 sqlite3.verbose() 获取更好的堆栈跟踪
const sqlite = sqlite3.verbose();

// 数据库文件位于项目根目录
const dbPath = path.resolve(__dirname, '../../database.sqlite');

// 创建数据库连接
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    
    // ========================================
    // 初始化胶囊表 (capsules)
    // ========================================
    db.run(`
      CREATE TABLE IF NOT EXISTS capsules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'text', 'image', 'audio'
        content TEXT,
        fileUrl TEXT,
        timestamp INTEGER NOT NULL,
        createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
        status TEXT DEFAULT 'pending', -- 'draft', 'pending', 'archived', 'favorited'
        updatedAt INTEGER,
        deletedAt INTEGER
      )
    `);

    // 迁移：为已有数据库添加新字段
    db.run(`ALTER TABLE capsules ADD COLUMN status TEXT DEFAULT 'pending'`, (err) => {
      // 列可能已存在，忽略错误
    });
    db.run(`ALTER TABLE capsules ADD COLUMN updatedAt INTEGER`, (err) => {
      // 列可能已存在，忽略错误
    });
    db.run(`ALTER TABLE capsules ADD COLUMN deletedAt INTEGER`, (err) => {
      // 列可能已存在，忽略错误
    });

    // ========================================
    // 初始化待办表 (todos)
    // ========================================
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        dueDate INTEGER,
        completed INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
        updatedAt INTEGER,
        syncedAt INTEGER,
        localId TEXT,
        calendarEventId TEXT,
        importance INTEGER DEFAULT 0
      )
    `);

    // 迁移：为已有数据库添加新字段
    db.run(`ALTER TABLE todos ADD COLUMN description TEXT`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN dueDate INTEGER`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN completed INTEGER DEFAULT 0`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN updatedAt INTEGER`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN syncedAt INTEGER`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN localId TEXT`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN calendarEventId TEXT`, (err) => {});
    db.run(`ALTER TABLE todos ADD COLUMN importance INTEGER DEFAULT 0`, (err) => {});
  }
});
