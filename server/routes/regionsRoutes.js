const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/auth');
const regionsController = require('../controllers/regionsController');
const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 🟢 CRUD routes
router.get('/', regionsController.getRegions);
router.post('/', protect, admin, upload.single("image"), regionsController.createRegion);
router.put('/:id', protect, admin, upload.single("image"), regionsController.updateRegion); // ✅ Thêm route PUT
router.post('/:regionId/cities', protect, admin, regionsController.addCityToRegion);
router.post('/:id/image', protect, admin, upload.single("image"), regionsController.uploadRegionImage);
router.delete('/:id/image', protect, admin, regionsController.deleteRegionImage);
router.delete('/:id', protect, admin, regionsController.deleteRegion);

module.exports = router;