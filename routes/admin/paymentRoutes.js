const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const { listPayments, reviewPayment } = require('../../controllers/admin/paymentController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/payments', listPayments);
router.patch('/payments/:id/review', reviewPayment);

module.exports = router;
