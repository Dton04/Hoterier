const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { protect, admin } = require('../middleware/auth');

// POST /api/discounts - Tạo khuyến mãi/voucher mới
router.post('/', protect, admin, discountController.createDiscount);

// PUT /api/discounts/:id - Cập nhật khuyến mãi/voucher
router.put('/:id', protect, admin, discountController.updateDiscount);

// GET /api/discounts - Lấy tất cả khuyến mãi công khai
router.get('/', discountController.getPublicDiscounts);

// GET /api/discounts/admin - Lấy tất cả khuyến mãi cho admin
router.get('/admin', protect, admin, discountController.getAllDiscountsAdmin);

// GET /api/discounts/member - Lấy khuyến mãi cấp thành viên
router.get('/member', protect, discountController.getMemberDiscounts);

// GET /api/discounts/accumulated - Lấy khuyến mãi tích lũy (dựa trên chi tiêu)
router.get('/accumulated', protect, discountController.getAccumulatedDiscounts);

// DELETE /api/discounts/:id - Xóa mềm khuyến mãi
router.delete('/:id', protect, admin, discountController.deleteDiscount);

// POST /api/discounts/apply - Áp dụng nhiều khuyến mãi vào một đặt phòng
router.post('/apply', protect, discountController.applyDiscounts);

// POST /api/discounts/collect/:identifier - Thu thập mã khuyến mãi
router.post('/collect/:identifier', protect, discountController.collectDiscount);

// GET /api/discounts/my-vouchers - Lấy tất cả mã user đã thu thập
router.get("/my-vouchers", protect, discountController.getMyVouchers);

// GET /api/discounts/:id/hotels - Lấy các khách sạn áp dụng discount
router.get('/:id/hotels', discountController.getHotelsByDiscountId);

// GET /api/discounts/festival - Lấy danh sách các khuyến mãi lễ hội đang hoạt động
router.get('/festival', discountController.getFestivalDiscounts);

// GET /api/discounts/:id/festival-hotels - Lấy chi tiết 1 lễ hội + danh sách khách sạn áp dụng
router.get('/:id/festival-hotels', discountController.getFestivalDiscountDetails);

module.exports = router;