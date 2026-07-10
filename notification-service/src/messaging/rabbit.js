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
      return; // connected + consuming; the 'close'/'error' handlers will retrigger this loop.
    } catch (err) {
      console.error(
        `[rabbit] connection failed: ${err.message}. Retrying in ${rabbit.reconnectDelayMs}ms`
      );
      await sleep(rabbit.reconnectDelayMs);
    }
  }
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

  await channel.assertExchange(rabbit.exchange, rabbit.exchangeType, {
    durable: true,
  });
  await channel.assertQueue(rabbit.queue, { durable: true });
  await channel.bindQueue(rabbit.queue, rabbit.exchange, rabbit.routingKey);

  console.log(
    `[rabbit] connected. exchange="${rabbit.exchange}" (${rabbit.exchangeType}) ` +
      `queue="${rabbit.queue}" routingKey="${rabbit.routingKey}"`
  );

  await channel.consume(
    rabbit.queue,
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
        console.error('[rabbit] failed to process message:', err.message);
        // Don't requeue malformed messages to avoid infinite loops.
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

function routingKeyToType(rk) {
  // 'user.created' -> 'USER_CREATED'
  return rk.replace(/\./g, '_').toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { start, stop };
