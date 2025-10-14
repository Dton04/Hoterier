// favoriteRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Room = require('../models/room');
const { protect } = require('../middleware/auth');

// POST /api/favorites - Thêm phòng vào danh sách yêu thích
router.post('/', protect, async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.favorites.includes(roomId)) {
      return res.status(400).json({ message: 'Phòng đã có trong danh sách yêu thích' });
    }

    user.favorites.push(roomId);
    await user.save();

    res.status(201).json({ message: 'Đã thêm phòng vào danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi khi thêm phòng vào yêu thích:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi thêm phòng vào yêu thích', error: error.message });
  }
});

// DELETE /api/favorites/:roomId - Xóa phòng khỏi danh sách yêu thích
router.delete('/:roomId', protect, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const index = user.favorites.indexOf(roomId);
    if (index === -1) {
      return res.status(400).json({ message: 'Phòng không có trong danh sách yêu thích' });
    }

    user.favorites.splice(index, 1);
    await user.save();

    res.status(200).json({ message: 'Đã xóa phòng khỏi danh sách yêu thích' });
  } catch (error) {
    console.error('Lỗi khi xóa phòng khỏi yêu thích:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa phòng khỏi yêu thích', error: error.message });
  }
});

// GET /api/favorites - Lấy danh sách phòng yêu thích
router.get('/', protect, async (req, res) => {
  const userId = req.user._id;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const user = await User.findById(userId).populate({
      path: 'favorites',
      select: '_id name maxcount beds baths rentperday type description imageurls availabilityStatus hotelId',
      populate: {
        path: 'hotelId',
        select: 'name address',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng yêu thích:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng yêu thích', error: error.message });
  }
});

module.exports = router;