const express = require("express");
const router = express.Router();
const { protect, adminOrStaff } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

// GET /api/dashboard/overview - Thống kê tổng quan cho admin
router.get("/overview", protect, adminOrStaff, dashboardController.getOverviewStats);

// GET /api/dashboard/monthly - Thống kê doanh thu theo tháng
router.get("/monthly", protect, adminOrStaff, dashboardController.getMonthlyStats);

module.exports = router;