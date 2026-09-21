const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['textOptions', 'imageOptions'],
      default: 'textOptions',
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ quizId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
