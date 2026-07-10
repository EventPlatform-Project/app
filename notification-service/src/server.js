'use strict';

// Load .env first so CONFIG_SERVER_URL is available for the config client.
require('dotenv').config();

const configClient = require('./config/configClient');

async function bootstrap() {
  // 1. Pull remote configuration from Spring Cloud Config (if reachable).
  //    Keys are merged into process.env BEFORE anything else is required,
  //    so env.js (loaded transitively via app.js) sees the final values.
  await configClient.load();

  // 2. Now that env is finalized, require the rest of the app.
  const app = require('./app');
  const { port } = require('./config/env');
  const { connectMongo } = require('./config/mongo');
  const rabbit = require('./messaging/rabbit');
  const eureka = require('./config/eureka');

  // 3. Connect to MongoDB (non-fatal — will retry in the background).
  await connectMongo();

  // 4. Start the HTTP server (SSE + REST).
  const server = app.listen(port, () => {
    console.log(`[http] notification-service listening on :${port}`);
  });

  // 5. Register with Eureka (if enabled).
  eureka.start();

  // 6. Start the RabbitMQ consumer (auto-reconnects).
  rabbit.start().catch((err) => {
    console.error('[rabbit] fatal:', err);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[${signal}] shutting down...`);
    try {
      await rabbit.stop();
      eureka.stop();
      server.close(() => process.exit(0));
      // Force-exit if something hangs
      setTimeout(() => process.exit(1), 10000).unref();
    } catch (err) {
      console.error('shutdown error:', err);
      process.exit(1);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[bootstrap] fatal:', err);
  process.exit(1);
});
