'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const notificationsRouter = require('./routes/notifications');
const sseHub = require('./services/sseHub');
const { mongoose } = require('./config/mongo');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    sseClients: sseHub.size(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/notifications', notificationsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

module.exports = app;
