'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { randomUUID } = require('crypto');

const sse = require('./sse');
const eureka = require('./eureka');

const PORT = parseInt(process.env.PORT, 10) || 9000;
const MAX_HISTORY = parseInt(process.env.MAX_HISTORY, 10) || 100;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

/** Bounded ring of the most recent notifications (newest first). */
const notifications = [];

// ---------------------------------------------------------------------------
// Health probe
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
    res.json({
        status: 'UP',
        service: 'notification-service',
        subscribers: sse.clientCount(),
        notificationsCount: notifications.length,
        timestamp: new Date().toISOString(),
    });
});

// ---------------------------------------------------------------------------
// SSE stream — the frontend subscribes here to receive live notifications
// ---------------------------------------------------------------------------
app.get('/api/notifications/stream', (req, res) => {
    sse.attach(req, res);
});

// ---------------------------------------------------------------------------
// Publish a notification (called by other services, e.g. users-service via Feign)
// ---------------------------------------------------------------------------
app.post('/api/notifications', (req, res) => {
    const payload = req.body || {};

    if (!payload.type) {
        return res.status(400).json({ error: 'type is required' });
    }

    const notification = {
        id: randomUUID(),
        type: payload.type,
        userId: payload.id || null,
        username: payload.username || null,
        email: payload.email || null,
        firstName: payload.firstName || null,
        lastName: payload.lastName || null,
        role: payload.role || null,
        message: buildMessage(payload),
        userCreatedAt: payload.createdAt || null,
        receivedAt: new Date().toISOString(),
    };

    notifications.unshift(notification);
    if (notifications.length > MAX_HISTORY) {
        notifications.length = MAX_HISTORY;
    }

    console.log(
        `[notification-service] ${notification.type} username=${notification.username || notification.userId} — broadcasting to ${sse.clientCount()} subscriber(s)`
    );

    sse.broadcast('notification', notification);

    res.status(201).json(notification);
});

// ---------------------------------------------------------------------------
// Recent notifications (for the "bell" dropdown on the frontend)
// ---------------------------------------------------------------------------
app.get('/api/notifications', (_req, res) => {
    res.json(notifications);
});

app.delete('/api/notifications', (_req, res) => {
    notifications.length = 0;
    res.status(204).send();
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[notification-service] unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

function buildMessage(payload) {
    if (payload.type === 'USER_CREATED') {
        const name =
            [payload.firstName, payload.lastName].filter(Boolean).join(' ') ||
            payload.username ||
            'A new user';
        return `${name} just joined!`;
    }
    return `${payload.type || 'Event'} received`;
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(
        `[notification-service] HTTP listening on http://localhost:${PORT}`
    );
    // Register with Eureka so the gateway can reach us via lb://notification-service
    eureka.start(PORT);
});

// Graceful shutdown — deregister from Eureka so the gateway doesn't keep
// sending traffic to a dead instance.
async function shutdown(signal) {
    console.log(`[notification-service] received ${signal}, shutting down…`);
    try {
        await eureka.stop();
    } catch {
        /* ignored */
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
