const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const {
  listSentNotifications,
  sendNotification,
} = require('../../controllers/admin/notificationController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/notifications', listSentNotifications);
router.post('/notifications/send', sendNotification);

module.exports = router;
