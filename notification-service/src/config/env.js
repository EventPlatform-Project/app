'use strict';

require('dotenv').config();

/**
 * Read the first defined env var among `names`, or return `fallback`.
 * Empty strings are treated as "unset".
 */
function firstEnv(names, fallback) {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== '') return v;
  }
  return fallback;
}

function intEnv(names, fallback) {
  const v = firstEnv(names, undefined);
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function boolEnv(names, fallback) {
  const v = firstEnv(names, undefined);
  if (v === undefined) return fallback;
  return String(v).toLowerCase() === 'true';
}

// -----------------------------------------------------------------------------
// Env-var aliases:
//   - Names prefixed with NOTIFICATION_ come from the Spring Cloud Config
//     server (see config-repo/notification-service.properties). configClient.js
//     flattens property keys like `notification.mongo.uri` into env vars like
//     `NOTIFICATION_MONGO_URI`.
//   - Direct names (MONGO_URI, RABBITMQ_URL, ...) always take precedence.
//   - As a final fallback, we build the URLs from the bootstrap env vars
//     MONGO_HOST / RABBITMQ_HOST that docker-compose sets. That way the
//     service still works even if the config-server is unreachable at boot.
// -----------------------------------------------------------------------------

const mongoHost = firstEnv(['MONGO_HOST'], 'localhost');
const rabbitHost = firstEnv(['RABBITMQ_HOST'], 'localhost');
const rabbitPort = firstEnv(['RABBITMQ_PORT'], '5672');
const rabbitUser = firstEnv(['RABBITMQ_USER'], 'guest');
const rabbitPass = firstEnv(['RABBITMQ_PASSWORD'], 'guest');

const config = {
  port: intEnv(['PORT', 'SERVER_PORT'], 9000),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: firstEnv(
    ['MONGO_URI', 'NOTIFICATION_MONGO_URI'],
    `mongodb://${mongoHost}:27017/notifications_db`
  ),

  // RabbitMQ
  rabbit: {
    url: firstEnv(
      ['RABBITMQ_URL', 'NOTIFICATION_RABBITMQ_URL'],
      `amqp://${rabbitUser}:${rabbitPass}@${rabbitHost}:${rabbitPort}`
    ),
    exchange: firstEnv(
      ['RABBITMQ_EXCHANGE', 'NOTIFICATION_RABBITMQ_EXCHANGE'],
      'user.events'
    ),
    exchangeType: firstEnv(
      ['RABBITMQ_EXCHANGE_TYPE', 'NOTIFICATION_RABBITMQ_EXCHANGE_TYPE'],
      'topic'
    ),
    queue: firstEnv(
      ['RABBITMQ_QUEUE', 'NOTIFICATION_RABBITMQ_QUEUE'],
      'notification.user.events'
    ),
    routingKey: firstEnv(
      ['RABBITMQ_ROUTING_KEY', 'NOTIFICATION_RABBITMQ_ROUTING_KEY'],
      'user.#'
    ),
    prefetch: intEnv(
      ['RABBITMQ_PREFETCH', 'NOTIFICATION_RABBITMQ_PREFETCH'],
      10
    ),
    reconnectDelayMs: intEnv(
      ['RABBITMQ_RECONNECT_DELAY_MS', 'NOTIFICATION_RABBITMQ_RECONNECT_DELAY_MS'],
      5000
    ),
  },

  // History cap for GET /api/notifications
  maxHistory: intEnv(['MAX_HISTORY', 'NOTIFICATION_MAX_HISTORY'], 100),

  // Eureka
  eureka: {
    enabled: boolEnv(
      ['EUREKA_ENABLED', 'NOTIFICATION_EUREKA_ENABLED'],
      true
    ),
    host: firstEnv(['EUREKA_HOST'], 'localhost'),
    port: intEnv(['EUREKA_PORT'], 8761),
    appName: firstEnv(
      ['EUREKA_APP_NAME', 'NOTIFICATION_EUREKA_APP_NAME'],
      'notification-service'
    ),
    hostName: firstEnv(
      ['EUREKA_INSTANCE_HOST', 'NOTIFICATION_EUREKA_INSTANCE_HOST', 'NOTIFICATION_INSTANCE_HOST'],
      'localhost'
    ),
    ipAddr: firstEnv(
      ['EUREKA_INSTANCE_IP', 'NOTIFICATION_EUREKA_INSTANCE_IP', 'NOTIFICATION_INSTANCE_IP'],
      '127.0.0.1'
    ),
  },
};

module.exports = config;
