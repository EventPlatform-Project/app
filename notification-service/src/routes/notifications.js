'use strict';

const express = require('express');
const notificationService = require('../services/notificationService');
const sseHub = require('../services/sseHub');

const router = express.Router();

/**
 * GET /api/notifications
 * List recent notifications (most recent first).
 * Query params: limit, skip, unreadOnly=true
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const skip = parseInt(req.query.skip || '0', 10);
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';

    const items = await notificationService.list({ limit, skip, unreadOnly });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (_req, res, next) => {
  try {
    const count = await notificationService.countUnread();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/notifications
 * Compatibility endpoint — allows publishing an event over HTTP as well.
 * Primary path is RabbitMQ, but this makes local testing easy.
 */
router.post('/', async (req, res, next) => {
  try {
    const saved = await notificationService.ingest(req.body || {});
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint. Frontends open this and receive:
 *   event: notification  → new notification payload
 *   event: ping          → keepalive every 25s
 */
router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  // Initial hello so the client knows the stream is live.
  res.write(`event: hello\ndata: {"ok":true}\n\n`);

  sseHub.addClient(res);

  const pingInterval = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch (_) {
      // Will be cleaned up by the 'close' handler.
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseHub.removeClient(res);
    try { res.end(); } catch (_) { /* noop */ }
  });
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const updated = await notificationService.markRead(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', async (_req, res, next) => {
  try {
    const modified = await notificationService.markAllRead();
    res.json({ modified });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/notifications  (dev only — clears the collection)
 */
router.delete('/', async (_req, res, next) => {
  try {
    const deleted = await notificationService.clearAll();
    res.json({ deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
