const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpayController');

// @desc    Create VNPay payment URL
// @route   POST /api/vnpay/create-payment
// @access  Public
router.post('/create-payment', vnpayController.createPayment);

// @desc    Handle VNPay return callback
// @route   GET /api/vnpay/vnpay_return
// @access  Public
router.get('/vnpay_return', vnpayController.vnpayReturn);

module.exports = router;