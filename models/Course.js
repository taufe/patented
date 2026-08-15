const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
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
    instructor: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    bookPdfUrl: {
      type: String,
      default: '',
      trim: true,
    },
    vocabularyPdfUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    quizAvailable: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalChapters: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ status: 1, order: 1 });

module.exports = mongoose.model('Course', courseSchema);
