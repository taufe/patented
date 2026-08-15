const express = require('express');
const {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.patch('/change-password', protect, changePassword);

module.exports = router;
