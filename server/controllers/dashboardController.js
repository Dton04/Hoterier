const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Room = require("../models/room");

// Thống kê tổng quan cho admin
exports.getOverviewStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    // Đếm tổng số đặt phòng, đánh giá và tính doanh thu
    const [totalBookings, totalReviews, confirmedBookings] = await Promise.all([
      Booking.countDocuments({ status: { $in: ["confirmed", "completed"] } }),
      Review.countDocuments({ isDeleted: false }),
      Booking.find({ status: "confirmed" }).populate("roomid", "rentperday"),
    ]);

    const totalRevenue = confirmedBookings.reduce((total, booking) => {
      if (!booking.roomid?.rentperday) return total;
      const checkin = new Date(booking.checkin);
      const checkout = new Date(booking.checkout);
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      return total + booking.roomid.rentperday * days;
    }, 0);

    res.status(200).json({
      totalBookings,
      totalReviews,
      totalRevenue,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê tổng quan:", error.message);
    res.status(500).json({ message: "Lỗi khi lấy thống kê tổng quan", error: error.message });
  }
};

// Thống kê doanh thu theo tháng
exports.getMonthlyStats = async (req, res) => {
  const { month, year } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const query = { status: "confirmed" };
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
        return res.status(400).json({ message: "Tháng hoặc năm không hợp lệ" });
      }

      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);
      query.checkin = { $gte: startDate, $lte: endDate };
    }

    const bookings = await Booking.find(query).populate("roomid", "rentperday");

    const revenue = bookings.reduce((acc, b) => {
      if (!b.roomid?.rentperday) return acc;
      const checkin = new Date(b.checkin);
      const checkout = new Date(b.checkout);
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      const key = month && year
        ? `${year}-${month.padStart(2, "0")}`
        : `${checkin.getFullYear()}-${String(checkin.getMonth() + 1).padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + b.roomid.rentperday * days;
      return acc;
    }, {});

    res.status(200).json({ revenue });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
  }
};