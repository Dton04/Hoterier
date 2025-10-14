const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Room = require("../models/room");

// GET /api/dashboard/overview - Thống kê tổng quan
router.get("/overview", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();
    const confirmedBookings = await Booking.find({ status: "confirmed" }).populate("roomid");
    const totalRevenue = confirmedBookings.reduce((total, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return total;
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      return total + (booking.roomid.rentperday * days);
    }, 0);

    res.status(200).json({ totalBookings, totalReviews, totalRevenue });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê tổng quan:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê tổng quan", error: error.message });
  }
});

// GET /api/bookings/stats/monthly - Thống kê doanh thu theo tháng
router.get("/monthly", async (req, res) => {
  const { month, year } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    let query = { status: "confirmed" };

    // Nếu có month và year, lọc theo tháng và năm cụ thể
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Tháng hoặc năm không hợp lệ" });
      }

      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0); // Ngày cuối của tháng
      query.checkin = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(query).populate("roomid");

    const monthlyRevenue = {};
    bookings.forEach(booking => {
      if (!booking.roomid || !booking.roomid.rentperday) return;
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const revenue = booking.roomid.rentperday * days;

      const monthKey = month && year 
        ? `${year}-${month.padStart(2, '0')}`
        : `${checkinDate.getFullYear()}-${(checkinDate.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + revenue;
    });

    res.status(200).json(monthlyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
  }
});

module.exports = router;