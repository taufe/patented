const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationLabel: {
      type: String,
      default: '',
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    provider: {
      type: String,
      enum: ['external', 'vimeo', 'cloudinary', 's3', 'mux'],
      default: 'external',
    },
    providerAssetId: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    playbackId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ chapterId: 1, order: 1 });
videoSchema.index({ courseId: 1 });

module.exports = mongoose.model('Video', videoSchema);
