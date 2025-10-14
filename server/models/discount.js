const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên khuyến mãi là bắt buộc'],
    trim: true,
  },
  code: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Loại khuyến mãi là bắt buộc'],
    enum: {
      values: ['voucher', 'festival', 'member', 'accumulated'],
      message: 'Loại khuyến mãi không hợp lệ',
    },
  },
  discountType: {
    type: String,
    required: [true, 'Loại giảm giá là bắt buộc'],
    enum: {
      values: ['percentage', 'fixed'],
      message: 'Loại giảm giá không hợp lệ',
    },
  },
  discountValue: {
    type: Number,
    required: [true, 'Giá trị giảm giá là bắt buộc'],
    min: [0, 'Giá trị giảm giá không thể âm'],
  },
  applicableHotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  }],
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu là bắt buộc'],
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc'],
  },
  minBookingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Số tiền đặt phòng tối thiểu không thể âm'],
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Số tiền giảm tối đa không thể âm'],
  },
  isStackable: {
    type: Boolean,
    default: false,
  },
  membershipLevel: {
    type: String,
    enum: {
      values: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', null],
      message: 'Cấp độ thành viên không hợp lệ',
    },
  },
  minSpending: {
    type: Number,
    min: [0, 'Chi tiêu tối thiểu không thể âm'],
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
  image: {
    type: String,
    trim: true,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

//Virtual: còn hiệu lực hay không
discountSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate;
});

// Pre-save hook để xác thực
discountSchema.pre('save', async function (next) {
  // Đặt các trường không liên quan thành null
  if (this.type !== 'voucher') {
    this.code = null;
  }
  if (this.type !== 'member') {
    this.membershipLevel = null;
  }
  if (this.type !== 'accumulated') {
    this.minSpending = null;
  }

  // Xác thực các trường bắt buộc
  if (this.type === 'voucher' && !this.code) {
    return next(new Error('Mã voucher là bắt buộc cho loại voucher'));
  }
  if (this.type === 'member' && !this.membershipLevel) {
    return next(new Error('Cấp độ thành viên là bắt buộc cho loại member'));
  }
  if (this.type === 'accumulated' && (this.minSpending === null || this.minSpending === undefined)) {
    return next(new Error('Chi tiêu tối thiểu là bắt buộc cho loại accumulated'));
  }

  // Đảm bảo ngày kết thúc lớn hơn ngày bắt đầu
  if (this.startDate >= this.endDate) {
    return next(new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu'));
  }

  next();
});

module.exports = mongoose.model('Discount', discountSchema);