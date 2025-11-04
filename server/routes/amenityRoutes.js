const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const amenityController = require('../controllers/amenityController');

// GET /api/amenities
router.get('/', amenityController.getAmenities);

// DELETE /api/amenities/:id - Xóa tiện ích (admin)
router.delete('/:id', protect, admin, amenityController.deleteAmenity);

// POST /api/amenities - Tạo tiện ích (admin)
router.post('/', protect, admin, amenityController.createAmenity);

module.exports = router;
