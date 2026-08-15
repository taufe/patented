const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      min: 0,
    },
    hobbies: {
      type: [String],
      default: [],
    },
    resetPasswordCode: {
      type: String,
      select: false,
    },
    resetPasswordCodeExpires: {
      type: Date,
      select: false,
    },
    resetPasswordCodeSentAt: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
