const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true, // Mỗi phòng phải thuộc về một khách sạn
  },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true }, // Ví dụ: Deluxe, Standard...
  description: { type: String, required: true },

  maxcount: { type: Number, required: true }, // số người tối đa
  beds: { type: Number, required: true },     // số giường
  baths: { type: Number, required: true },    // số phòng tắm

  rentperday: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 1 }, // số lượng phòng loại này

  phonenumber: { type: String, trim: true },

  imageurls: [{ type: String }],

  amenities: [{
    type: String,
    enum: [
      "WiFi miễn phí",
      "Máy lạnh",
      "TV màn hình phẳng",
      "Ban công",
      "Phòng tắm riêng",
      "Bữa sáng miễn phí",
      "Máy sấy tóc",
      "Tủ lạnh nhỏ",
      "Két sắt",
      "Bồn tắm",
      "View thành phố",
      "Bàn làm việc",
      "Dịch vụ phòng",
      "Điều hòa nhiệt độ",
    ],
  }],

  availabilityStatus: {
    type: String,
    enum: ["available", "maintenance", "busy"],
    default: "available",
  },

  currentbookings: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
      checkin: { type: Date, required: true },
      checkout: { type: Date, required: true },
      roomsBooked: { type: Number, default: 1},
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
