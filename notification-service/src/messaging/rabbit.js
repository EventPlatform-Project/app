'use strict';

const amqp = require('amqplib');
const { rabbit } = require('../config/env');
const notificationService = require('../services/notificationService');

let connection = null;
let channel = null;
let stopping = false;

async function start() {
  stopping = false;
  await connectLoop();
}

async function stop() {
  stopping = true;
  try {
    if (channel) await channel.close();
  } catch (_) { /* noop */ }
  try {
    if (connection) await connection.close();
  } catch (_) { /* noop */ }
  channel = null;
  connection = null;
}

async function connectLoop() {
  while (!stopping) {
    try {
      await connect();
      return;
    } catch (err) {
      console.error(
        `[rabbit] connection failed: ${err.message}. Retrying in ${rabbit.reconnectDelayMs}ms`
      );
      await sleep(rabbit.reconnectDelayMs);
    }
  }
}

/**
 * Full list of exchange/queue/routing bindings to consume. The first entry
 * is the historical single binding (user.events); {@link env.rabbit.extraBindings}
 * appends new ones (e.g. reservation.events) so we can consume every domain
 * event through the same connection.
 */
function allBindings() {
  return [
    {
      exchange: rabbit.exchange,
      exchangeType: rabbit.exchangeType,
      queue: rabbit.queue,
      routingKey: rabbit.routingKey,
    },
    ...(Array.isArray(rabbit.extraBindings) ? rabbit.extraBindings : []),
  ];
}

async function connect() {
  console.log(`[rabbit] connecting to ${rabbit.url} ...`);
  connection = await amqp.connect(rabbit.url);

  connection.on('error', (err) => {
    console.error('[rabbit] connection error:', err.message);
  });
  connection.on('close', () => {
    console.warn('[rabbit] connection closed');
    channel = null;
    connection = null;
    if (!stopping) {
      setTimeout(() => connectLoop().catch(() => {}), rabbit.reconnectDelayMs);
    }
  });

  channel = await connection.createChannel();
  await channel.prefetch(rabbit.prefetch);

  for (const b of allBindings()) {
    await channel.assertExchange(b.exchange, b.exchangeType, { durable: true });
    await channel.assertQueue(b.queue, { durable: true });
    await channel.bindQueue(b.queue, b.exchange, b.routingKey);

    console.log(
      `[rabbit] bound queue="${b.queue}" -> exchange="${b.exchange}" (${b.exchangeType}) ` +
        `routingKey="${b.routingKey}"`
    );

    // Each binding gets its own consumer using the same channel.
    // eslint-disable-next-line no-loop-func
    await channel.consume(
      b.queue,
      async (msg) => {
        if (!msg) return;
        try {
          const body = msg.content.toString('utf8');
          const event = JSON.parse(body);

          // Prefer the routing key as the event `type` when the payload
          // doesn't carry it (defense in depth).
          if (!event.type && msg.fields && msg.fields.routingKey) {
            event.type = routingKeyToType(msg.fields.routingKey);
          }

          await notificationService.ingest(event);
          channel.ack(msg);
        } catch (err) {
          console.error(
            `[rabbit] failed to process message from ${b.queue}: ${err.message}`
          );
          // Don't requeue malformed messages to avoid infinite loops.
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }

  console.log('[rabbit] all consumers ready');
}

function routingKeyToType(rk) {
  // 'user.created' -> 'USER_CREATED'
  return rk.replace(/\./g, '_').toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { start, stop };
