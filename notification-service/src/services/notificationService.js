'use strict';

const Notification = require('../models/Notification');
const sseHub = require('./sseHub');

/**
 * Build a human-friendly message from the raw event.
 */
function buildMessage(event) {
  const type = event.type || 'EVENT';
  const first = event.firstName || '';
  const last = event.lastName || '';
  const fullName = `${first} ${last}`.trim();
  const displayName = fullName || event.username || event.email || 'Someone';

  switch (type) {
    case 'USER_CREATED':
      return `${displayName} just joined!`;
    case 'USER_UPDATED':
      return `${displayName} updated their profile.`;
    case 'USER_DELETED':
      return `${displayName} left the platform.`;
    default:
      return event.message || `New ${type} event`;
  }
}

/**
 * Persist an incoming event and broadcast it live over SSE.
 * @param {object} event raw event payload from RabbitMQ (or HTTP)
 * @returns {Promise<Notification>}
 */
async function ingest(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event: expected object');
  }
  if (!event.type) {
    throw new Error('Invalid event: missing "type"');
  }

  const doc = await Notification.create({
    type: event.type,
    message: buildMessage(event),
    userId: event.id || event.userId || null,
    username: event.username || null,
    email: event.email || null,
    firstName: event.firstName || null,
    lastName: event.lastName || null,
    role: event.role || null,
    payload: event,
  });

  const clientJson = doc.toClientJSON();
  sseHub.broadcast('notification', clientJson);
  return clientJson;
}

async function list({ limit = 50, skip = 0, unreadOnly = false } = {}) {
  const query = unreadOnly ? { read: false } : {};
  const docs = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 200))
    .exec();
  return docs.map((d) => d.toClientJSON());
}

async function countUnread() {
  return Notification.countDocuments({ read: false });
}

async function markRead(id) {
  const doc = await Notification.findByIdAndUpdate(
    id,
    { $set: { read: true } },
    { new: true }
  );
  return doc ? doc.toClientJSON() : null;
}

async function markAllRead() {
  const res = await Notification.updateMany(
    { read: false },
    { $set: { read: true } }
  );
  return res.modifiedCount;
}

async function clearAll() {
  const res = await Notification.deleteMany({});
  return res.deletedCount;
}

module.exports = {
  ingest,
  list,
  countUnread,
  markRead,
  markAllRead,
  clearAll,
};
