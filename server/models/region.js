// models/region.js
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  hotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
});

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  cities: [citySchema], // 🏙️ Thêm danh sách thành phố trực thuộc
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  hotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  }],
  imageUrl: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Region', regionSchema);
