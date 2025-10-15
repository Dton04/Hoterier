const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true,
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }],
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  starRating: {
    type: Number,
    default: 3,
  },
  description: {
    type: String,
  },
  imageurls: [String],
  rules: {
    type: String,
    default: "Nhận phòng từ 14:00, trả phòng trước 12:00. Không hút thuốc trong phòng."
  },
  legalInfo: {
    type: String,
    default: "Khách sạn hoạt động theo quy định pháp luật Việt Nam, có giấy phép kinh doanh hợp lệ."
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Hotel', hotelSchema);