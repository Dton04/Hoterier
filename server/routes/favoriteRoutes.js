// favoriteRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

// POST /api/favorites - Thêm phòng vào danh sách yêu thích
router.post('/', protect, favoriteController.addFavorite);

// DELETE /api/favorites/:hotelId- Xóa phòng khỏi danh sách yêu thích
router.delete('/:hotelId', protect, favoriteController.removeFavorite);

// GET /api/favorites - Lấy danh sách khách sạn yêu thích
router.get('/', protect, favoriteController.getFavorites);

module.exports = router;