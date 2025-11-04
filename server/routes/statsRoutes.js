const express = require("express");
const router = express.Router();
const { protect, adminOrStaff } = require("../middleware/auth");
const statsController = require("../controllers/statsController");

// @desc    Get revenue report by time period
// @route   GET /api/stats/revenue
// @access  Private/Admin/Staff
router.get("/revenue", protect, adminOrStaff, statsController.getRevenueStats);

// @desc    Get booking rate statistics
// @route   GET /api/stats/booking-rate
// @access  Private/Admin/Staff
router.get("/booking-rate", protect, adminOrStaff, statsController.getBookingRateStats);

// @desc    Get review statistics
// @route   GET /api/stats/review-stats
// @access  Private/Admin/Staff
router.get("/review-stats", protect, adminOrStaff, statsController.getReviewStats);

// @desc    Get revenue by cities of a region
// @route   GET /api/stats/revenue/by-region-city
// @access  Private/Admin/Staff
router.get("/revenue/by-region-city", protect, adminOrStaff, statsController.getRevenueByRegionCity);

module.exports = router;