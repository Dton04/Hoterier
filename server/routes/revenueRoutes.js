const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Room = require("../models/room");

// GET /api/revenue/daily - Doanh thu theo ngày
router.get("/daily", async (req, res) => {
  console.log("Route /revenue/daily được gọi");
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid");

    const dailyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

      const dateKey = checkinDate.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + (booking.roomid.rentperday * days);
      return acc;
    }, {});

    res.status(200).json(dailyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo ngày:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo ngày", error: error.message });
  }
});

// GET /api/revenue/monthly - Doanh thu theo tháng
router.get("/monthly", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid");

    const monthlyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

      const monthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + (booking.roomid.rentperday * days);
      return acc;
    }, {});

    res.status(200).json(monthlyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
  }
});

module.exports = router;