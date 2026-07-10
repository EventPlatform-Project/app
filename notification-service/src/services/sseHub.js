'use strict';

/**
 * In-memory Server-Sent Events hub.
 * Frontends subscribe on GET /api/notifications/stream; every new
 * notification consumed from RabbitMQ is broadcast to every client.
 */
class SseHub {
  constructor() {
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    console.log(`[sse] client connected (total=${this.clients.size})`);
  }

  removeClient(res) {
    this.clients.delete(res);
    console.log(`[sse] client disconnected (total=${this.clients.size})`);
  }

  broadcast(event, data) {
    if (this.clients.size === 0) return;

    const payload =
      `event: ${event}\n` +
      `data: ${JSON.stringify(data)}\n\n`;

    for (const res of this.clients) {
      try {
        res.write(payload);
      } catch (err) {
        console.warn('[sse] write failed, dropping client:', err.message);
        this.clients.delete(res);
      }
    }
  }

  size() {
    return this.clients.size;
  }
}

module.exports = new SseHub();
