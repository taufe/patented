const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    pdfUrl: {
      type: String,
      default: '',
      trim: true,
    },
    originalFileName: {
      type: String,
      default: '',
      trim: true,
    },
    storedFileName: {
      type: String,
      default: '',
      trim: true,
    },
    storageKey: {
      type: String,
      default: '',
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
      trim: true,
    },
    totalPages: {
      type: Number,
      default: 0,
      min: 0,
    },
    published: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ courseId: 1, createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
