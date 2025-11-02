const express = require("express");
const { getDailyRevenue, getMonthlyRevenue } = require("../controllers/revenueController");
const router = express.Router();

// @route   GET /api/revenue/daily
// @desc    Get daily revenue statistics
// @access  Private/Admin
router.get("/daily", getDailyRevenue);

// @route   GET /api/revenue/monthly
// @desc    Get monthly revenue statistics
// @access  Private/Admin
router.get("/monthly", getMonthlyRevenue);

module.exports = router;