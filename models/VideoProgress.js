const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    positionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

videoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });
videoProgressSchema.index({ userId: 1, lastWatchedAt: -1 });
videoProgressSchema.index({ userId: 1, courseId: 1 });

module.exports = mongoose.model('VideoProgress', videoProgressSchema);
