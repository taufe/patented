const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');
const { sendPasswordResetCode } = require('../utils/email');
const {
  normalizeEmail,
  isValidEmail,
  isValidOtp,
  validatePassword,
} = require('../utils/validation');

const RESET_CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const RESET_FIELDS =
  '+resetPasswordCode +resetPasswordCodeExpires +resetPasswordCodeSentAt +resetPasswordToken +resetPasswordTokenExpires';

const toPublicUser = (user) => {
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordCode;
  delete userResponse.resetPasswordCodeExpires;
  delete userResponse.resetPasswordCodeSentAt;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordTokenExpires;
  userResponse.role = userResponse.role === 'admin' ? 'admin' : 'user';
  userResponse.isPremium = Boolean(userResponse.isPremium);
  return userResponse;
};

const generateToken = (user) => {
  const role = user.role === 'admin' ? 'admin' : 'user';

  return jwt.sign({ id: user._id, role }, getJwtSecret(), {
    expiresIn: '1d',
  });
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);
    const publicUser = toPublicUser(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role: publicUser.role,
      user: publicUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(RESET_FIELDS);

    if (user) {
      const now = Date.now();

      if (
        user.resetPasswordCodeSentAt &&
        now - user.resetPasswordCodeSentAt.getTime() < RESEND_COOLDOWN_MS
      ) {
        const secondsRemaining = Math.ceil(
          (RESEND_COOLDOWN_MS - (now - user.resetPasswordCodeSentAt.getTime())) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting a new code`,
        });
      }

      const otp = generateOtp();
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      user.resetPasswordCode = hashedOtp;
      user.resetPasswordCodeExpires = new Date(now + RESET_CODE_EXPIRY_MS);
      user.resetPasswordCodeSentAt = new Date(now);
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpires = undefined;

      await user.save();

      try {
        await sendPasswordResetCode({ email: normalizedEmail, code: otp });
      } catch (emailError) {
        console.error(`Failed to send password reset email: ${emailError.message}`);

        return res.status(500).json({
          success: false,
          message: 'Failed to send verification code. Please try again later.',
          error: emailError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "We've sent a verification code to your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during forgot password',
      error: error.message,
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!isValidOtp(code)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be a 6-digit number',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(RESET_FIELDS);

    if (
      !user ||
      !user.resetPasswordCode ||
      !user.resetPasswordCodeExpires ||
      user.resetPasswordCodeExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    const isCodeValid = await bcrypt.compare(String(code).trim(), user.resetPasswordCode);

    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    const resetToken = generateResetToken();
    const salt = await bcrypt.genSalt(10);
    const hashedResetToken = await bcrypt.hash(resetToken, salt);

    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    user.resetPasswordCodeSentAt = undefined;
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification code confirmed',
      email: normalizedEmail,
      resetToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during code verification',
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, password, confirmPassword } = req.body;

    if (!email || !resetToken || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset token, password, and confirm password',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      `${RESET_FIELDS} +password`
    );

    if (
      !user ||
      !user.resetPasswordToken ||
      !user.resetPasswordTokenExpires ||
      user.resetPasswordTokenExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const isResetTokenValid = await bcrypt.compare(resetToken, user.resetPasswordToken);

    if (!isResetTokenValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    user.resetPasswordCodeSentAt = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
