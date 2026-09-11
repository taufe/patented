const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const { getContact, updateContact } = require('../../controllers/admin/contactController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/contact', getContact);
router.patch('/contact', updateContact);

module.exports = router;
