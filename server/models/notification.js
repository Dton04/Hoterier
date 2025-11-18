const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Không bắt buộc vì đây có thể là thông báo hệ thống
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['system', 'general', 'admin'],
    default: 'general',
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error'],
    default: 'info',
  },
  audience: {
    type: String,
    enum: ['all', 'staff', 'user', 'admin'],
    default: 'all',
  },
  startsAt: {
    type: Date,
    default: null,
  },
  endsAt: {
    type: Date,
    default: null,
  },
  isOutdated: {
    type: Boolean,
    default: false,
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
  // Booking-related metadata
  hotelName: { type: String, default: null },
  checkin: { type: Date, default: null },
  checkout: { type: Date, default: null },
  adults: { type: Number, default: null },
  children: { type: Number, default: null },
  roomsBooked: { type: Number, default: null },
  amountPaid: { type: Number, default: null },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);