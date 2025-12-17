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
    trim: true,
  },
  domain: {
    type: String,
    enum: ['north', 'central', 'south', 'other'],
    default: 'other',
    required: true,
  },
  cities: [citySchema],
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

// Index để tìm kiếm nhanh hơn
regionSchema.index({ domain: 1 });

module.exports = mongoose.model('Region', regionSchema);