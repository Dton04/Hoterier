// hotelRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const hotelController = require('../controllers/hotelController'); // Assume controllers folder

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPEG, PNG hoặc GIF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// GET /api/hotels - Lấy danh sách tất cả khách sạn
router.get('/', hotelController.getAllHotels);

// GET /api/hotels/:id - Lấy chi tiết khách sạn
router.get('/:id', hotelController.getHotelById);

// POST /api/hotels/:id/images - Tải ảnh khách sạn
router.post('/:id/images', protect, admin, upload.array('images', 5), hotelController.uploadHotelImages);

// DELETE /api/hotels/:id/images/:imgId - Xóa ảnh khách sạn
router.delete('/:id/images/:imgId', protect, admin, hotelController.deleteHotelImage);

// POST /api/hotels - Tạo khách sạn mới
router.post('/', protect, admin, hotelController.createHotel);

// PUT /api/hotels/:id - Cập nhật thông tin khách sạn
router.put('/:id', protect, admin, hotelController.updateHotel);

// DELETE /api/hotels/:id - Xóa khách sạn
router.delete('/:id', protect, admin, hotelController.deleteHotel);

// POST /api/hotels/region - Phân vùng khu vực quản lý
router.post('/region', protect, admin, hotelController.assignRegion);

// GET /api/hotels/:id/rooms - Lấy khách sạn và danh sách phòng
router.get('/:id/rooms', hotelController.getHotelWithRooms);

router.get('/', async (req, res) => {
  try {
    const { discountId } = req.query;
    if (discountId) {
      const discount = await Discount.findById(discountId).populate('applicableHotels');
      return res.json(discount ? discount.applicableHotels : []);
    }
    // nếu không có filter thì trả toàn bộ hotel như cũ
    return hotelController.getAllHotels(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/festival/:id', hotelController.getHotelsByFestival);
router.get('/:id/available-rooms', hotelController.getAvailableRoomsByHotelId);

module.exports = router;