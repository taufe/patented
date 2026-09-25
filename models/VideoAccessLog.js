const mongoose = require('mongoose');

const videoAccessLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    unlocked: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

videoAccessLogSchema.index({ userId: 1, timestamp: -1 });
videoAccessLogSchema.index({ videoId: 1, timestamp: -1 });

module.exports = mongoose.model('VideoAccessLog', videoAccessLogSchema);
