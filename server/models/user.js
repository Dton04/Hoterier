const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    maxlength: 10,
  },
  avatar: {
    type: String,
    default: '',
  },
  points: {
    type: Number,
    default: 0,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    default: null,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
  ],
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  vouchers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserVoucher',
    },
  ],
}, {
  timestamps: true,
});

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;