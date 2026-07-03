const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const OTP_REGEX = /^\d{6}$/;

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

const isValidOtp = (code) => OTP_REGEX.test(String(code).trim());

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  return null;
};

module.exports = {
  EMAIL_REGEX,
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  isValidEmail,
  isValidOtp,
  validatePassword,
};
