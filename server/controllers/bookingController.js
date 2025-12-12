// bookingController.js
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");
const Discount = require("../models/discount");
const Notification = require('../models/notification');
const Hotel = require('../models/hotel');
const Transaction = require('../models/transaction');
const User = require("../models/user");
const Service = require("../models/service");
const UserVoucher = require("../models/userVouchers");
const nodemailer = require("nodemailer");

// ===============================
// HÀM DÙNG CHUNG
// ===============================

// Hàm khởi tạo tồn kho theo ngày
function getOrInitInventory(room, dayStr) {
  if (!room.dailyInventory) {
    room.dailyInventory = [];
  }

  let daily = room.dailyInventory.find(d => d.date === dayStr);

  if (!daily) {
    daily = { date: dayStr, quantity: room.quantity };
    room.dailyInventory.push(daily);
  }

  return daily;
}

// ===== HELPER: Format ngày theo LOCAL timezone (giống roomController) =====
function formatLocalDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Chuẩn hóa checkin/checkout về 14:00 / 12:00 (UTC để tránh lệch múi giờ)
function normalizeCheckin(dateStr) {
  const d = new Date(dateStr);
  // Sử dụng UTC để tránh vấn đề chuyển đổi múi giờ
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 14, 0, 0, 0));
}

function normalizeCheckout(dateStr) {
  const d = new Date(dateStr);
  // Sử dụng UTC để tránh vấn đề chuyển đổi múi giờ
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0));
}

// Giả lập hàm xử lý thanh toán qua tài khoản ngân hàng
const processBankPayment = async (booking, session) => {
  try {
    // Tạo mã giao dịch ngân hàng duy nhất với prefix rõ ràng
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const bankTransactionId = `BODO${timestamp}${random}`;

    // Thông tin ngân hàng
    const bankInfo = {
      bankName: "Vietcombank",
      accountNumber: "1234567890",
      accountHolder: "CONG TY TNHH KHACH SAN ABC",
      swiftCode: "BFTVVNVX",
      branch: "Chi nhánh HCM",
      amount: booking.totalAmount,
      content: `BODO_${booking._id}_${bankTransactionId}`,
      expiryTime: new Date(Date.now() + 30 * 60000), // 30 phút
    };

    // Cập nhật booking
    booking.bankTransactionId = bankTransactionId;
    booking.bankPaymentExpiry = bankInfo.expiryTime;
    await booking.save({ session });

    // Timeout tự hủy nếu quá hạn
    setTimeout(async () => {
      try {
        const unpaidBooking = await Booking.findById(booking._id);
        if (unpaidBooking && unpaidBooking.paymentStatus === 'pending') {
          unpaidBooking.status = 'canceled';
          unpaidBooking.cancelReason = 'Hết thời gian thanh toán';
          await unpaidBooking.save();
        }
      } catch (error) {
        console.error('Lỗi khi hủy booking timeout:', error);
      }
    }, 30 * 60000);

    return {
      success: true,
      message: "Vui lòng chuyển khoản theo thông tin dưới đây để hoàn tất thanh toán. Bạn có 30 phút để hoàn thành.",
      bankInfo,
      expiryTime: bankInfo.expiryTime
    };
  } catch (error) {
    throw new Error("Lỗi khi xử lý thanh toán qua tài khoản ngân hàng: " + error.message);
  }
};

// ===============================
// ÁP DỤNG KHUYẾN MÃI
// ===============================

// POST /api/bookings/apply-promotions - Áp dụng khuyến mãi
exports.applyPromotions = async (req, res) => {
  const { bookingData, voucherCodes } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!bookingData || !bookingData.roomid || !bookingData.bookingId || !voucherCodes || !Array.isArray(voucherCodes)) {
      return res.status(400).json({ message: "Dữ liệu đặt phòng, ID đặt phòng hoặc mã khuyến mãi không hợp lệ" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingData.roomid) || !mongoose.Types.ObjectId.isValid(bookingData.bookingId)) {
      return res.status(400).json({ message: "ID phòng hoặc ID đặt phòng không hợp lệ" });
    }

    const booking = await Booking.findById(bookingData.bookingId).lean();
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return res.status(400).json({ message: "Không thể áp dụng khuyến mãi cho đặt phòng đã hủy" });
    }

    const user = await User.findOne({ email: booking.email.toLowerCase() }).lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng liên quan đến đặt phòng" });
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
      return res.status(400).json({ message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
    }

    const room = await Room.findById(bookingData.roomid).lean();
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    // Tính số đêm theo chuẩn (ceil) và nhân số phòng
    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const roomsBooked = Number(booking.roomsBooked) || 1;
    const totalAmount = room.rentperday * Math.max(1, days) * roomsBooked;

    // Lấy danh sách voucher
    const discounts = await Discount.find({
      code: { $in: voucherCodes },
      type: "voucher",
      isDeleted: false,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!discounts.length) {
      return res.status(404).json({ message: "Không tìm thấy mã khuyến mãi hợp lệ" });
    }

    let totalDiscount = 0;
    const appliedVouchers = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      for (const discount of discounts) {
        const now = new Date();
        if (now < discount.startDate || now > discount.endDate) {
          continue;
        }

        if (discount.applicableHotels.length > 0 && !discount.applicableHotels.some((id) => id.equals(bookingData.roomid))) {
          continue;
        }

        if (totalAmount < discount.minBookingAmount) {
          continue;
        }

        const userUsage = discount.usedBy ? discount.usedBy.find((u) => u.userId.equals(user._id)) : null;
        if (userUsage && userUsage.count >= 1) {
          continue;
        }

        let discountAmount = 0;
        if (discount.discountType === "percentage") {
          discountAmount = (totalAmount * discount.discountValue) / 100;
          if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
            discountAmount = discount.maxDiscount;
          }
        } else if (discount.discountType === "fixed") {
          discountAmount = discount.discountValue;
        }

        if (!discount.isStackable && appliedVouchers.length > 0) {
          continue;
        }

        totalDiscount += discountAmount;
        appliedVouchers.push({
          code: discount.code,
          discount: discountAmount,
        });

        if (!discount.usedBy) discount.usedBy = [];
        if (userUsage) {
          userUsage.count += 1;
        } else {
          discount.usedBy.push({ userId: user._id, count: 1 });
        }
        await discount.save({ session });
      }

      totalAmount = Math.max(0, totalAmount - totalDiscount);

      await Booking.updateOne(
        { _id: bookingData.bookingId },
        { voucherDiscount: totalDiscount, appliedVouchers },
        { session }
      );

      await session.commitTransaction();
      res.status(200).json({
        message: "Áp dụng khuyến mãi thành công",
        totalAmount,
        appliedVouchers,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Lỗi khi áp dụng khuyến mãi:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi áp dụng khuyến mãi", error: error.message });
  }
};

// ===============================
// CHECKOUT & TÍCH ĐIỂM
// ===============================

// POST /api/bookings/checkout - Tạo giao dịch mới và tích điểm
exports.checkout = async (req, res) => {
  const { bookingId } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (mongoose.connection.readyState !== 1) {
      throw new Error('Kết nối cơ sở dữ liệu chưa sẵn sàng');
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new Error('ID đặt phòng không hợp lệ');
    }

    const existingTransaction = await Transaction.findOne({ bookingId }).session(session);
    if (existingTransaction) {
      throw new Error('Giao dịch cho đặt phòng này đã được tạo trước đó');
    }

    const booking = await Booking.findById(bookingId)
      .populate('roomid')
      .session(session);
    if (!booking) {
      throw new Error('Không tìm thấy đặt phòng');
    }

    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
      throw new Error('Đặt phòng chưa được xác nhận hoặc chưa thanh toán, không thể tích điểm');
    }

    const user = await User.findOne({ email: booking.email.toLowerCase() })
      .session(session);
    if (!user) {
      throw new Error('Không tìm thấy người dùng liên quan đến đặt phòng');
    }

    if (req.user._id.toString() !== user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
      throw new Error('Không có quyền tích điểm cho người dùng này');
    }

    const checkinDate = new Date(booking.checkin);
    const checkoutDate = new Date(booking.checkout);
    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const totalAmount = booking.roomid.rentperday * days - (booking.voucherDiscount || 0);

    // Lưu ý: công thức này đang là 1% tổng tiền
    const pointsEarned = Math.floor(totalAmount * 0.01);

    const transaction = new Transaction({
      userId: user._id,
      bookingId: booking._id,
      amount: totalAmount,
      points: pointsEarned,
      type: 'earn',
      status: 'completed',
    });
    await transaction.save({ session });

    user.points = (user.points || 0) + pointsEarned;
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      message: 'Tích điểm thành công',
      transaction,
      pointsEarned,
      totalPoints: user.points,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Lỗi khi tích điểm:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tích điểm', error: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// ĐẶT PHÒNG ĐƠN (cũ / đơn giản)
// ===============================

// POST /api/bookings - Đặt phòng
exports.createBooking = async (req, res) => {
  const { roomid, name, email, phone, checkin, checkout, adults, children, roomType, paymentMethod, roomsBooked } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const checkinISO = normalizeCheckin(checkin);
    const checkoutISO = normalizeCheckout(checkout);

    if (isNaN(checkinISO) || isNaN(checkoutISO) || checkinISO >= checkoutISO) {
      return res.status(400).json({ message: "Ngày nhận/trả phòng không hợp lệ" });
    }

    const room = await Room.findById(roomid).session(session);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    // ✅ Kiểm tra tồn kho theo từng ngày (sử dụng LOCAL timezone)
    const checkinDateOnly = new Date(checkinISO.getFullYear(), checkinISO.getMonth(), checkinISO.getDate());
    const checkoutDateOnly = new Date(checkoutISO.getFullYear(), checkoutISO.getMonth(), checkoutISO.getDate());

    for (
      let d = new Date(checkinDateOnly);
      d < checkoutDateOnly;
      d.setDate(d.getDate() + 1)
    ) {
      const dayStr = formatLocalDate(d);
      const daily = getOrInitInventory(room, dayStr);

      if (daily.quantity < roomsBooked) {
        throw new Error(`Không đủ phòng vào ngày ${dayStr}`);
      }

      daily.quantity -= roomsBooked;
    }
    await room.save({ session });

    const days = Math.ceil((checkoutISO - checkinISO) / (1000 * 60 * 60 * 24));
    const totalAmount = room.rentperday * days * roomsBooked;

    const newBooking = new Booking({
      hotelId: room.hotelId,
      roomid,
      name,
      email: email.toLowerCase(),
      phone,
      checkin: checkinISO,
      checkout: checkoutISO,
      adults: Number(adults),
      children: Number(children) || 0,
      roomType,
      paymentMethod,
      totalAmount,
      roomsBooked,
      status: "pending",
      paymentStatus: "pending",
    });

    await newBooking.save({ session });

    // Lưu lịch vào room
    room.currentbookings.push({
      bookingId: newBooking._id,
      checkin: checkinISO,
      checkout: checkoutISO,
      roomsBooked
    });
    await room.save({ session });

    await session.commitTransaction();

    // Thông báo cho người đặt phòng
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      const hotel = await Hotel.findById(room.hotelId).lean();
      const hotelName = hotel?.name || 'Khách sạn';
      if (user) {
        const notif = new Notification({
          userId: null,
          targetUserId: user._id,
          audience: 'user',
          type: 'info',
          category: 'system',
          isSystem: true,
          message: `Đặt phòng thành công tại ${hotelName}`,
          hotelName,
          checkin: checkinISO,
          checkout: checkoutISO,
          adults: Number(adults),
          children: Number(children) || 0,
          roomsBooked: Number(roomsBooked),
          amountPaid: newBooking.totalAmount,
          startsAt: new Date(),
          endsAt: null,
        });
        await notif.save();
        if (global.io) global.io.to(`user:${user._id}`).emit('notification:new', notif);
      }
    } catch (e) {
      console.error('Không thể tạo thông báo đặt phòng:', e.message);
    }

    res.status(201).json({ message: "Đặt phòng thành công", booking: newBooking });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi đặt phòng:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// ĐẶT PHÒNG (BOOKROOM) – CÓ DỊCH VỤ & FESTIVAL
// ===============================

// POST /api/bookings/bookroom - Đặt phòng
exports.bookRoom = async (req, res) => {
  const {
    roomid,
    checkin,
    checkout,
    adults,
    children,
    name,
    email,
    phone,
    paymentMethod,
    roomsBooked,
    diningServices = [],
    appliedVouchers = [],
    voucherDiscount = 0
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      throw new Error("ID phòng không hợp lệ");
    }

    const checkinISO = normalizeCheckin(checkin);
    const checkoutISO = normalizeCheckout(checkout);

    if (isNaN(checkinISO) || isNaN(checkoutISO) || checkinISO >= checkoutISO) {
      throw new Error("Ngày nhận phòng hoặc trả phòng không hợp lệ");
    }

    const room = await Room.findById(roomid).session(session);
    if (!room) {
      throw new Error("Không tìm thấy phòng");
    }

    if (room.quantity < roomsBooked) {
      throw new Error("Số lượng phòng không đủ");
    }

    // ===== TRỪINVENTORY TRƯỚC KHI TẠO BOOKING =====
    // ✅ Giảm tồn kho theo từng ngày (sử dụng LOCAL timezone)
    const checkinDateOnly = new Date(checkinISO.getFullYear(), checkinISO.getMonth(), checkinISO.getDate());
    const checkoutDateOnly = new Date(checkoutISO.getFullYear(), checkoutISO.getMonth(), checkoutISO.getDate());

    for (
      let d = new Date(checkinDateOnly);
      d < checkoutDateOnly;
      d.setDate(d.getDate() + 1)
    ) {
      const dayStr = formatLocalDate(d);
      const daily = getOrInitInventory(room, dayStr);

      if (daily.quantity < roomsBooked) {
        throw new Error(`Không đủ phòng vào ngày ${dayStr}`);
      }

      daily.quantity -= roomsBooked;
    }
    // ===== END INVENTORY DEDUCTION =====

    // Kiểm tra festival discount
    const now = new Date();
    const activeDiscounts = await Discount.find({
      type: "festival",
      applicableHotels: room.hotelId,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    let activeDiscount = null;
    if (activeDiscounts.length > 0) {
      activeDiscount = activeDiscounts.reduce((best, current) => {
        if (current.discountType === "percentage" && (!best || current.discountValue > best.discountValue)) return current;
        if (current.discountType === "fixed" && (!best || current.discountValue > best.discountValue)) return current;
        return best;
      }, null);
    }

    const nights = Math.max(1, Math.ceil((checkoutISO - checkinISO) / (1000 * 60 * 60 * 24)));
    const baseAmount = room.rentperday * nights * Number(roomsBooked || 1);
    let finalAmount = baseAmount;
    let discountApplied = null;

    if (activeDiscount) {
      let reduced = 0;
      if (activeDiscount.discountType === "percentage") {
        reduced = (baseAmount * activeDiscount.discountValue) / 100;
      } else if (activeDiscount.discountType === "fixed") {
        reduced = activeDiscount.discountValue;
      }

      finalAmount = Math.max(baseAmount - reduced, 0);

      discountApplied = {
        id: activeDiscount._id,
        name: activeDiscount.name,
        discountType: activeDiscount.discountType,
        discountValue: activeDiscount.discountValue,
        amountReduced: reduced,
      };
    }

    // Tính chi phí dịch vụ (nếu có)
    let serviceCost = 0;
    if (diningServices && diningServices.length > 0) {
      const services = await Service.find({ _id: { $in: diningServices } }).session(session);
      serviceCost = services.reduce((sum, s) => sum + (s.price || 0), 0);
    }

    // Tạo booking
    const booking = new Booking({
      hotelId: room.hotelId,
      roomid,
      roomType: room.type,
      checkin: checkinISO,
      checkout: checkoutISO,
      adults: Number(adults),
      children: Number(children) || 0,
      name,
      email: email.toLowerCase(),
      phone,
      paymentMethod,
      totalAmount: Math.max(finalAmount + serviceCost - Number(voucherDiscount || 0), 0),
      status: "pending",
      paymentStatus: "pending",
      roomsBooked: Number(roomsBooked),
      diningServices,
      appliedVouchers,
      voucherDiscount,
      discount: discountApplied,
    });

    await booking.save({ session });


    room.currentbookings.push({
      bookingId: booking._id,
      checkin: checkinISO,
      checkout: checkoutISO,
      roomsBooked: Number(roomsBooked)
    });

    // Save room NGAY SAU KHI PUSH currentbookings
    await room.save({ session });


    // Xử lý thanh toán
    let paymentResult;
    switch (paymentMethod) {
      case "bank_transfer":
        paymentResult = await processBankPayment(booking, session);
        break;

      case "vnpay":
        paymentResult = {
          success: true,
          message: "Đang chuyển hướng đến VNPay",
          redirectRequired: true,
          paymentMethod: "vnpay",
          bookingId: booking._id,
          orderId: `VNP${Date.now()}`
        };
        break;

      case "mobile_payment":
        paymentResult = {
          success: true,
          message: "Đang chuyển hướng đến MoMo",
          redirectRequired: true,
          paymentMethod: "momo",
          bookingId: booking._id,
          orderId: `MOMO${Date.now()}`
        };
        break;

      case "cash":
        paymentResult = {
          success: true,
          message: "Vui lòng thanh toán tại quầy lễ tân khi nhận phòng"
        };
        booking.paymentStatus = "pending";
        await booking.save({ session });
        break;

      default:
        throw new Error("Phương thức thanh toán không hợp lệ");
    }

    // Mark vouchers as used
    if (appliedVouchers && appliedVouchers.length > 0) {
      const userId = await User.findOne({ email: email.toLowerCase() }).select('_id');
      if (userId) {
        for (const voucher of appliedVouchers) {
          const code = typeof voucher === 'string' ? voucher : voucher.code;

          await UserVoucher.findOneAndUpdate(
            { userId: userId._id, voucherCode: code, isUsed: false },
            { isUsed: true, usedAt: new Date(), bookingId: booking._id },
            { session }
          );
        }
      }
    }

    await session.commitTransaction();

    // Thông báo
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      const hotel = await Hotel.findById(room.hotelId).lean();
      const hotelName = hotel?.name || 'Khách sạn';
      if (user) {
        const notif = new Notification({
          userId: null,
          targetUserId: user._id,
          audience: 'user',
          type: 'info',
          category: 'system',
          isSystem: true,
          message: `Đặt phòng thành công tại ${hotelName}`,
          hotelName,
          checkin: checkinISO,
          checkout: checkoutISO,
          adults: Number(adults),
          children: Number(children) || 0,
          roomsBooked: Number(roomsBooked),
          amountPaid: booking.totalAmount,
          startsAt: new Date(),
          endsAt: null,
        });
        await notif.save();
        if (global.io) global.io.to(`user:${user._id}`).emit('notification:new', notif);
      }
    } catch (e) { }

    res.status(201).json({
      message: "Đặt phòng thành công",
      booking,
      paymentResult,
      discountApplied,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi đặt phòng:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// BOOK MULTI – NHIỀU PHÒNG
// ===============================

// POST /api/bookings/book-multi - Đặt nhiều phòng (Booking.com style)
exports.bookMulti = async (req, res) => {
  const {
    rooms,           // [{roomid, roomType, roomsBooked, checkin, checkout}, ...]
    customer         // {name, email, phone, adults, children, paymentMethod, diningServices, appliedVouchers, voucherDiscount}
  } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      throw new Error("Phải có ít nhất một phòng trong đơn đặt");
    }

    if (!customer || !customer.name || !customer.email || !customer.phone) {
      throw new Error("Thông tin khách hàng không đầy đủ");
    }

    const firstRoom = await Room.findById(rooms[0].roomid).session(session);
    if (!firstRoom) {
      throw new Error("Không tìm thấy phòng");
    }

    const hotelId = firstRoom.hotelId;

    const checkinISO = normalizeCheckin(rooms[0].checkin);
    const checkoutISO = normalizeCheckout(rooms[0].checkout);

    if (isNaN(checkinISO) || isNaN(checkoutISO) || checkinISO >= checkoutISO) {
      throw new Error("Ngày nhận phòng hoặc trả phòng không hợp lệ");
    }

    let totalPrice = 0;
    const roomDetails = [];

    for (const roomItem of rooms) {
      if (!mongoose.Types.ObjectId.isValid(roomItem.roomid)) {
        throw new Error("ID phòng không hợp lệ");
      }

      const room = await Room.findById(roomItem.roomid).session(session);
      if (!room) {
        throw new Error(`Không tìm thấy phòng ${roomItem.type}`);
      }

      let roomCheckin = normalizeCheckin(roomItem.checkin);
      let roomCheckout = normalizeCheckout(roomItem.checkout);

      // ✅ Sử dụng LOCAL timezone để tránh lệch ngày khi lưu vào dailyInventory
      const checkinDateOnly = new Date(roomCheckin.getFullYear(), roomCheckin.getMonth(), roomCheckin.getDate());
      const checkoutDateOnly = new Date(roomCheckout.getFullYear(), roomCheckout.getMonth(), roomCheckout.getDate());

      // Giảm tồn kho từng ngày cho roomItem
      for (
        let d = new Date(checkinDateOnly);
        d < checkoutDateOnly;
        d.setDate(d.getDate() + 1)
      ) {
        const dayStr = formatLocalDate(d);
        const daily = getOrInitInventory(room, dayStr);

        if (daily.quantity < roomItem.roomsBooked) {
          throw new Error(`Không đủ phòng vào ngày ${dayStr}`);
        }

        daily.quantity -= roomItem.roomsBooked;
      }

      // Tính tiền
      const days = Math.max(1, Math.ceil((roomCheckout - roomCheckin) / 86400000));
      const roomPrice = room.rentperday * roomItem.roomsBooked * days;
      totalPrice += roomPrice;

      roomDetails.push({
        roomid: room._id,
        roomType: room.type,
        roomsBooked: roomItem.roomsBooked,
        checkin: roomCheckin,
        checkout: roomCheckout,
        finalAmount: roomPrice,
        rentperday: room.rentperday
      });

      // NOTE: currentbookings sẽ được push SAU khi tạo booking (vì cần bookingId)
      // Tạm thời save room với inventory đã trừ
      await room.save({ session });
    }

    // Dịch vụ
    let serviceCost = 0;
    if (customer.diningServices && customer.diningServices.length > 0) {
      const services = await Service.find({ _id: { $in: customer.diningServices } }).session(session);
      serviceCost = services.reduce((sum, s) => sum + s.price, 0);
    }

    // Voucher
    const voucherDiscount = customer.voucherDiscount || 0;

    // Tổng tiền cuối
    let finalAmount = Math.max(0, totalPrice + serviceCost - voucherDiscount);


    // Tạo booking
    const booking = new Booking({
      hotelId,
      rooms: roomDetails,
      roomid: rooms[0].roomid,
      roomType: roomDetails.length === 1
        ? roomDetails[0].roomType
        : "Nhiều loại phòng",
      name: customer.name,
      email: customer.email.toLowerCase(),
      phone: customer.phone,
      checkin: checkinISO,
      checkout: checkoutISO,
      adults: Number(customer.adults),
      children: Number(customer.children) || 0,
      specialRequest: customer.specialRequest || null,
      paymentMethod: customer.paymentMethod,
      totalAmount: finalAmount,
      status: "pending",
      paymentStatus: "pending",
      diningServices: customer.diningServices || [],
      appliedVouchers: customer.appliedVouchers || [],
      voucherDiscount,
      roomsBooked: rooms.reduce((sum, r) => sum + r.roomsBooked, 0)
    });

    await booking.save({ session });

    // ===== PUSH VÀO CURRENTBOOKINGS CỦA MỖI PHÒNG =====
    // Sau khi có bookingId, cập nhật currentbookings cho từng phòng
    for (const roomDetail of roomDetails) {
      const room = await Room.findById(roomDetail.roomid).session(session);
      if (room) {
        room.currentbookings.push({
          bookingId: booking._id,
          checkin: roomDetail.checkin,
          checkout: roomDetail.checkout,
          roomsBooked: roomDetail.roomsBooked
        });
        await room.save({ session });
      }
    }
    // ===== END CURRENTBOOKINGS UPDATE =====

    // Kiểm tra festival discount cho toàn khách sạn
    const now = new Date();
    const activeDiscounts = await Discount.find({
      type: "festival",
      applicableHotels: hotelId,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).session(session);

    let appliedDiscount = null;
    if (activeDiscounts.length > 0) {
      appliedDiscount = activeDiscounts.reduce((best, current) => {
        if (current.discountType === "percentage" && (!best || current.discountValue > best.discountValue)) return current;
        if (current.discountType === "fixed" && (!best || current.discountValue > best.discountValue)) return current;
        return best;
      }, null);
    }

    // Áp dụng giảm giá lễ hội (nếu có) cho tổng đơn và lưu vào booking
    if (appliedDiscount) {
      let reduced = 0;
      if (appliedDiscount.discountType === "percentage") {
        reduced = (finalAmount * appliedDiscount.discountValue) / 100;
        if (appliedDiscount.maxDiscount && reduced > appliedDiscount.maxDiscount) {
          reduced = appliedDiscount.maxDiscount;
        }
      } else if (appliedDiscount.discountType === "fixed") {
        reduced = appliedDiscount.discountValue;
      }

      finalAmount = Math.max(finalAmount - reduced, 0);

      await Booking.findByIdAndUpdate(
        booking._id,
        {
          totalAmount: finalAmount,
          discount: {
            id: appliedDiscount._id,
            name: appliedDiscount.name,
            discountType: appliedDiscount.discountType,
            discountValue: appliedDiscount.discountValue,
            amountReduced: reduced,
          },
        },
        { session }
      );
    }

    // Xử lý thanh toán
    let paymentResult = {};

    switch (customer.paymentMethod) {
      case "bank_transfer":
        paymentResult = await processBankPayment(booking, session);
        break;

      case "vnpay":
        paymentResult = {
          success: true,
          redirectRequired: true,
          paymentMethod: "vnpay",
          bookingId: booking._id,
          orderId: `VNP${Date.now()}`
        };
        break;

      case "mobile_payment":
        paymentResult = {
          success: true,
          redirectRequired: true,
          paymentMethod: "momo",
          bookingId: booking._id,
          orderId: `MOMO${Date.now()}`
        };
        break;

      case "cash":
        paymentResult = {
          success: true,
          message: "Thanh toán tại quầy khi nhận phòng."
        };
        booking.paymentStatus = "pending";
        await booking.save({ session });
        break;

      default:
        throw new Error("Phương thức thanh toán không hợp lệ");
    }

    // Mark vouchers as used
    if (customer.appliedVouchers && customer.appliedVouchers.length > 0) {
      const userId = await User.findOne({ email: customer.email.toLowerCase() }).select('_id');
      if (userId) {
        for (const voucher of customer.appliedVouchers) {
          const code = typeof voucher === 'string' ? voucher : voucher.code;

          await UserVoucher.findOneAndUpdate(
            { userId: userId._id, voucherCode: code, isUsed: false },
            { isUsed: true, usedAt: new Date(), bookingId: booking._id },
            { session }
          );
        }
      }
    }

    await session.commitTransaction();

    // Thông báo
    try {
      const user = await User.findOne({ email: customer.email.toLowerCase() });
      const hotel = await Hotel.findById(hotelId).lean();
      const hotelName = hotel?.name || 'Khách sạn';
      if (user) {
        const notif = new Notification({
          userId: null,
          targetUserId: user._id,
          audience: 'user',
          type: 'info',
          category: 'system',
          isSystem: true,
          message: `Đã thanh toán thành công cho đơn đặt phòng tại ${hotelName}`,
          hotelName,
          checkin: checkinISO,
          checkout: checkoutISO,
          adults: Number(customer.adults),
          children: Number(customer.children) || 0,
          roomsBooked: rooms.reduce((sum, r) => sum + r.roomsBooked, 0),
          amountPaid: booking.totalAmount,
          startsAt: new Date(),
          endsAt: null,
        });
        await notif.save();
        if (global.io) global.io.to(`user:${user._id}`).emit('notification:new', notif);
      }
    } catch (e) {
      console.error('Không thể tạo thông báo book-multi:', e.message);
    }

    return res.status(201).json({
      message: "Đặt nhiều phòng thành công!",
      booking,
      paymentResult,
      totalAmount: finalAmount,
      roomsBooked: rooms.length,
      appliedDiscount
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi book-multi:", error.message);
    res.status(500).json({ message: error.message || "Lỗi khi đặt phòng" });
  } finally {
    session.endSession();
  }
};

// ===============================
// HỦY BOOKING
// ===============================

// DELETE /api/bookings/:id - Hủy đặt phòng
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Kết nối cơ sở dữ liệu chưa sẵn sàng");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID đặt phòng không hợp lệ");
    }

    session.startTransaction();

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new Error("Không tìm thấy đặt phòng với ID này");
    }
    if (booking.status === "canceled") {
      throw new Error("Đặt phòng đã bị hủy trước đó");
    }
    if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
      throw new Error("Đặt phòng đã xác nhận và thanh toán, không thể hủy.");
    }

    booking.status = "canceled";
    booking.paymentStatus = booking.paymentStatus === "paid" ? "refunded" : "pending";
    booking.cancelDate = new Date();
    await booking.save({ session });

    const room = await Room.findById(booking.roomid).session(session);
    if (room) {
      room.currentbookings = room.currentbookings.filter(
        (b) => !b.bookingId || b.bookingId.toString() !== id
      );
      await room.save({ session });
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "Hủy đặt phòng thành công",
      booking: { _id: booking._id, status: booking.status, cancelDate: booking.cancelDate }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi hủy đặt phòng:", error.message);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// XÁC NHẬN BOOKING + AUTO TÍCH ĐIỂM
// ===============================

// PUT /api/bookings/:id/confirm - Xác nhận đặt phòng
exports.confirmBooking = async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID đặt phòng không hợp lệ");
    }

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new Error("Không tìm thấy đặt phòng với ID này");
    }

    if (booking.status === "confirmed") {
      throw new Error("Đặt phòng này đã được xác nhận trước đó");
    }

    if (booking.status === "canceled") {
      throw new Error("Không thể xác nhận một đặt phòng đã bị hủy");
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    await booking.save({ session });

    // Auto tích điểm
    try {
      const user = await User.findOne({ email: booking.email.toLowerCase() }).session(session);
      if (user) {
        const room = await Room.findById(booking.roomid).session(session);
        const checkinDate = new Date(booking.checkin);
        const checkoutDate = new Date(booking.checkout);
        const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        const totalAmount =
          (room.rentperday * days)
          - (booking.voucherDiscount || 0)
          - (booking.discount?.amountReduced || 0);

        const pointsEarned = Math.floor(totalAmount * 0.01);

        const existingTransaction = await Transaction.findOne({ bookingId: id }).session(session);
        if (!existingTransaction) {
          const transaction = new Transaction({
            userId: user._id,
            bookingId: booking._id,
            amount: totalAmount,
            points: pointsEarned,
            type: 'earn',
            status: 'completed',
          });
          await transaction.save({ session });

          user.points = (user.points || 0) + pointsEarned;
          await user.save({ session });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tích điểm tự động:', error.message);
    }

    await session.commitTransaction();

    // Notification
    try {
      const user = await User.findOne({ email: booking.email.toLowerCase() });
      const room = await Room.findById(booking.roomid).lean();
      const hotel = room ? await Hotel.findById(room.hotelId).lean() : null;
      const hotelName = hotel?.name || 'Khách sạn';
      if (user) {
        const notif = new Notification({
          userId: null,
          targetUserId: user._id,
          audience: 'user',
          type: 'info',
          category: 'system',
          isSystem: true,
          message: `Đơn đặt phòng tại ${hotelName} đã được duyệt`,
          hotelName,
          checkin: booking.checkin,
          checkout: booking.checkout,
          adults: Number(booking.adults),
          children: Number(booking.children) || 0,
          roomsBooked: Number(booking.roomsBooked) || 1,
          amountPaid: booking.totalAmount,
          startsAt: new Date(),
          endsAt: null,
        });
        await notif.save();
        if (global.io) global.io.to(`user:${user._id}`).emit('notification:new', notif);
      }
    } catch (e) {
      console.error('Không thể tạo thông báo duyệt đơn:', e.message);
    }

    res.status(200).json({ message: "Xác nhận đặt phòng thành công", booking });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi xác nhận đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xác nhận đặt phòng", error: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// LẤY DANH SÁCH BOOKING
// ===============================

// GET /api/bookings - Lấy danh sách đặt phòng
exports.getBookings = async (req, res) => {
  const { status, email, ownerEmail } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const query = {};
    if (status && ["pending", "confirmed", "canceled"].includes(status)) {
      query.status = status;
    }
    if (email) {
      query.email = email.toLowerCase();
    }

    // Lọc theo khách sạn thuộc ownerEmail (staff)
    if (ownerEmail) {
      const emailNorm = String(ownerEmail).toLowerCase();
      const hotels = await require('../models/hotel').find({ email: emailNorm }).select('_id');
      const hotelIds = hotels.map(h => h._id);
      if (hotelIds.length) {
        query.hotelId = { $in: hotelIds };
      } else {
        return res.status(200).json([]);
      }
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate("roomid")
      .populate("hotelId", "name address email")
      .lean();

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
};

// GET /api/bookings/room/:roomId - Lấy danh sách đặt phòng theo phòng
exports.getBookingsByRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const bookings = await Booking.find({ roomid: roomId }).populate("roomid").lean();
    if (!bookings.length) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng nào cho phòng này" });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng theo phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng theo phòng", error: error.message });
  }
};

// ===============================
// THỐNG KÊ DOANH THU
// ===============================

// GET /api/bookings/stats/daily - Thống kê doanh thu theo ngày
exports.getDailyStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid").lean();

    const dailyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

      const dateKey = checkinDate.toISOString().split("T")[0];

      acc[dateKey] = (acc[dateKey] || 0) + booking.roomid.rentperday * days;
      return acc;
    }, {});

    res.status(200).json(dailyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo ngày:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo ngày", error: error.message });
  }
};

// GET /api/bookings/stats/monthly - Thống kê doanh thu theo tháng
exports.getMonthlyStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    const bookings = await Booking.find({ status: "confirmed" }).populate("roomid").lean();

    const monthlyRevenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

      const monthKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;

      acc[monthKey] = (acc[monthKey] || 0) + booking.roomid.rentperday * days;
      return acc;
    }, {});

    res.status(200).json(monthlyRevenue);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu theo tháng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê doanh thu theo tháng", error: error.message });
  }
};

// ===============================
// GHI CHÚ
// ===============================

// PATCH /api/bookings/:id/note - Cập nhật ghi chú
exports.updateNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Ghi chú không được để trống" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể thêm ghi chú cho đặt phòng đã hủy" });
    }

    booking.specialRequest = note;
    await booking.save();

    res.status(200).json({ message: "Cập nhật ghi chú thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật ghi chú", error: error.message });
  }
};

// ===============================
// GÁN PHÒNG MỚI
// ===============================

// POST /api/bookings/:id/assign-room - Gán phòng mới
exports.assignRoom = async (req, res) => {
  const { id } = req.params;
  const { newRoomId } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID đặt phòng không hợp lệ");
    }

    if (!mongoose.Types.ObjectId.isValid(newRoomId)) {
      throw new Error("ID phòng mới không hợp lệ");
    }

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new Error("Không tìm thấy đặt phòng với ID này");
    }

    if (booking.status === "canceled") {
      throw new Error("Không thể gán phòng cho đặt phòng đã hủy");
    }

    const oldRoom = await Room.findById(booking.roomid).session(session);
    const newRoom = await Room.findById(newRoomId).session(session);

    if (!newRoom) {
      throw new Error("Không tìm thấy phòng mới");
    }

    if (newRoom.availabilityStatus !== "available") {
      throw new Error(`Phòng mới đang ở trạng thái ${newRoom.availabilityStatus}, không thể gán`);
    }

    if (newRoom.type !== booking.roomType) {
      throw new Error("Loại phòng mới không khớp với loại phòng đã đặt");
    }

    const isNewRoomBooked = newRoom.currentbookings.some((b) => {
      const existingCheckin = new Date(b.checkin);
      const existingCheckout = new Date(b.checkout);
      return (
        (booking.checkin >= existingCheckin && booking.checkin < existingCheckout) ||
        (booking.checkout > existingCheckin && booking.checkout <= existingCheckout) ||
        (booking.checkin <= existingCheckin && booking.checkout >= existingCheckout)
      );
    });

    if (isNewRoomBooked) {
      throw new Error("Phòng mới đã được đặt trong khoảng thời gian này");
    }

    if (oldRoom) {
      oldRoom.currentbookings = oldRoom.currentbookings.filter((b) => b.bookingId && b.bookingId.toString() !== id);
      await oldRoom.save({ session });
    }

    booking.roomid = newRoomId;
    await booking.save({ session });

    newRoom.currentbookings.push({
      bookingId: booking._id,
      checkin: booking.checkin,
      checkout: booking.checkout,
    });
    await newRoom.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: "Gán phòng mới thành công", booking });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi gán phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gán phòng", error: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// GIA HẠN LƯU TRÚ
// ===============================

// PATCH /api/bookings/:id/extend - Gia hạn thời gian lưu trú
exports.extendStay = async (req, res) => {
  const { id } = req.params;
  const { newCheckout } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID đặt phòng không hợp lệ");
    }

    if (!newCheckout) {
      throw new Error("Ngày trả phòng mới là bắt buộc");
    }

    const newCheckoutDate = new Date(newCheckout);
    if (isNaN(newCheckoutDate.getTime())) {
      throw new Error("Ngày trả phòng mới không hợp lệ");
    }

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      throw new Error("Không tìm thấy đặt phòng với ID này");
    }

    if (booking.status === "canceled") {
      throw new Error("Không thể gia hạn cho đặt phòng đã hủy");
    }

    const oldCheckoutDate = new Date(booking.checkout);
    if (newCheckoutDate <= oldCheckoutDate) {
      throw new Error("Ngày trả phòng mới phải sau ngày trả phòng hiện tại");
    }

    const room = await Room.findById(booking.roomid).session(session);
    if (!room) {
      throw new Error("Không tìm thấy phòng liên quan đến đặt phòng này");
    }

    const isRoomBooked = room.currentbookings.some((b) => {
      if (b.bookingId && b.bookingId.toString() === id) return false;
      const existingCheckin = new Date(b.checkin);
      const existingCheckout = new Date(b.checkout);
      return (
        (oldCheckoutDate < existingCheckin && newCheckoutDate > existingCheckin) ||
        (oldCheckoutDate < existingCheckout && newCheckoutDate > existingCheckout)
      );
    });

    if (isRoomBooked) {
      throw new Error("Phòng không khả dụng trong khoảng thời gian gia hạn");
    }

    booking.checkout = newCheckoutDate;
    await booking.save({ session });

    const bookingInRoom = room.currentbookings.find((b) => b.bookingId && b.bookingId.toString() === id);
    if (bookingInRoom) {
      bookingInRoom.checkout = newCheckoutDate;
      await room.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Gia hạn thời gian lưu trú thành công", booking });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi gia hạn thời gian lưu trú:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gia hạn thời gian lưu trú", error: error.message });
  } finally {
    session.endSession();
  }
};

// ===============================
// LÝ DO HỦY
// ===============================

// POST /api/bookings/cancel-reason - Gửi lý do hủy
exports.sendCancelReason = async (req, res) => {
  const { bookingId, reason } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ hoặc thiếu" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "Lý do hủy không được để trống" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status !== "canceled") {
      return res.status(400).json({ message: "Đặt phòng này chưa bị hủy" });
    }

    booking.cancelReason = reason;
    await booking.save();

    res.status(200).json({ message: "Gửi lý do hủy thành công", booking });
  } catch (error) {
    console.error("Lỗi khi gửi lý do hủy:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi gửi lý do hủy", error: error.message });
  }
};

// GET /api/booking/cancel-reason - Lấy lý do hủy
exports.getCancelReason = async (req, res) => {
  const { bookingId } = req.query;

  try {
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(400).json({ message: "Không tìm thấy id phòng" });
    }
    if (!booking.cancelReason) {
      return res.status(400).json({ message: "Đặt phòng này chưa có lý do hủy" });
    }
    res.json({ cancelReason: booking.cancelReason });
  } catch (error) {
    console.error("Lỗi khi lấy lý do hủy:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy lý do hủy", error: error.message });
  }
};

// ===============================
// CẬP NHẬT PHƯƠNG THỨC THANH TOÁN
// ===============================

// PATCH /api/bookings/:id/payment-method - Cập nhật phương thức thanh toán
exports.updatePaymentMethod = async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng với ID này" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Không thể cập nhật phương thức thanh toán cho đặt phòng đã hủy" });
    }

    booking.paymentMethod = paymentMethod;
    await booking.save();

    res.status(200).json({ message: "Cập nhật phương thức thanh toán thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật phương thức thanh toán:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật phương thức thanh toán", error: error.message });
  }
};

// ===============================
// GỬI EMAIL XÁC NHẬN
// ===============================

// Gửi email xác nhận đặt phòng (dùng ảnh khách sạn từ DB)
exports.sendBookingConfirmationEmail = async (req, res) => {
  try {
    const { bookingId, email, name, roomName, checkin, checkout, totalAmount, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "roomid",
        populate: { path: "hotelId", select: "name address imageurls" },
      })
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    const hotel = booking.roomid?.hotelId || {};
    const hotelName = hotel.name || "Khách sạn của bạn";
    const hotelAddress = hotel.address || "Đang cập nhật";

    let hotelImage = 'https://via.placeholder.com/600x250/0a84ff/ffffff?text=Khach+San';

    if (hotel.imageurls && hotel.imageurls.length > 0) {
      const firstImage = hotel.imageurls[0];

      if (firstImage.includes('res.cloudinary.com')) {
        hotelImage = firstImage;
      } else if (firstImage.startsWith('http')) {
        hotelImage = firstImage;
      } else {
        hotelImage = `${req.protocol}://${req.get("host")}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
      }
    }

    if (hotelImage.startsWith('http://')) {
      hotelImage = hotelImage.replace('http://', 'https://');
    }

    const paymentText =
      paymentMethod === "cash"
        ? "Thanh toán tại quầy lễ tân khi nhận phòng"
        : paymentMethod === "bank_transfer"
          ? "Chuyển khoản ngân hàng theo hướng dẫn"
          : paymentMethod === "vnpay"
            ? "Thanh toán qua VNPay"
            : paymentMethod === "mobile_payment"
              ? "Thanh toán qua MoMo"
              : "Phương thức thanh toán khác";

    const formattedCheckin = new Date(checkin).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const formattedCheckout = new Date(checkout).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Xác nhận đặt phòng - ${hotelName}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f8f9fa;padding:20px;">
          <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 0 10px rgba(0,0,0,0.1);">
            <div style="text-align:center;padding:20px 0;background:#0a84ff;color:white;">
              <h2 style="margin:0;">XÁC NHẬN ĐẶT PHÒNG</h2>
            </div>

            <div style="padding:25px;">
              <p>Thân gửi <b>${name}</b>,</p>
              <p>Cảm ơn bạn đã tin tưởng đặt phòng tại <b>${hotelName}</b> qua hệ thống của chúng tôi!</p>

              <img src="${hotelImage}" alt="Hotel" 
                   style="width:100%;max-height:250px;object-fit:cover;border-radius:8px;margin-top:10px;margin-bottom:15px;"/>

              <p><b>Địa chỉ:</b> ${hotelAddress}</p>
              <p><b>Phòng:</b> ${roomName}</p>

              <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                <tr>
                  <td style="padding:10px;border:1px solid #ddd;text-align:center;">
                    <b>Nhận phòng</b><br/>
                    ${formattedCheckin}<br/><small>sau 14:00</small>
                  </td>
                  <td style="padding:10px;border:1px solid #ddd;text-align:center;">
                    <b>Trả phòng</b><br/>
                    ${formattedCheckout}<br/><small>trước 12:00</small>
                  </td>
                </tr>
              </table>

              <p style="margin-top:20px;font-size:15px;line-height:1.5;">
                <b>Tổng tiền:</b> ${Number(totalAmount).toLocaleString()} VND<br/>
                <b>Phương thức thanh toán:</b> ${paymentText}
              </p>

              <div style="text-align:center;margin-top:25px;">
                <a href="http://localhost:3000/my-bookings"
                   style="background:#0a84ff;color:white;padding:12px 25px;border-radius:6px;text-decoration:none;font-weight:bold;">
                  Quản lý đặt chỗ của tôi
                </a>
              </div>

              <p style="margin-top:25px;color:#555;font-size:14px;">
                Chúng tôi rất mong được đón tiếp bạn. Nếu cần hỗ trợ, vui lòng phản hồi email này.
              </p>
            </div>

            <div style="background:#f1f3f5;padding:15px;text-align:center;color:#777;font-size:13px;">
              &copy; ${new Date().getFullYear()} Hotel Booking Team
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email xác nhận đã gửi tới ${email}`);
    res.status(200).json({ message: "Gửi email xác nhận thành công" });
  } catch (err) {
    console.error("Lỗi gửi email xác nhận:", err);
    res.status(500).json({ message: "Không thể gửi email xác nhận", error: err.message });
  }
};
// Thêm vào bookingController.js
// Thay thế hàm exports.getTopHotels hiện tại bằng code này:

exports.getTopHotels = async (req, res) => {
  try {
    // Lấy tham số limit từ query, mặc định là 5
    const limit = req.query.limit && req.query.limit.toLowerCase() === 'all'
      ? null
      : parseInt(req.query.limit) || 5;

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // 1. Tìm top khách sạn có doanh thu cao nhất trong năm nay
    const topHotelsAggPipeline = [
      {
        $match: {
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
          checkin: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: "$hotelId",
          totalRevenue: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ];

    // Thêm limit nếu không phải "all"
    if (limit !== null) {
      topHotelsAggPipeline.push({ $limit: limit });
    }

    const topHotelsAgg = await Booking.aggregate(topHotelsAggPipeline);

    if (!topHotelsAgg.length) {
      return res.status(200).json({
        topHotels: [],
        chartData: { labels: [], datasets: [] },
        totalCount: 0
      });
    }

    // Lấy thông tin chi tiết của các khách sạn này
    const hotelIds = topHotelsAgg.map(h => h._id);
    const hotelsInfo = await Hotel.find({ _id: { $in: hotelIds } }).select('name imageurls');

    // Map thông tin khách sạn vào kết quả aggregate
    const topHotels = topHotelsAgg.map(item => {
      const info = hotelsInfo.find(h => h._id.equals(item._id));
      return {
        hotelId: item._id,
        name: info ? info.name : 'Unknown Hotel',
        image: info && info.imageurls && info.imageurls.length > 0 ? info.imageurls[0] : null,
        totalRevenue: item.totalRevenue,
        bookingCount: item.bookingCount
      };
    });

    // 2. Lấy dữ liệu doanh thu theo tháng cho các khách sạn này
    // ✅ FIX: Sử dụng checkin thay vì createdAt
    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
          hotelId: { $in: hotelIds },
          checkin: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: {
            hotelId: "$hotelId",
            month: { $month: "$checkin" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Chuẩn bị dữ liệu biểu đồ
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Tạo palette màu đẹp cho nhiều khách sạn
    const colorPalette = [
      'rgb(255, 99, 132)',   // Đỏ
      'rgb(54, 162, 235)',   // Xanh dương
      'rgb(255, 206, 86)',   // Vàng
      'rgb(75, 192, 192)',   // Xanh lá
      'rgb(153, 102, 255)',  // Tím
      'rgb(255, 159, 64)',   // Cam
      'rgb(199, 199, 199)',  // Xám
      'rgb(83, 102, 255)',   // Xanh đậm
      'rgb(255, 99, 255)',   // Hồng
      'rgb(99, 255, 132)',   // Xanh lá nhạt
    ];

    const datasets = topHotels.map((hotel, index) => {
      const data = Array(12).fill(0);

      // Fill data từ monthlyStats
      monthlyStats.forEach(stat => {
        if (stat._id.hotelId.equals(hotel.hotelId)) {
          data[stat._id.month - 1] = stat.revenue;
        }
      });

      // Sử dụng màu từ palette, lặp lại nếu vượt quá số màu
      const colorIndex = index % colorPalette.length;

      return {
        label: hotel.name,
        data: data,
        borderColor: colorPalette[colorIndex],
        backgroundColor: colorPalette[colorIndex],
        tension: 0.4
      };
    });

    res.status(200).json({
      topHotels,
      chartData: {
        labels: months,
        datasets
      },
      totalCount: topHotels.length
    });

  } catch (error) {
    console.error("Lỗi khi lấy top hotels:", error);
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu top hotels" });
  }
};

// ===============================
// GET BOOKING BY ID
// ===============================

// GET /api/bookings/:id - Lấy chi tiết đặt phòng
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'hotelId',
        select: 'name address city imageurls'
      })
      .populate({
        path: 'roomid',
        select: 'name type rentperday imageurls'
      })
      .populate({
        path: 'rooms.roomid',
        select: 'name type rentperday imageurls'
      });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đặt phòng:", error);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết đặt phòng" });
  }
};

// ===============================
// USER CANCEL BOOKING
// ===============================

// POST /api/bookings/:id/user-cancel - User tự hủy đặt phòng (trong 15 phút)
exports.userCancelBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;
    const { email, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đặt phòng không hợp lệ" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email không được để trống" });
    }

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
    }

    // Kiểm tra email khớp
    if (booking.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: "Bạn không có quyền hủy đặt phòng này" });
    }

    // Kiểm tra trạng thái thanh toán
    if (booking.paymentStatus !== "pending") {
      return res.status(400).json({
        message: "Không thể hủy đặt phòng đã thanh toán. Vui lòng liên hệ bộ phận hỗ trợ."
      });
    }

    // Kiểm tra thời gian (15 phút)
    const createdAt = new Date(booking.createdAt);
    const now = new Date();
    const minutesPassed = (now - createdAt) / (1000 * 60);

    if (minutesPassed > 15) {
      return res.status(400).json({
        message: "Đã quá thời gian hủy miễn phí (15 phút). Vui lòng liên hệ bộ phận hỗ trợ."
      });
    }

    // Hoàn trả tồn kho
    const room = await Room.findById(booking.roomid).session(session);
    if (room) {
      const checkinDateOnly = new Date(booking.checkin.getFullYear(), booking.checkin.getMonth(), booking.checkin.getDate());
      const checkoutDateOnly = new Date(booking.checkout.getFullYear(), booking.checkout.getMonth(), booking.checkout.getDate());

      for (
        let d = new Date(checkinDateOnly);
        d < checkoutDateOnly;
        d.setDate(d.getDate() + 1)
      ) {
        const dayStr = formatLocalDate(d);
        const daily = getOrInitInventory(room, dayStr);
        daily.quantity += booking.roomsBooked || 1;
      }

      // Xóa khỏi currentbookings
      room.currentbookings = room.currentbookings.filter(
        b => !b.bookingId.equals(booking._id)
      );

      await room.save({ session });
    }

    // Hoàn trả voucher (nếu có)
    if (booking.appliedVouchers && booking.appliedVouchers.length > 0) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        for (const voucher of booking.appliedVouchers) {
          const code = typeof voucher === 'string' ? voucher : voucher.code;
          await UserVoucher.findOneAndUpdate(
            { userId: user._id, voucherCode: code, isUsed: true, bookingId: booking._id },
            { isUsed: false, usedAt: null, bookingId: null },
            { session }
          );
        }
      }
    }

    // Cập nhật trạng thái booking
    booking.status = "canceled";
    booking.cancelReason = reason || "Khách hàng hủy trong vòng 15 phút";
    await booking.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: "Hủy đặt phòng thành công",
      booking
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi hủy đặt phòng:", error);
    res.status(500).json({ message: "Lỗi server khi hủy đặt phòng", error: error.message });
  } finally {
    session.endSession();
  }
};

