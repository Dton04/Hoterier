const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");
const Review = require("../models/review");
const { protect, adminOrStaff } = require("../middleware/auth");

// GET /api/stats/revenue - Báo cáo doanh thu theo thời gian
router.get("/revenue", protect, adminOrStaff, async (req, res) => {
  const { startDate, endDate, groupBy = "month" } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }

    if (!["day", "month", "year"].includes(groupBy)) {
      return res.status(400).json({ message: "groupBy phải là 'day', 'month' hoặc 'year'" });
    }

    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $gte: start, $lte: end },
    }).populate("roomid");

    const revenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const amount = booking.roomid.rentperday * days - (booking.voucherDiscount || 0);

      let key;
      if (groupBy === "day") {
        key = checkinDate.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        key = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = checkinDate.getFullYear().toString();
      }

      acc[key] = (acc[key] || 0) + amount;
      return acc;
    }, {});

    res.status(200).json({ revenue });
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo doanh thu:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy báo cáo doanh thu", error: error.message });
  }
});

// GET /api/stats/booking-rate - Tỷ lệ đặt phòng
router.get("/booking-rate", protect, adminOrStaff, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }

    const totalRooms = await Room.countDocuments();
    if (totalRooms === 0) {
      return res.status(200).json({ bookingRate: 0, totalRooms: 0, bookedRoomDays: 0, totalPossibleRoomDays: 0 });
    }

    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $lte: end },
      checkout: { $gte: start },
    }).populate("roomid");

    const bookedRoomDays = bookings.reduce((acc, booking) => {
      const checkin = new Date(Math.max(booking.checkin, start));
      const checkout = new Date(Math.min(booking.checkout, end));
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      return acc + (days > 0 ? days : 0);
    }, 0);

    const totalPossibleRoomDays = totalRooms * Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const bookingRate = totalPossibleRoomDays > 0 ? (bookedRoomDays / totalPossibleRoomDays) * 100 : 0;

    res.status(200).json({
      bookingRate: parseFloat(bookingRate.toFixed(2)),
      totalRooms,
      bookedRoomDays,
      totalPossibleRoomDays,
    });
  } catch (error) {
    console.error("Lỗi khi tính tỷ lệ đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tính tỷ lệ đặt phòng", error: error.message });
  }
});

// GET /api/stats/review-stats - Thống kê đánh giá
router.get("/review-stats", protect, adminOrStaff, async (req, res) => {
  const { startDate, endDate, roomId } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (roomId && !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const query = { isDeleted: false };
    if (roomId) query.roomId = roomId;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
      }
      query.createdAt = { $gte: start, $lte: end };
    }

    const reviews = await Review.find(query);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    res.status(200).json({
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê đánh giá", error: error.message });
  }
});

module.exports = router;