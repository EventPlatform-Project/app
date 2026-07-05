'use strict';

/**
 * Tiny Server-Sent Events (SSE) hub.
 *
 * Every connected browser holds one long-lived HTTP response. When a new
 * notification arrives from RabbitMQ, we write an `event: notification`
 * frame to every open response.
 *
 * We also emit a `ping` frame every 25s so proxies (nginx, Spring Cloud
 * Gateway, ...) don't consider the connection idle and close it.
 */

const clients = new Set();

const PING_INTERVAL_MS = 25000;

function attach(req, res) {
    // Required SSE headers. Also disable proxy buffering explicitly (Nginx / gateways).
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // If CORS is on the response, express `cors()` already added the right headers.
    res.flushHeaders?.();

    // Send an initial event so the browser knows the stream is live.
    write(res, 'ready', { ok: true, at: new Date().toISOString() });

    const client = { req, res };
    clients.add(client);

    const ping = setInterval(() => {
        try {
            write(res, 'ping', { t: Date.now() });
        } catch {
            // Will be cleaned up by 'close' handler.
        }
    }, PING_INTERVAL_MS);

    const cleanup = () => {
        clearInterval(ping);
        clients.delete(client);
    };

    req.on('close', cleanup);
    req.on('error', cleanup);

    console.log(`[sse] client connected — total ${clients.size}`);
}

function broadcast(eventName, payload) {
    for (const { res } of clients) {
        try {
            write(res, eventName, payload);
        } catch (err) {
            // Best-effort; broken sockets get cleaned up by 'close'.
        }
    }
}

function write(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function clientCount() {
    return clients.size;
}

module.exports = { attach, broadcast, clientCount };
