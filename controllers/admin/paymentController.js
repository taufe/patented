const Payment = require('../../models/Payment');
const User = require('../../models/User');
const { findPlan, addDays } = require('../../config/subscription');
const { isValidId, invalidIdResponse } = require('../../utils/ids');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { toAdminPayment } = require('../../utils/paymentResponse');

const listPayments = async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (status && ['pending', 'approved', 'rejected'].includes(String(status))) {
      filter.status = status;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      const users = await User.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
        ],
      }).select('_id');

      filter.$or = [
        { transactionId: { $regex: term, $options: 'i' } },
        { userId: { $in: users.map((user) => user._id) } },
      ];
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'name email phone isPremium')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Payments fetched successfully',
      payments: payments.map(toAdminPayment),
      pagination: paginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message,
    });
  }
};

const reviewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body.status || '').trim().toLowerCase();
    const reviewNote = String(req.body.note || req.body.reviewNote || '').trim();

    if (!isValidId(id)) {
      return invalidIdResponse(res, 'payment ID');
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected',
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment was already ${payment.status}`,
      });
    }

    payment.status = status;
    payment.reviewNote = reviewNote;
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();

    if (status === 'approved') {
      const plan = findPlan(payment.planId || payment.plan);
      const user = await User.findById(payment.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found for this payment',
        });
      }

      const durationDays = plan ? plan.durationDays : 30;
      const now = new Date();
      const currentExpiry =
        user.premiumExpiresAt && new Date(user.premiumExpiresAt).getTime() > now.getTime()
          ? new Date(user.premiumExpiresAt)
          : now;
      const premiumExpiresAt = addDays(currentExpiry, durationDays);

      user.isPremium = true;
      user.premiumPlan = payment.plan;
      user.premiumExpiresAt = premiumExpiresAt;
      await user.save();

      payment.premiumExpiresAt = premiumExpiresAt;
    }

    await payment.save();
    await payment.populate('userId', 'name email phone isPremium');

    res.json({
      success: true,
      message:
        status === 'approved'
          ? 'Payment approved. Premium access granted.'
          : 'Payment rejected',
      payment: toAdminPayment(payment),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing payment',
      error: error.message,
    });
  }
};

module.exports = {
  listPayments,
  reviewPayment,
};
