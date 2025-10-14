const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  icon: {
    type: String,
    default: 'fas fa-concierge-bell'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  operatingHours: {
    open: {
      type: String,
      default: '06:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  },
  capacity: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  requiresBooking: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
serviceSchema.index({ hotelId: 1, isAvailable: 1 });

module.exports = mongoose.model('Service', serviceSchema); 