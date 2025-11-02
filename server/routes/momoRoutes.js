const express = require('express');
const { createMomoPayment } = require('../controllers/momoController');
const router = express.Router();

// @route   POST /api/momo/create-payment
// @desc    Create MoMo payment
// @access  Public
router.post('/create-payment', createMomoPayment);

module.exports = router;