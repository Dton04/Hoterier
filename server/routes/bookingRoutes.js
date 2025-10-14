// bookingRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/auth');
const bookingController = require("../controllers/bookingController"); 

// POST /api/bookings/apply-promotions - Áp dụng khuyến mãi
router.post("/apply-promotions", bookingController.applyPromotions);

// POST /api/bookings/checkout - Tạo giao dịch mới và tích điểm
router.post('/checkout', protect, bookingController.checkout);

// POST /api/bookings - Đặt phòng
router.post("/", bookingController.createBooking);

// POST /api/bookings/bookroom - Đặt phòng
router.post("/bookroom", bookingController.bookRoom);

// DELETE /api/bookings/:id - Hủy đặt phòng
router.delete("/:id", bookingController.cancelBooking);

// PUT /api/bookings/:id/confirm - Xác nhận đặt phòng
router.put("/:id/confirm", bookingController.confirmBooking);

// GET /api/bookings - Lấy danh sách đặt phòng
router.get("/", bookingController.getBookings);

// GET /api/bookings/room/:roomId - Lấy danh sách đặt phòng theo phòng
router.get("/room/:roomId", bookingController.getBookingsByRoom);

// GET /api/bookings/stats/daily - Thống kê doanh thu theo ngày
router.get("/stats/daily", bookingController.getDailyStats);

// GET /api/bookings/stats/monthly - Thống kê doanh thu theo tháng
router.get("/stats/monthly", bookingController.getMonthlyStats);

// PATCH /api/bookings/:id/note - Cập nhật ghi chú
router.patch("/:id/note", bookingController.updateNote);

// POST /api/bookings/:id/assign-room - Gán phòng mới
router.post("/:id/assign-room", bookingController.assignRoom);

// PATCH /api/bookings/:id/extend - Gia hạn thời gian lưu trú
router.patch("/:id/extend", bookingController.extendStay);

// POST /api/bookings/cancel-reason - Gửi lý do hủy
router.post("/cancel-reason", bookingController.sendCancelReason);

//Lấy lý do hủy
router.get("/cancel-reason",bookingController.getCancelReason);

// PATCH /api/bookings/:id/payment-method - Cập nhật phương thức thanh toán
router.patch("/:id/payment-method", bookingController.updatePaymentMethod);

module.exports = router;