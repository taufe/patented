const User = require('../../models/User');
const DeviceToken = require('../../models/DeviceToken');
const Notification = require('../../models/Notification');
const NotificationSend = require('../../models/NotificationSend');
const { isFcmConfigured } = require('../../config/env');
const { sendPushToTokens } = require('../../services/fcm.service');
const { isValidId } = require('../../utils/ids');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { hasActivePremium } = require('../../utils/subscription');

const AUDIENCES = ['all', 'premium', 'userIds'];

const toPublicSend = (send) => ({
  _id: send._id,
  title: send.title,
  body: send.body || '',
  audience: send.audience,
  userIds: send.userIds || [],
  data: send.data || {},
  recipientCount: send.recipientCount || 0,
  pushDelivered: send.pushDelivered || 0,
  pushFailed: send.pushFailed || 0,
  fcmConfigured: Boolean(send.fcmConfigured),
  createdAt: send.createdAt,
});

const resolveRecipients = async (audience, userIds = []) => {
  if (audience === 'userIds') {
    const ids = [...new Set((userIds || []).map(String).filter(isValidId))];

    if (ids.length === 0) {
      return [];
    }

    return User.find({ _id: { $in: ids }, role: 'user', isBlocked: false }).select(
      '_id pushNotification isPremium premiumExpiresAt role'
    );
  }

  const users = await User.find({ role: 'user', isBlocked: false }).select(
    '_id pushNotification isPremium premiumExpiresAt role'
  );

  if (audience === 'premium') {
    return users.filter((user) => hasActivePremium(user));
  }

  return users;
};

const listSentNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [sends, total] = await Promise.all([
      NotificationSend.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationSend.countDocuments(),
    ]);

    res.json({
      success: true,
      message: 'Notifications fetched successfully',
      notifications: sends.map(toPublicSend),
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

const sendNotification = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    const audience = String(req.body.audience || 'all').trim();
    const data =
      req.body.data && typeof req.body.data === 'object' && !Array.isArray(req.body.data)
        ? req.body.data
        : {};

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!AUDIENCES.includes(audience)) {
      return res.status(400).json({
        success: false,
        message: 'Audience must be all, premium, or userIds',
      });
    }

    const recipients = await resolveRecipients(audience, req.body.userIds);

    if (audience === 'userIds' && recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one valid userId',
      });
    }

    const send = await NotificationSend.create({
      title,
      body,
      audience,
      userIds: audience === 'userIds' ? recipients.map((user) => user._id) : [],
      data,
      sentBy: req.user._id,
      recipientCount: recipients.length,
      fcmConfigured: isFcmConfigured(),
    });

    if (recipients.length > 0) {
      await Notification.insertMany(
        recipients.map((user) => ({
          userId: user._id,
          title,
          body,
          data,
          sendId: send._id,
        }))
      );
    }

    const pushUsers = recipients.filter((user) => user.pushNotification !== false);
    const tokens = await DeviceToken.find({
      userId: { $in: pushUsers.map((user) => user._id) },
      active: true,
    }).select('token');

    const pushResult = await sendPushToTokens({
      tokens: tokens.map((item) => item.token),
      title,
      body,
      data,
    });

    if (pushResult.invalidTokens.length > 0) {
      await DeviceToken.updateMany(
        { token: { $in: pushResult.invalidTokens } },
        { $set: { active: false } }
      );
    }

    send.pushDelivered = pushResult.delivered;
    send.pushFailed = pushResult.failed;
    send.fcmConfigured = pushResult.configured;
    await send.save();

    const message = pushResult.configured
      ? 'Notification sent'
      : 'Notification saved. Push delivery skipped because FCM is not configured.';

    res.status(201).json({
      success: true,
      message,
      notification: toPublicSend(send),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while sending notification',
      error: error.message,
    });
  }
};

module.exports = {
  listSentNotifications,
  sendNotification,
};
