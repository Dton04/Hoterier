// review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false, // Không bắt buộc, vì đánh giá là cho khách sạn
  },
  userName: {
    type: String,
    required: false,
    default: 'Ẩn danh',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} không phải là email hợp lệ!`
    },
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Cập nhật index
reviewSchema.index({ hotelId: 1, isDeleted: 1 });
reviewSchema.index({ email: 1, isDeleted: 1 });

module.exports = mongoose.model('Review', reviewSchema);