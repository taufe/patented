const toPublicPayment = (payment) => ({
  _id: payment._id,
  status: payment.status,
  plan: payment.plan,
  planId: payment.planId,
  amount: payment.amount,
  currency: payment.currency,
  method: payment.method,
  transactionId: payment.transactionId,
  senderPhone: payment.senderPhone || '',
  proofUrl: payment.proofUrl || '',
  note: payment.note || '',
  reviewNote: payment.reviewNote || '',
  premiumExpiresAt: payment.premiumExpiresAt || null,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  reviewedAt: payment.reviewedAt || null,
});

const toAdminPayment = (payment) => {
  const user = payment.userId && payment.userId._id ? payment.userId : null;

  return {
    ...toPublicPayment(payment),
    user: user
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          isPremium: Boolean(user.isPremium),
        }
      : {
          _id: payment.userId,
        },
    reviewedBy: payment.reviewedBy || null,
  };
};

module.exports = {
  toPublicPayment,
  toAdminPayment,
};
