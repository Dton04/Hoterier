const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: function() {
      return this.type === 'earn'; // Chỉ bắt buộc với type 'earn'
    },
  },
  amount: {
    type: Number,
    required: function() {
    return this.type === 'earn';
    },
  },
  points: {
    type: Number,
    required: true, // Số điểm tích được
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'reward_redemption'],
    default: 'earn', // Loại giao dịch: tích điểm hoặc đổi điểm
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  description: { 
    type: String,
    required: false, 
    default: 'Không có mô tả', 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ userId: 1, bookingId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);