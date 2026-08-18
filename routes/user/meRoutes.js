const express = require('express');
const { protect } = require('../../middleware/auth');
const { getMe, updateMe } = require('../../controllers/user/profileController');
const {
  registerDeviceToken,
  unregisterDeviceToken,
  listMyNotifications,
  markNotificationRead,
} = require('../../controllers/user/notificationController');

const router = express.Router();

router.use(protect);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/device-token', registerDeviceToken);
router.delete('/me/device-token', unregisterDeviceToken);
router.get('/me/notifications', listMyNotifications);
router.patch('/me/notifications/:id/read', markNotificationRead);

module.exports = router;
