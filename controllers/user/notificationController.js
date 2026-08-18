const DeviceToken = require('../../models/DeviceToken');
const Notification = require('../../models/Notification');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { getPagination, paginationMeta } = require('../../utils/pagination');

const PLATFORMS = ['ios', 'android'];

const toPublicNotification = (notification) => ({
  _id: notification._id,
  title: notification.title,
  body: notification.body || '',
  data: notification.data || {},
  read: Boolean(notification.readAt),
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
});

const registerDeviceToken = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const platform = String(req.body.platform || '').trim().toLowerCase();
    const device = String(req.body.device || '').trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
    }

    if (!PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform must be ios or android',
      });
    }

    const existing = await DeviceToken.findOne({ token });

    if (existing) {
      existing.userId = req.user._id;
      existing.platform = platform;
      existing.device = device;
      existing.active = true;
      await existing.save();
    } else {
      await DeviceToken.create({
        userId: req.user._id,
        token,
        platform,
        device,
        active: true,
      });
    }

    res.json({
      success: true,
      message: 'Device token registered',
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.json({
        success: true,
        message: 'Device token registered',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while registering device token',
      error: error.message,
    });
  }
};

const unregisterDeviceToken = async (req, res) => {
  try {
    const token = String(req.body.token || req.query.token || '').trim();
    const filter = { userId: req.user._id };

    if (token) {
      filter.token = token;
    }

    await DeviceToken.updateMany(filter, { $set: { active: false } });

    res.json({
      success: true,
      message: token ? 'Device token removed' : 'Device tokens removed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while removing device token',
      error: error.message,
    });
  }
};

const listMyNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { userId: req.user._id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, readAt: null }),
    ]);

    res.json({
      success: true,
      message: 'Notifications fetched successfully',
      notifications: notifications.map(toPublicNotification),
      unreadCount,
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message,
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return invalidIdResponse(res, 'notification ID');
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: toPublicNotification(notification),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification',
      error: error.message,
    });
  }
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  listMyNotifications,
  markNotificationRead,
};
