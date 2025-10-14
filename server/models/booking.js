const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },

  roomid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} không phải là email hợp lệ!`,
    },
  },
  phone: {
    type: String,
    required: true,
  },
  checkin: {
    type: Date,
    required: true,
  },
  checkout: {
    type: Date,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
    min: 1,
  },
  children: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
  roomType: {
    type: String,
    required: true,
  },
  specialRequest: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "canceled"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"], // Thêm 'vnpay'
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "canceled"],
    default: "pending",
  },
  paymentDeadline: {
    type: Date,
    default: null, // Thời gian hết hạn thanh toán
  },
  cancelReason: {
    type: String,
    default: null, // Lý do hủy đặt phòng
  },

  voucherDiscount: {
    type: Number,
    default: 0, // Tổng số tiền giảm giá từ voucher
  },
  discount: {
  id: { type: mongoose.Schema.Types.ObjectId, ref: "Discount", default: null },
  name: String,
  discountType: String,
  discountValue: Number,
  amountReduced: Number,
},


  appliedVouchers: [
    {
      code: String,
      discount: Number, // Danh sách voucher đã áp dụng
    },
  ],
  diningServices: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  momoOrderId: {
    type: String,
    default: null, // Lưu orderId từ MoMo
  },
  momoRequestId: {
    type: String,
    default: null, // Lưu requestId từ MoMo
  },
  momoTransactionId: {
    type: String,
    default: null, // Lưu transactionId từ MoMo (sau khi thanh toán thành công)
  },
  vnpOrderId: {
    type: String,
    default: null, // Lưu orderId từ VNPay
  },
  vnpRequestId: {
    type: String,
    default: null, // Lưu requestId từ VNPay
  },
  vnpTransactionId: {
    type: String,
    default: null, // Lưu transactionId từ VNPay (sau khi thanh toán thành công)
  },

  roomsBooked: { type: Number, default: 1 },

});

// Thêm index
bookingSchema.index({ roomid: 1, paymentStatus: 1 });
bookingSchema.index({ email: 1, paymentStatus: 1 });
bookingSchema.index({ roomid: 1, email: 1, paymentStatus: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
