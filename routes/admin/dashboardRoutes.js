const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const { getDashboard } = require('../../controllers/admin/dashboardController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);

module.exports = router;
