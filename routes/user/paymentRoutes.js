const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  listPlans,
  listMethods,
  submitManualPayment,
  listMyPayments,
} = require('../../controllers/user/paymentController');

const router = express.Router();

router.use(protect);
router.get('/subscription/plans', listPlans);
router.get('/payments/methods', listMethods);
router.post('/payments/manual', submitManualPayment);
router.get('/payments/my', listMyPayments);

module.exports = router;
