// regionsRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const { protect, admin } = require('../middleware/auth');
const regionsController = require('../controllers/regionsController'); 

// Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// POST /api/regions - Tạo region mới
router.post('/', protect, admin, upload.single("image"), regionsController.createRegion);

// GET /api/regions - Lấy danh sách regions
router.get('/', regionsController.getRegions);

// POST /api/regions/assign-admin - Phân quyền admin khu vực
router.post('/assign-admin', protect, admin, regionsController.assignAdmin);

// GET /api/admin/hotels-by-region - Admin xem các khách sạn trong khu quản lý
router.get('/admin/hotels-by-region', protect, admin, regionsController.getHotelsByRegion);

// POST /api/regions/:id/image - Upload ảnh cho region
router.post('/:id/image', upload.single('image'), regionsController.uploadRegionImage);
// DELETE /api/regions/:id/image - Xóa ảnh cho region
router.delete(':id/image',regionsController.deleteRegionImage);

module.exports = router;