const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
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
    published: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
