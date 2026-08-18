const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      default: null,
    },
    scope: {
      type: String,
      enum: ['course', 'chapter', 'lecture'],
      required: true,
    },
    kind: {
      type: String,
      enum: ['book', 'vocabulary', 'notes', 'handout'],
      default: 'notes',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      trim: true,
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      trim: true,
    },
    storageProvider: {
      type: String,
      enum: ['gridfs'],
      default: 'gridfs',
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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

pdfSchema.index({ courseId: 1, scope: 1, order: 1 });
pdfSchema.index({ chapterId: 1, scope: 1 });
pdfSchema.index({ videoId: 1, scope: 1 });

module.exports = mongoose.model('Pdf', pdfSchema);
