const Payment = require('../../models/Payment');
const { findPlan, findMethod, getPlans, getMethods } = require('../../config/subscription');
const { getPagination, paginationMeta } = require('../../utils/pagination');
const { toPublicPayment } = require('../../utils/paymentResponse');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Subscription plans fetched successfully',
      plans: getPlans(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plans',
      error: error.message,
    });
  }
};

const listMethods = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Payment methods fetched successfully',
      methods: getMethods(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment methods',
      error: error.message,
    });
  }
};

const submitManualPayment = async (req, res) => {
  try {
    const plan = findPlan(req.body.plan || req.body.planName || req.body.planId);
    const method = findMethod(req.body.method || req.body.paymentMethod);
    const transactionId = String(req.body.transactionId || '').trim();

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid plan: Weekly, Monthly, or Yearly',
      });
    }

    if (!method || !method.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid manual payment method',
      });
    }

    if (!transactionId || transactionId.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID / reference number is required',
      });
    }

    if (req.body.amount !== undefined && req.body.amount !== null && req.body.amount !== '') {
      const amount = Number(req.body.amount);

      if (!Number.isFinite(amount) || amount !== plan.amount) {
        return res.status(400).json({
          success: false,
          message: `Amount must be ${plan.amount} ${plan.currency} for the ${plan.name} plan`,
        });
      }
    }

    const duplicate = await Payment.findOne({
      transactionId: new RegExp(`^${escapeRegex(transactionId)}$`, 'i'),
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'This transaction ID has already been submitted',
      });
    }

    const payment = await Payment.create({
      userId: req.user._id,
      planId: plan.id,
      plan: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      method: method.id,
      transactionId,
      senderPhone: String(req.body.senderPhone || '').trim(),
      proofUrl: String(req.body.proofUrl || '').trim(),
      note: String(req.body.note || '').trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Payment submitted. Waiting for admin approval.',
      payment: toPublicPayment(payment),
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This transaction ID has already been submitted',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while submitting payment',
      error: error.message,
    });
  }
};

const listMyPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = getPagination(req.query);
    const filter = { userId: req.user._id };

    if (status && ['pending', 'approved', 'rejected'].includes(String(status))) {
      filter.status = status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Payments fetched successfully',
      payments: payments.map(toPublicPayment),
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

module.exports = {
  listPlans,
  listMethods,
  submitManualPayment,
  listMyPayments,
};
