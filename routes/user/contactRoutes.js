const express = require('express');
const { getContact } = require('../../controllers/user/contactController');

const router = express.Router();

router.get('/contact', getContact);

module.exports = router;
