'use strict';

const { Schema, model } = require('mongoose');

/**
 * Notification document.
 * `payload` keeps the raw event body so we don't lose data if new fields
 * appear on the producer side without a schema migration here.
 */
const NotificationSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    message: { type: String, default: '' },

    // Convenience fields extracted from the payload for filtering/listing.
    userId: { type: String, index: true, default: null },
    username: { type: String, default: null },
    email: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    role: { type: String, default: null },

    read: { type: Boolean, default: false, index: true },

    // Original event, kept verbatim.
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
  }
);

NotificationSchema.index({ createdAt: -1 });

NotificationSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    message: this.message,
    userId: this.userId,
    username: this.username,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    read: this.read,
    createdAt: this.createdAt,
    payload: this.payload,
  };
};

module.exports = model('Notification', NotificationSchema);
