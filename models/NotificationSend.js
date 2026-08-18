const mongoose = require('mongoose');

const notificationSendSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
      trim: true,
    },
    audience: {
      type: String,
      enum: ['all', 'premium', 'userIds'],
      required: true,
    },
    userIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pushDelivered: {
      type: Number,
      default: 0,
      min: 0,
    },
    pushFailed: {
      type: Number,
      default: 0,
      min: 0,
    },
    fcmConfigured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSendSchema.index({ createdAt: -1 });

module.exports = mongoose.model('NotificationSend', notificationSendSchema);
