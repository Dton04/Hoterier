// favoriteRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Hotel = require('../models/hotel');
const { protect } = require('../middleware/auth');

// POST /api/favorites - Thêm phòng vào danh sách yêu thích
router.post('/', protect, async (req, res) => {
  const { hotelId} = req.body;
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: 'ID KS không hợp lệ' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.favorites.includes(hotelId)) {
      return res.status(400).json({ message: 'Hotel đã có trong danh sách yêu thích' });
    }

    user.favorites.push(hotelId);
    await user.save();

    res.status(201).json({ message: 'Đã thêm khách sạn vào danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi khi thêm phòng vào yêu thích:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm phòng vào yêu thích', error: error.message });
  }
});

// DELETE /api/favorites/:hotelId- Xóa phòng khỏi danh sách yêu thích
router.delete('/:hotelId', protect, async (req, res) => {
  const { hotelId } = req.params;
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: 'ID KS không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const index = user.favorites.indexOf(hotelId);
    if (index === -1) {
      return res.status(400).json({ message: 'Khách sạn không có trong danh sách yêu thích' });
    }

    user.favorites.splice(index, 1);
    await user.save();

    res.status(200).json({ message: 'Đã xóa phòng khỏi danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi khi xóa phòng khỏi yêu thích:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa phòng khỏi yêu thích', error: error.message });
  }
});

// GET /api/favorites - Lấy danh sách khách sạn yêu thích
router.get('/', protect, async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: 'Hotel',
      select: '_id name address region starRating imageurls description',
      populate: { path: 'region', select: 'name' },
    });

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn yêu thích:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn yêu thích', error: error.message });
  }
});

module.exports = router;