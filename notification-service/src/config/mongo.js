'use strict';

const mongoose = require('mongoose');
const { mongoUri } = require('./env');

mongoose.set('strictQuery', true);

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[mongo] connected: ${mongoUri}`);
  } catch (err) {
    console.error('[mongo] connection error:', err.message);
    // Retry after a small delay so the service keeps trying while Mongo boots.
    setTimeout(connectMongo, 5000);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[mongo] disconnected — will attempt reconnect');
});

mongoose.connection.on('error', (err) => {
  console.error('[mongo] error:', err.message);
});

module.exports = { connectMongo, mongoose };
