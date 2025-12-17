const express = require('express');
const { createMomoPayment } = require('../controllers/momoController');
const { momoIPN } = require('../controllers/momoIPNController');
const router = express.Router();

// @route   POST /api/momo/create-payment
// @desc    Create MoMo payment
// @access  Public
router.post('/create-payment', createMomoPayment);

// @route   POST /api/momo/ipn
// @desc    Handle MoMo IPN (Instant Payment Notification)
// @access  Public
router.post('/ipn', momoIPN);

module.exports = router;