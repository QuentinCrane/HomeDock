/**
 * ============================================================
 * API 路由模块 / API Routes Module
 * ============================================================
 * 
 * 本模块定义了 Web Base (主基地) 的所有 REST API 端点。
 * 
 * 主要功能:
 * - 胶囊 (Capsule) 的增删改查 - 用于存储文字/图片/录音
 * - 待办 (Todo) 的增删改查 - 与 Android 端同步待办事项
 * - 文件上传处理 - 支持图片等媒体文件
 * 
 * 数据流向:
 * - Android 端 → HTTP POST /api/capsules → 保存到 SQLite → SSE 广播 → Web 端实时更新
 * - Android 端 ← HTTP GET /api/capsules ← 从 SQLite 读取 ← Web 端展示
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { eventBroadcaster } from './events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保 uploads 目录存在（向上两级从 server/ 目录）
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[上传目录] 已创建:', uploadDir);
}

const router = express.Router();

// Setup Multer for file uploads

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Create a new capsule (Return to port)
router.post('/capsules', upload.single('file'), (req, res) => {
  const { type, content, timestamp, status } = req.body;
  const file = req.file;

  if (!type || !timestamp) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const fileUrl = file ? `/uploads/${file.filename}` : null;
  
  // 调试日志
  console.log('[胶囊创建]', { type, hasFile: !!file, fileUrl, timestamp });
  
  if (!file && (type === 'image' || type === 'audio')) {
    console.warn('[警告] 文件上传失败 - type:', type, ', file:', file);
  }
  
  const ts = parseInt(timestamp, 10);
  const capsuleStatus = status || 'pending';

  db.run(
    `INSERT INTO capsules (type, content, fileUrl, timestamp, status) VALUES (?, ?, ?, ?, ?)`,
    [type, content || null, fileUrl, ts, capsuleStatus],
    function (err) {
      if (err) {
        console.error('Error inserting capsule', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      const capsuleId = this.lastID;
      const message = capsuleStatus === 'draft' ? '草稿已保存' : '归档成功';
      
      // Broadcast SSE event
      eventBroadcaster.capsuleCreated({ id: capsuleId, type, content, fileUrl, timestamp: ts, status: capsuleStatus });
      
      res.json({
        success: true,
        data: {
          id: capsuleId,
          message
        }
      });
    }
  );
});

// Get all capsules with optional filters
router.get('/capsules', (req, res) => {
  const { status, type, includeDeleted } = req.query;
  let sql = `SELECT * FROM capsules`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push(`status = ?`);
    params.push(status);
  }
  if (type && type !== 'all') {
    conditions.push(`type = ?`);
    params.push(type);
  }
  if (includeDeleted !== 'true') {
    conditions.push(`deletedAt IS NULL`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }
  sql += ` ORDER BY timestamp DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching capsules', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: rows });
  });
});

// Update a capsule
router.put('/capsules/:id', (req, res) => {
  const { id } = req.params;
  const { content, status } = req.body;
  const updatedAt = Date.now();

  const updates: string[] = ['updatedAt = ?'];
  const params: any[] = [updatedAt];

  if (content !== undefined) {
    updates.push(`content = ?`);
    params.push(content);
  }
  if (status !== undefined) {
    updates.push(`status = ?`);
    params.push(status);
  }

  params.push(id);

  db.run(
    `UPDATE capsules SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        console.error('Error updating capsule', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Capsule not found' });
      }
      // Broadcast SSE event
      eventBroadcaster.capsuleUpdated({ id: parseInt(id), updatedAt });
      res.json({ success: true, data: { id, updatedAt } });
    }
  );
});

// Soft delete a capsule
router.delete('/capsules/:id', (req, res) => {
  const { id } = req.params;
  const deletedAt = Date.now();

  db.run(
    `UPDATE capsules SET deletedAt = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL`,
    [deletedAt, deletedAt, id],
    function (err) {
      if (err) {
        console.error('Error deleting capsule', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Capsule not found or already deleted' });
      }
      // Broadcast SSE event
      eventBroadcaster.capsuleDeleted(parseInt(id));
      res.json({ success: true, data: { id, deletedAt } });
    }
  );
});

// Restore a deleted capsule
router.post('/capsules/:id/restore', (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE capsules SET deletedAt = NULL, updatedAt = ? WHERE id = ? AND deletedAt IS NOT NULL`,
    [Date.now(), id],
    function (err) {
      if (err) {
        console.error('Error restoring capsule', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Capsule not found or not deleted' });
      }
      res.json({ success: true, data: { id } });
    }
  );
});

// Recapture a capsule (clone as new)
router.post('/capsules/:id/recapture', (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM capsules WHERE id = ?`, [id], (err, row: any) => {
    if (err) {
      console.error('Error fetching capsule for recapture', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'Capsule not found' });
    }

    const timestamp = Date.now();
    db.run(
      `INSERT INTO capsules (type, content, fileUrl, timestamp, status) VALUES (?, ?, ?, ?, 'pending')`,
      [row.type, row.content, row.fileUrl, timestamp],
      function (err) {
        if (err) {
          console.error('Error recapturing capsule', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({
          success: true,
          data: {
            id: this.lastID,
            message: '重新投放成功'
          }
        });
      }
    );
  });
});

// Get base status
router.get('/status', (req, res) => {
  db.get(`SELECT COUNT(*) as total, MAX(timestamp) as lastReturn FROM capsules`, [], (err, row: any) => {
    if (err) {
      console.error('Error fetching status', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({
      success: true,
      data: {
        totalCapsules: row.total || 0,
        lastReturnTime: row.lastReturn || null,
        status: 'online'
      }
    });
  });
});

// ===================== TODO ENDPOINTS =====================

// Get all todos with optional filters
router.get('/todos', (req, res) => {
  const { completed, since } = req.query;
  let sql = `SELECT * FROM todos WHERE 1=1`;
  const params: any[] = [];

  if (completed !== undefined) {
    sql += ` AND completed = ?`;
    params.push(completed === 'true' ? 1 : 0);
  }
  if (since) {
    sql += ` AND updatedAt > ?`;
    params.push(parseInt(since as string, 10));
  }

  sql += ` ORDER BY dueDate ASC, createdAt DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching todos', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    // Convert completed integer to boolean
    const todos = (rows as any[]).map(row => ({
      ...row,
      completed: Boolean(row.completed)
    }));
    res.json({ success: true, data: todos });
  });
});

// Create a new todo
router.post('/todos', (req, res) => {
  const { title, description, dueDate, localId } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const createdAt = Date.now();
  const todoLocalId = localId || `server_${createdAt}`;

  db.run(
    `INSERT INTO todos (title, description, dueDate, completed, createdAt, localId) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description || null, dueDate || null, 0, createdAt, todoLocalId],
    function (err) {
      if (err) {
        console.error('Error inserting todo', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      const todoData = {
        id: this.lastID,
        localId: todoLocalId,
        title,
        description: description || null,
        dueDate: dueDate || null,
        completed: false,
        createdAt,
        updatedAt: createdAt
      };
      // Broadcast SSE event
      eventBroadcaster.todoCreated(todoData);
      res.json({
        success: true,
        data: {
          id: this.lastID,
          localId: todoLocalId,
          createdAt,
          message: '待办已创建'
        }
      });
    }
  );
});

// Update a todo
router.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, completed, calendarEventId } = req.body;
  const updatedAt = Date.now();

  const updates: string[] = ['updatedAt = ?'];
  const params: any[] = [updatedAt];

  if (title !== undefined) {
    updates.push(`title = ?`);
    params.push(title);
  }
  if (description !== undefined) {
    updates.push(`description = ?`);
    params.push(description);
  }
  if (dueDate !== undefined) {
    updates.push(`dueDate = ?`);
    params.push(dueDate);
  }
  if (completed !== undefined) {
    updates.push(`completed = ?`);
    params.push(completed ? 1 : 0);
  }
  if (calendarEventId !== undefined) {
    updates.push(`calendarEventId = ?`);
    params.push(calendarEventId);
  }

  params.push(id);

  db.run(
    `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        console.error('Error updating todo', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Todo not found' });
      }
      // Broadcast SSE event
      eventBroadcaster.todoUpdated({ id: parseInt(id), updatedAt });
      res.json({ success: true, data: { id, updatedAt } });
    }
  );
});

// Delete a todo
router.delete('/todos/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM todos WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        console.error('Error deleting todo', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Todo not found' });
      }
      // Broadcast SSE event
      eventBroadcaster.todoDeleted(parseInt(id));
      res.json({ success: true, data: { id } });
    }
  );
});

// Sync todos (bulk create/update)
router.post('/todos/sync', (req, res) => {
  const { todos } = req.body;

  if (!Array.isArray(todos)) {
    return res.status(400).json({ success: false, message: 'todos array is required' });
  }

  const results: any[] = [];
  const now = Date.now();

  // Process each todo - either insert (if no id/serverId) or update (if has id or serverId)
  const processTodo = (todo: any, index: number) => {
    return new Promise<void>((resolve) => {
      const { id, serverId, localId, title, description, dueDate, completed } = todo;

      if (id || serverId) {
        // Update existing - use id if available, otherwise serverId
        const updateId = id || serverId;
        db.run(
          `UPDATE todos SET title = ?, description = ?, dueDate = ?, completed = ?, updatedAt = ?, syncedAt = ? WHERE id = ?`,
          [title, description || null, dueDate || null, completed ? 1 : 0, now, now, updateId],
          function (err) {
            if (!err) {
              results.push({ localId, id, action: 'updated' });
            }
            resolve();
          }
        );
      } else {
        // Insert new
        const serverLocalId = localId || `server_${now}_${index}`;
        db.run(
          `INSERT INTO todos (title, description, dueDate, completed, createdAt, updatedAt, syncedAt, localId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, description || null, dueDate || null, completed ? 1 : 0, now, now, now, serverLocalId],
          function (err) {
            if (!err) {
              results.push({ localId: serverLocalId, serverId: this.lastID, action: 'created' });
            }
            resolve();
          }
        );
      }
    });
  };

  Promise.all(todos.map((t, i) => processTodo(t, i)))
    .then(() => {
      res.json({ success: true, data: { results, syncedAt: now } });
    })
    .catch((err) => {
      console.error('Error syncing todos', err);
      res.status(500).json({ success: false, message: 'Sync error' });
    });
});

export default router;
