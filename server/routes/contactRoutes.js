const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');

// POST /api/contact - Gửi tin nhắn liên hệ
router.post('/contact', contactController.createContact);

module.exports = router;