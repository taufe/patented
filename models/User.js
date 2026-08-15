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
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    about: {
      type: String,
      default: '',
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastDevice: {
      type: String,
      default: '',
      trim: true,
    },
    unlockedCourses: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
      ],
      default: [],
    },
    emailNotification: {
      type: Boolean,
      default: true,
    },
    pushNotification: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
    biometricLogin: {
      type: Boolean,
      default: false,
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
