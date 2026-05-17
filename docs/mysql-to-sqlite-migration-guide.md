# 从 MySQL 迁移到 SQLite 教程

> 基于 HomeDock 项目的实战经验，详细讲解如何将一个 Node.js + Express 项目从 MySQL 迁移到 SQLite。

---

## 目录

1. [核心差异：MySQL vs SQLite](#1-核心差异mysql-vs-sqlite)
2. [安装与依赖替换](#2-安装与依赖替换)
3. [数据库连接模块改造](#3-数据库连接模块改造)
4. [建表与迁移策略](#4-建表与迁移策略)
5. [SQL 语法差异与适配](#5-sql-语法差异与适配)
6. [API 路由层改造](#6-api-路由层改造)
7. [启动流程：为什么不需要单独启动数据库](#7-启动流程为什么不需要单独启动数据库)
8. [常见陷阱与注意事项](#8-常见陷阱与注意事项)
9. [完整文件对照表](#9-完整文件对照表)

---

## 1. 核心差异：MySQL vs SQLite

| 维度 | MySQL | SQLite |
|---|---|---|
| 架构 | 客户端-服务器，需要独立进程 | 嵌入式，直接读写磁盘文件 |
| 安装 | 需安装 MySQL Server、配置用户/密码 | `npm install sqlite3` 即可，无需任何服务端 |
| 启动 | 需先 `mysql.server start` 或系统服务 | 随应用启动自动打开/创建文件 |
| 连接方式 | `host + port + user + password + database` | 一个文件路径，如 `./database.sqlite` |
| 并发写入 | 支持多连接并发写入 | 同一时刻只有一个写入者（库级锁） |
| 数据类型 | 严格类型系统（INT, VARCHAR, DATETIME...） | 动态类型（TEXT, INTEGER, REAL, BLOB, NULL） |
| 自增主键 | `AUTO_INCREMENT` | `AUTOINCREMENT`（或直接 `INTEGER PRIMARY KEY`） |
| 布尔类型 | `BOOLEAN` / `TINYINT(1)` | 无原生布尔，用 `INTEGER` 的 0/1 表示 |
| 日期时间 | `DATETIME`, `TIMESTAMP` | 无日期类型，用 `INTEGER`（Unix 时间戳）或 `TEXT`（ISO 字符串） |
| 部署复杂度 | 高（需运维数据库服务） | 零（数据库就是一个文件） |

**最关键的一点**：SQLite 不需要任何后台服务进程，数据库就是一个普通文件。这意味着你不需要安装、配置、启动任何数据库服务，应用启动时自动完成一切。

---

## 2. 安装与依赖替换

### 2.1 移除 MySQL 依赖

```bash
npm uninstall mysql2
# 如果你用的是其他 MySQL 驱动，对应卸载：
# npm uninstall mysql
# npm uninstall knex mysql2   # 如果用了 query builder
```

### 2.2 安装 SQLite 依赖

```bash
npm install sqlite3
npm install -D @types/sqlite3
```

`sqlite3` 是 Node.js 的原生绑定包，安装时会自动编译对应平台的 C 库，不需要你手动安装 SQLite。

### 2.3 对应文件路径

| 操作 | 文件 |
|---|---|
| 依赖声明 | `web-base/package.json` 的 `dependencies` 和 `devDependencies` |
| 类型声明 | `web-base/package.json` 中 `"@types/sqlite3": "^3.1.11"` |

HomeDock 的 `package.json` 相关部分：

```json
{
  "dependencies": {
    "sqlite3": "^6.0.1"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.11"
  }
}
```

---

## 3. 数据库连接模块改造

这是迁移的核心步骤。你需要把 MySQL 的连接池/连接对象替换为 SQLite 的数据库实例。

### 3.1 MySQL 的写法（迁移前）

```typescript
// mysql 连接方式
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'your_password',
  database: 'homedock',
  waitForConnections: true,
  connectionLimit: 10,
});

export { pool };
```

### 3.2 SQLite 的写法（迁移后）

对应文件：`web-base/server/db.ts`

```typescript
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用 verbose() 获取更好的错误堆栈跟踪（开发阶段推荐）
const sqlite = sqlite3.verbose();

// 数据库文件路径 —— 指向项目根目录的 database.sqlite
const dbPath = path.resolve(__dirname, '../../database.sqlite');

// 创建数据库连接
// 如果文件不存在，SQLite 会自动创建
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    // 建表和迁移逻辑放在这里（见下一节）
  }
});
```

### 3.3 关键差异说明

| 项目 | MySQL | SQLite |
|---|---|---|
| 连接对象 | 连接池 `pool` | 单个数据库实例 `db` |
| 连接参数 | host, port, user, password, database | 仅一个文件路径 |
| 文件不存在时 | 报错，需手动建库 | **自动创建空数据库文件** |
| 调试模式 | 无 | `sqlite3.verbose()` 开启详细堆栈 |
| 导出方式 | `export { pool }` | `export { db }` |

### 3.4 路径解析说明

HomeDock 使用 ESM（`"type": "module"`），没有 Node.js 内置的 `__dirname`，需要手动构造：

```typescript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// db.ts 位于 web-base/server/db.ts
// database.sqlite 位于项目根目录
// 所以从 db.ts 出发需要向上两级: ../../database.sqlite
const dbPath = path.resolve(__dirname, '../../database.sqlite');
```

如果你的项目使用 CommonJS（`require`），可以直接用 `__dirname`：

```typescript
const dbPath = path.resolve(__dirname, '../../database.sqlite');
```

---

## 4. 建表与迁移策略

### 4.1 MySQL 的建表方式（迁移前）

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  content TEXT,
  fileUrl VARCHAR(500),
  timestamp BIGINT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME
);
```

### 4.2 SQLite 的建表方式（迁移后）

对应文件：`web-base/server/db.ts` 第 56-68 行

```sql
CREATE TABLE IF NOT EXISTS capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  content TEXT,
  fileUrl TEXT,
  timestamp INTEGER NOT NULL,
  createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
  status TEXT DEFAULT 'pending',
  updatedAt INTEGER,
  deletedAt INTEGER
)
```

### 4.3 语法差异对照

| MySQL | SQLite | 说明 |
|---|---|---|
| `INT AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` | SQLite 自增语法不同 |
| `VARCHAR(n)` | `TEXT` | SQLite 无长度限制的字符串类型 |
| `BIGINT` | `INTEGER` | SQLite 只有 INTEGER，无大小之分 |
| `DATETIME` | `INTEGER`（存 Unix 时间戳） | SQLite 推荐用整数存时间 |
| `CURRENT_TIMESTAMP` | `(cast(strftime('%s','now') as int) * 1000)` | SQLite 获取毫秒时间戳 |
| `ON UPDATE CURRENT_TIMESTAMP` | 无自动更新，需应用层手动设置 | SQLite 不支持自动更新时间 |

### 4.4 迁移策略：ALTER TABLE ADD COLUMN

HomeDock 采用的迁移方式是：建表后立即执行 `ALTER TABLE ADD COLUMN`，并忽略"列已存在"的错误。

对应文件：`web-base/server/db.ts` 第 71-108 行

```typescript
// 建表
db.run(`CREATE TABLE IF NOT EXISTS capsules (...)`);

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
```

**为什么这样做**：

- SQLite 不支持 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 语法
- 当数据库文件已存在（老用户升级），新字段需要通过 ALTER 添加
- 当数据库文件不存在（新用户），CREATE TABLE 已经包含了所有字段，ALTER 会报"列已存在"错误，忽略即可
- 这种方式简单粗暴但有效，适合小型项目

**MySQL 的迁移方式对比**：

```sql
-- MySQL 通常用专门的迁移工具或脚本
ALTER TABLE capsules ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
-- MySQL 会直接报错如果列已存在，不会静默忽略
```

### 4.5 todos 表完整示例

对应文件：`web-base/server/db.ts` 第 84-108 行

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  dueDate INTEGER,
  completed INTEGER DEFAULT 0,        -- 布尔用 0/1 整数表示
  createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000),
  updatedAt INTEGER,
  syncedAt INTEGER,
  localId TEXT,                        -- 客户端本地 ID，用于跨设备同步
  calendarEventId TEXT,
  importance INTEGER DEFAULT 0
)
```

---

## 5. SQL 语法差异与适配

### 5.1 查询方法对照

MySQL（使用 `mysql2/promise`）和 SQLite（使用 `sqlite3`）的 API 风格完全不同：

| 操作 | MySQL (Promise) | SQLite (Callback) |
|---|---|---|
| 查询多行 | `const [rows] = await pool.query(sql, params)` | `db.all(sql, params, (err, rows) => {})` |
| 查询单行 | `const [rows] = await pool.query(sql, params)` | `db.get(sql, params, (err, row) => {})` |
| 执行写操作 | `const [result] = await pool.execute(sql, params)` | `db.run(sql, params, function(err) {})` |
| 获取自增ID | `result.insertId` | `this.lastID` |
| 获取影响行数 | `result.affectedRows` | `this.changes` |

### 5.2 参数占位符

| 数据库 | 占位符 | 示例 |
|---|---|---|
| MySQL | `?` 或 `:name` | `SELECT * FROM users WHERE id = ?` |
| SQLite | `?` 或 `$name` | `SELECT * FROM users WHERE id = ?` |

两者都支持 `?` 占位符，迁移时通常不需要改动。

### 5.3 布尔值处理

MySQL 有 `BOOLEAN` 类型（底层是 `TINYINT(1)`），SQLite 没有布尔类型。

**写入时**：需要手动将 `true/false` 转为 `1/0`

```typescript
// MySQL 写法
await pool.execute('INSERT INTO todos (completed) VALUES (?)', [true]);

// SQLite 写法
db.run('INSERT INTO todos (completed) VALUES (?)', [completed ? 1 : 0]);
```

**读取时**：需要手动将 `0/1` 转回 `true/false`

```typescript
// SQLite 读取后转换
const todos = rows.map(row => ({
  ...row,
  completed: Boolean(row.completed),  // 0 → false, 1 → true
}));
```

对应文件：`web-base/server/routes.ts` 第 407-412 行

### 5.4 日期时间处理

MySQL 有 `DATETIME` 类型，SQLite 推荐用整数存 Unix 时间戳。

```typescript
// MySQL 写法
await pool.execute(
  'INSERT INTO capsules (createdAt) VALUES (NOW())'
);

// SQLite 写法 —— 应用层生成时间戳
const timestamp = Date.now();  // 毫秒级 Unix 时间戳
db.run('INSERT INTO capsules (createdAt) VALUES (?)', [timestamp]);
```

默认值差异：

```sql
-- MySQL
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

-- SQLite（毫秒时间戳）
createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int) * 1000)

-- SQLite（秒级时间戳）
createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int))
```

### 5.5 软删除实现

两种数据库的软删除逻辑相同，都是设置 `deletedAt` 字段：

```typescript
// 软删除 —— 两种数据库 SQL 语法完全一致
db.run(
  `UPDATE capsules SET deletedAt = ?, updatedAt = ? WHERE id = ? AND deletedAt IS NULL`,
  [deletedAt, deletedAt, id]
);

// 查询时排除已删除记录
db.all(`SELECT * FROM capsules WHERE deletedAt IS NULL`);
```

对应文件：`web-base/server/routes.ts` 第 170-190 行

---

## 6. API 路由层改造

### 6.1 从 async/await 改为回调风格

MySQL 的 `mysql2/promise` 天然支持 `async/await`，但 `sqlite3` 原生是回调风格。这是路由层改造最大的工作量。

#### MySQL 写法（迁移前）

```typescript
router.post('/capsules', async (req, res) => {
  const { type, content, timestamp } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO capsules (type, content, timestamp, status) VALUES (?, ?, ?, ?)',
      [type, content, timestamp, 'pending']
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});
```

#### SQLite 写法（迁移后）

对应文件：`web-base/server/routes.ts` 第 53-96 行

```typescript
router.post('/capsules', upload.single('file'), (req, res) => {
  const { type, content, timestamp, status } = req.body;

  db.run(
    `INSERT INTO capsules (type, content, fileUrl, timestamp, status) VALUES (?, ?, ?, ?, ?)`,
    [type, content || null, fileUrl, ts, capsuleStatus],
    function (err) {                          // 注意：必须用 function，不能用箭头函数
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      const capsuleId = this.lastID;          // 通过 this.lastID 获取自增 ID
      res.json({ success: true, data: { id: capsuleId } });
    }
  );
});
```

**关键点**：`db.run` 的回调必须用 `function` 声明，不能用箭头函数，因为 `this.lastID` 和 `this.changes` 依赖 `this` 绑定。

### 6.2 查询多行：db.all

对应文件：`web-base/server/routes.ts` 第 99-129 行

```typescript
router.get('/capsules', (req, res) => {
  const { status, type, includeDeleted } = req.query;
  let sql = `SELECT * FROM capsules`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push(`status = ?`);
    params.push(status);
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
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: rows });
  });
});
```

### 6.3 查询单行：db.get

对应文件：`web-base/server/routes.ts` 第 250 行

```typescript
db.get(`SELECT * FROM capsules WHERE id = ?`, [id], (err, row: any) => {
  if (err) {
    return res.status(500).json({ success: false, message: 'Database error' });
  }
  if (!row) {
    return res.status(404).json({ success: false, message: 'Capsule not found' });
  }
  // 使用 row...
});
```

### 6.4 更新操作与 this.changes

对应文件：`web-base/server/routes.ts` 第 132-167 行

```typescript
router.put('/capsules/:id', (req, res) => {
  const { id } = req.params;
  const updatedAt = Date.now();

  db.run(
    `UPDATE capsules SET updatedAt = ?, content = ?, status = ? WHERE id = ?`,
    [updatedAt, content, status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (this.changes === 0) {           // this.changes = 影响的行数
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      res.json({ success: true, data: { id, updatedAt } });
    }
  );
});
```

### 6.5 复杂操作：嵌套回调

对应文件：`web-base/server/routes.ts` 第 247-278 行（重新投放功能）

先查后写的嵌套回调模式：

```typescript
router.post('/capsules/:id/recapture', (req, res) => {
  const { id } = req.params;

  // 第一步：查询原始数据
  db.get(`SELECT * FROM capsules WHERE id = ?`, [id], (err, row: any) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });

    // 第二步：用原始数据创建新记录
    const timestamp = Date.now();
    db.run(
      `INSERT INTO capsules (type, content, fileUrl, timestamp, status) VALUES (?, ?, ?, ?, 'pending')`,
      [row.type, row.content, row.fileUrl, timestamp],
      function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, data: { id: this.lastID } });
      }
    );
  });
});
```

### 6.6 批量同步：Promise 包装顺序执行

对应文件：`web-base/server/routes.ts` 第 559-690 行

当需要顺序执行多个数据库操作时，用 Promise 包装每个操作，然后链式调用：

```typescript
router.post('/todos/sync', (req, res) => {
  const { todos } = req.body;
  const results: any[] = [];

  // 将单个数据库操作包装为 Promise
  const processTodo = (todo: any, index: number): Promise<void> => {
    return new Promise<void>((resolve) => {
      db.run(`INSERT INTO todos ...`, [...], function (err) {
        if (err) {
          results.push({ action: 'error' });
        } else {
          results.push({ serverId: this.lastID, action: 'created' });
        }
        resolve();   // 无论成功失败都 resolve，继续下一个
      });
    });
  };

  // 顺序执行所有操作
  let chain = Promise.resolve();
  todos.forEach((todo, index) => {
    chain = chain.then(() => processTodo(todo, index));
  });

  chain.then(() => {
    res.json({ success: true, data: { results } });
  });
});
```

### 6.7 如果你想继续用 async/await

如果你不想写回调，可以用 `util.promisify` 或第三方包 `sqlite` / `better-sqlite3`：

**方案 A：util.promisify 包装**

```typescript
import { promisify } from 'util';

const dbAll = promisify<string, any[], any[]>(db.all.bind(db));
const dbGet = promisify<string, any[], any>(db.get.bind(db));
const dbRun = promisify<string, any[], any>(db.run.bind(db));

// 使用
const rows = await dbAll('SELECT * FROM capsules', []);
```

**方案 B：使用 better-sqlite3（同步 API）**

```typescript
import Database from 'better-sqlite3';
const db = new Database('./database.sqlite');

// 同步调用，天然支持 async/await 环境
const rows = db.prepare('SELECT * FROM capsules').all();
const row = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
const result = db.prepare('INSERT INTO capsules (...) VALUES (...)').run(...);
```

**方案 C：使用 sqlite 包（Promise 封装）**

```typescript
import sqlite from 'sqlite';
const db = await sqlite.open('./database.sqlite');

// Promise API
const rows = await db.all('SELECT * FROM capsules');
const row = await db.get('SELECT * FROM capsules WHERE id = ?', id);
```

---

## 7. 启动流程：为什么不需要单独启动数据库

这是从 MySQL 迁移到 SQLite 后最大的体验变化。整个启动链路如下：

### 7.1 完整启动链路

```
npm run dev
  │
  ├─ concurrently 启动两个进程:
  │   ├─ vite (前端开发服务器，端口 5173)
  │   └─ nodemon --watch server --exec tsx server/index.ts (后端 API)
  │
  └─ 后端启动流程:
      │
      ├─ index.ts 加载
      │   ├─ import routes from './routes.js'
      │   │   └─ routes.ts 中 import { db } from './db.js'  ← 触发 db.ts 执行
      │   │       │
      │   │       └─ db.ts 执行:
      │   │           ├─ new sqlite.Database(dbPath, callback)
      │   │           │   ├─ 文件不存在 → 自动创建 database.sqlite 空文件
      │   │           │   └─ 文件已存在 → 直接打开
      │   │           │
      │   │           └─ 回调中执行:
      │   │               ├─ CREATE TABLE IF NOT EXISTS capsules (...)
      │   │               ├─ ALTER TABLE capsules ADD COLUMN ... (迁移)
      │   │               ├─ CREATE TABLE IF NOT EXISTS todos (...)
      │   │               └─ ALTER TABLE todos ADD COLUMN ... (迁移)
      │   │
      │   ├─ import { eventBroadcaster } from './events.js'
      │   └─ import { startBonjourService } from './nsd.js'
      │
      └─ app.listen(3000) → 服务器就绪
```

### 7.2 对比 MySQL 的启动流程

```
MySQL 项目启动:
  1. 确保 MySQL 服务已安装        ← 需要 apt/brew install mysql
  2. 启动 MySQL 服务              ← 需要 systemctl start mysql 或 mysql.server start
  3. 创建数据库                   ← 需要 CREATE DATABASE homedock
  4. 创建用户并授权               ← 需要 GRANT ALL ON homedock.*
  5. 运行数据库迁移               ← 需要 npx knex migrate:latest 等
  6. 配置 .env 中的连接信息       ← DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
  7. npm run dev                  ← 应用才能连接数据库

SQLite 项目启动:
  1. npm run dev                  ← 一切自动完成
```

### 7.3 对应的关键代码

**入口文件**：`web-base/server/index.ts`

```typescript
import { startBonjourService } from './nsd.js';
import routes from './routes.js';           // 这行触发 db.ts 的加载
import { handleSSEConnection } from './events.js';

const app = express();
app.use('/api', routes);                    // 挂载路由

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  startBonjourService(PORT);
});
```

**数据库模块**：`web-base/server/db.ts`

```typescript
// 这行代码在模块被 import 时执行
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    // 自动建表和迁移...
  }
});
```

**路由模块**：`web-base/server/routes.ts`

```typescript
import { db } from './db.js';    // 导入数据库实例

router.get('/capsules', (req, res) => {
  db.all(`SELECT * FROM capsules`, [], (err, rows) => {
    // 直接使用 db 对象查询
  });
});
```

### 7.4 数据库文件位置

```
HomeDock/                        ← 项目根目录
├── database.sqlite              ← SQLite 数据库文件（自动创建，gitignored）
├── uploads/                     ← 上传文件目录
└── web-base/
    └── server/
        ├── db.ts                ← 数据库连接模块
        ├── index.ts             ← 服务器入口
        ├── routes.ts            ← API 路由
        ├── events.ts            ← SSE 事件广播
        └── nsd.ts               ← mDNS 服务发现
```

数据库文件路径由 `db.ts` 中的 `path.resolve(__dirname, '../../database.sqlite')` 决定，即从 `web-base/server/` 向上两级到项目根目录。

---

## 8. 常见陷阱与注意事项

### 8.1 回调中的 this 绑定

`db.run()` 的回调必须用 `function` 关键字声明，不能用箭头函数：

```typescript
// 正确 ✓
db.run(sql, params, function(err) {
  console.log(this.lastID);    // 正确获取自增 ID
  console.log(this.changes);   // 正确获取影响行数
});

// 错误 ✗
db.run(sql, params, (err) => {
  console.log(this.lastID);    // undefined！箭头函数没有自己的 this
});
```

### 8.2 并发写入限制

SQLite 同一时刻只允许一个写入者。如果你的应用有高并发写入需求，需要：

```typescript
// 启用 WAL 模式（Write-Ahead Logging），提升并发读写性能
db.run('PRAGMA journal_mode = WAL');

// 设置繁忙超时，等待锁释放而不是立即报错
db.run('PRAGMA busy_timeout = 5000');  // 等待 5 秒
```

建议在 `db.ts` 的连接回调中添加这些 PRAGMA 设置。

### 8.3 数据库文件权限

确保 Node.js 进程对数据库文件及其所在目录有读写权限。SQLite 除了读写 `.sqlite` 文件外，还会在同目录创建 `-wal` 和 `-shm` 临时文件。

### 8.4 不支持的 SQL 特性

以下 MySQL 常用语法在 SQLite 中不可用：

| MySQL 语法 | SQLite 替代方案 |
|---|---|
| `ALTER TABLE ... MODIFY COLUMN` | 重建表（创建新表 → 复制数据 → 删旧表 → 重命名） |
| `ALTER TABLE ... DROP COLUMN` | SQLite 3.35.0+ 支持，旧版本需重建表 |
| `TRUNCATE TABLE` | `DELETE FROM table`（不加 WHERE） |
| `INSERT ... ON DUPLICATE KEY UPDATE` | `INSERT OR REPLACE` 或 `INSERT ... ON CONFLICT ... DO UPDATE` |
| `GROUP_CONCAT` 配合 `ORDER BY` | SQLite 的 `GROUP_CONCAT` 不支持内部 ORDER BY，需子查询 |
| `LIMIT` 配合 `UPDATE/DELETE` | SQLite 支持 `DELETE FROM t WHERE ... LIMIT n`（3.35.0+） |

### 8.5 数据库文件备份

SQLite 的备份非常简单——直接复制文件即可：

```bash
# 停止应用后复制
cp database.sqlite database.sqlite.backup

# 或者在应用运行时使用 SQLite 的在线备份 API
sqlite3 database.sqlite ".backup 'database.sqlite.backup'"
```

### 8.6 生产环境建议

```typescript
// db.ts 中添加的生产环境优化
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');      // WAL 模式，读写不互斥
  db.run('PRAGMA busy_timeout = 5000');     // 等待锁 5 秒
  db.run('PRAGMA synchronous = NORMAL');    // 平衡安全与性能
  db.run('PRAGMA cache_size = -64000');     // 64MB 缓存
  db.run('PRAGMA foreign_keys = ON');       // 启用外键约束
});
```

---

## 9. 完整文件对照表

### 需要修改的文件清单

| 文件路径 | 修改内容 |
|---|---|
| `web-base/package.json` | 移除 `mysql2`，添加 `sqlite3` 和 `@types/sqlite3` |
| `web-base/server/db.ts` | 整个文件重写：MySQL 连接池 → SQLite Database 实例，建表语句适配 |
| `web-base/server/routes.ts` | 所有数据库操作从 `async/await + pool` 改为 `callback + db` |
| `.env` / 配置文件 | 移除 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` 等环境变量 |
| `.gitignore` | 添加 `database.sqlite`（避免数据库文件入库） |

### 不需要修改的文件

| 文件路径 | 原因 |
|---|---|
| `web-base/server/index.ts` | 不直接操作数据库，只负责启动和路由挂载 |
| `web-base/server/events.ts` | SSE 事件广播，与数据库无关 |
| `web-base/server/nsd.ts` | mDNS 服务发现，与数据库无关 |
| `web-base/src/` (前端) | 前端通过 API 交互，不直接连数据库 |

### API 方法速查表

| 操作 | 方法 | 获取自增ID | 获取影响行数 | 回调签名 |
|---|---|---|---|---|
| 查询多行 | `db.all(sql, params, callback)` | — | — | `(err, rows) => {}` |
| 查询单行 | `db.get(sql, params, callback)` | — | — | `(err, row) => {}` |
| 执行写操作 | `db.run(sql, params, callback)` | `this.lastID` | `this.changes` | `function(err) {}` |
| 执行多条SQL | `db.exec(sql, callback)` | — | — | `(err) => {}` |
| 逐行读取 | `db.each(sql, params, rowCallback, completeCallback)` | — | — | `(err, row) => {}`, `(err, count) => {}` |

---

## 附录：快速迁移检查清单

- [ ] `npm uninstall mysql2`，`npm install sqlite3 @types/sqlite3`
- [ ] 重写 `db.ts`：连接池 → `new sqlite.Database(path)`
- [ ] 建表语句：`AUTO_INCREMENT` → `AUTOINCREMENT`，`VARCHAR` → `TEXT`，`DATETIME` → `INTEGER`
- [ ] 默认值：`CURRENT_TIMESTAMP` → `(cast(strftime('%s','now') as int) * 1000)`
- [ ] 布尔字段：写入时 `true/false` → `1/0`，读取时 `Boolean(row.field)`
- [ ] 路由层：`await pool.query()` → `db.all/db.get/db.run()` + 回调
- [ ] 回调用 `function` 不用箭头函数，确保 `this.lastID` / `this.changes` 可用
- [ ] 移除 `.env` 中的数据库连接配置
- [ ] `.gitignore` 添加 `*.sqlite`
- [ ] 考虑添加 `PRAGMA journal_mode = WAL` 和 `PRAGMA busy_timeout`
- [ ] 测试所有 CRUD 操作和边界情况
