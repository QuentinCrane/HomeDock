// Simple SSE event broadcaster
// Tracks connected clients and broadcasts events to all

import { Request, Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  lastSeen: number;
}

class EventBroadcaster {
  private clients: SSEClient[] = [];
  private clientIdCounter = 0;
  private readonly MAX_CLIENTS = 100;
  private readonly CLIENT_TIMEOUT = 300000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    setInterval(() => this.cleanupStaleClients(), this.CLEANUP_INTERVAL);
  }

  private cleanupStaleClients(): void {
    const now = Date.now();
    const before = this.clients.length;
    this.clients = this.clients.filter(c => now - c.lastSeen < this.CLIENT_TIMEOUT);
    if (this.clients.length < before) {
      console.log(`[SSE] Cleaned up ${before - this.clients.length} stale clients`);
    }
  }

  // Add a new SSE client connection
  addClient(res: Response): string {
    if (this.clients.length >= this.MAX_CLIENTS) {
      this.clients = this.clients.slice(0, this.MAX_CLIENTS / 2);
      console.log(`[SSE] Client limit reached, removed oldest half`);
    }
    const id = `client_${++this.clientIdCounter}`;
    this.clients.push({ id, res, lastSeen: Date.now() });

    // Send initial connection confirmation
    this.sendToClient(res, {
      type: 'connected',
      data: { clientId: id, timestamp: Date.now() }
    });

    console.log(`[SSE] Client connected: ${id}. Total clients: ${this.clients.length}`);
    return id;
  }

  // Remove a client
  removeClient(id: string): void {
    this.clients = this.clients.filter(c => c.id !== id);
    console.log(`[SSE] Client disconnected: ${id}. Total clients: ${this.clients.length}`);
  }

  // Send event to specific client
  private sendToClient(res: Response, event: { type: string; data: any }): void {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
  }

  // Broadcast to all connected clients
  broadcast(event: { type: string; data: any }): void {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    this.clients = this.clients.filter(client => {
      try {
        client.res.write(message);
        client.lastSeen = Date.now();
        return true;
      } catch (err) {
        console.error(`[SSE] Error writing to client ${client.id}:`, err);
        return false;
      }
    });
  }

  // Convenience methods for common events
  capsuleCreated(capsule: any): void {
    this.broadcast({ type: 'capsule:created', data: capsule });
  }

  capsuleUpdated(capsule: any): void {
    this.broadcast({ type: 'capsule:updated', data: capsule });
  }

  capsuleDeleted(id: number): void {
    this.broadcast({ type: 'capsule:deleted', data: { id } });
  }

  todoCreated(todo: any): void {
    this.broadcast({ type: 'todo:created', data: todo });
  }

  todoUpdated(todo: any): void {
    this.broadcast({ type: 'todo:updated', data: todo });
  }

  todoDeleted(id: number): void {
    this.broadcast({ type: 'todo:deleted', data: { id } });
  }

  getClientCount(): number {
    return this.clients.length;
  }
}

// Singleton instance
export const eventBroadcaster = new EventBroadcaster();

// Middleware to handle SSE connections at /api/events
export function handleSSEConnection(req: Request, res: Response): void {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add client
  const clientId = eventBroadcaster.addClient(res);

  // Send heartbeat event every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
    } catch (e) {
      console.error('[SSE] Heartbeat write failed:', e);
      clearInterval(heartbeat);
      eventBroadcaster.removeClient(clientId);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    eventBroadcaster.removeClient(clientId);
  });

  req.on('error', (err) => {
    console.error('[SSE] Request error:', err);
    clearInterval(heartbeat);
    eventBroadcaster.removeClient(clientId);
  });
}
