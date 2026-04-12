// Simple SSE event broadcaster
// Tracks connected clients and broadcasts events to all

import { Request, Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

class EventBroadcaster {
  private clients: SSEClient[] = [];
  private clientIdCounter = 0;

  // Add a new SSE client connection
  addClient(res: Response): string {
    const id = `client_${++this.clientIdCounter}`;
    this.clients.push({ id, res });

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
    this.clients.forEach(client => {
      try {
        client.res.write(message);
      } catch (err) {
        console.error(`[SSE] Error writing to client ${client.id}:`, err);
        this.removeClient(client.id);
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

  // Send a keepalive comment every 30 seconds
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Add client
  const clientId = eventBroadcaster.addClient(res);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepalive);
    eventBroadcaster.removeClient(clientId);
  });
}
