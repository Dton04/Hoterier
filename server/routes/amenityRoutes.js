const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const amenityController = require('../controllers/amenityController');

// GET /api/amenities
router.get('/', amenityController.getAmenities);

module.exports = router;
