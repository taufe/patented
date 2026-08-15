const express = require('express');
const { protect } = require('../../middleware/auth');
const { getMe, updateMe } = require('../../controllers/user/profileController');

const router = express.Router();

router.use(protect);
router.get('/me', getMe);
router.patch('/me', updateMe);

module.exports = router;
