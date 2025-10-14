const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    // Tên khu vực
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    // ID admin quản lý khu vực
  },
  hotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    // Danh sách khách sạn/phòng trong khu vực
  }],
  imageUrl: { type: String },
  
  createdAt: {
    type: Date,
    default: Date.now,
    // Thời gian tạo
  },
});

module.exports = mongoose.model('Region', regionSchema);