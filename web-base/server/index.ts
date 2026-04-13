import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { startBonjourService } from './nsd.js';
import routes from './routes.js';
import { handleSSEConnection } from './events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[主基地] Health check');
  res.json({ success: true, data: { status: 'ok', timestamp: Date.now() } });
});

// SSE endpoint for real-time events
app.get('/api/events', handleSSEConnection);

  // Serve frontend if running in production mode (dist folder)
  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Express 5 requires named wildcard parameters
    app.get('*splat', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.send('Base API is running. Frontend build not found.');
    });
  }

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[主基地服务] 运行在 http://0.0.0.0:${PORT}`);
  
  // Start NSD (Bonjour/mDNS) service discovery
  startBonjourService(PORT);
});
