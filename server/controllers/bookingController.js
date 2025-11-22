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
const discount = require("../models/discount");
const nodemailer = require("nodemailer");

// Giả lập hàm xử lý thanh toán qua tài khoản ngân hàng
const processBankPayment = async (booking, session) => {
   try {
      // Tạo mã giao dịch ngân hàng duy nhất với prefix rõ ràng và check trùng
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const bankTransactionId = `BODO${timestamp}${random}`;

      // Thông tin ngân hàng với format rõ ràng
      const bankInfo = {
         bankName: "Vietcombank",
         accountNumber: "1234567890",
         accountHolder: "CONG TY TNHH KHACH SAN ABC",
         swiftCode: "BFTVVNVX",
         branch: "Chi nhánh HCM",
         amount: booking.totalAmount,
         // Format nội dung chuyển khoản để dễ đối soát
         content: `BODO_${booking._id}_${bankTransactionId}`,
         // Tăng thời gian hết hạn lên 30 phút
         expiryTime: new Date(Date.now() + 30 * 60000),
      };

      // Cập nhật booking với mã giao dịch ngân hàng
      booking.bankTransactionId = bankTransactionId;
      booking.bankPaymentExpiry = bankInfo.expiryTime;
      await booking.save({ session });

      // Đặt timeout tự động hủy booking nếu không thanh toán
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
      }, 30 * 60000); // 30 phút

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

      // Tính số ngày dựa trên giờ check-in/check-out thực tế
      const days = Math.floor((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      if (days < 1) {
         // Nếu ở dưới 1 ngày vẫn tính là 1 ngày
         totalAmount = room.rentperday;
      } else {
         totalAmount = room.rentperday * days;
      }

      // Kiểm tra và áp dụng giảm giá
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

// POST /api/bookings/checkout - Tạo giao dịch mới và tích điểm
exports.checkout = async (req, res) => {
   const { bookingId } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      // Kiểm tra kết nối database
      if (mongoose.connection.readyState !== 1) {
         throw new Error('Kết nối cơ sở dữ liệu chưa sẵn sàng');
      }

      // Kiểm tra bookingId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
         throw new Error('ID đặt phòng không hợp lệ');
      }

      // Kiểm tra giao dịch đã tồn tại
      const existingTransaction = await Transaction.findOne({ bookingId }).session(session);
      if (existingTransaction) {
         throw new Error('Giao dịch cho đặt phòng này đã được tạo trước đó');
      }

      // Tìm booking
      const booking = await Booking.findById(bookingId)
         .populate('roomid')
         .session(session);
      if (!booking) {
         throw new Error('Không tìm thấy đặt phòng');
      }

      // Kiểm tra trạng thái booking
      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
         throw new Error('Đặt phòng chưa được xác nhận hoặc chưa thanh toán, không thể tích điểm');
      }

      // Tìm user
      const user = await User.findOne({ email: booking.email.toLowerCase() })
         .session(session);
      if (!user) {
         throw new Error('Không tìm thấy người dùng liên quan đến đặt phòng');
      }

      // Kiểm tra quyền truy cập
      if (req.user._id.toString() !== user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
         throw new Error('Không có quyền tích điểm cho người dùng này');
      }

      // Tính số tiền booking
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const totalAmount = booking.roomid.rentperday * days - (booking.voucherDiscount || 0);

      // Tính điểm (1 điểm cho mỗi 100,000 VND)
      const pointsEarned = Math.floor(totalAmount * 0.01);

      // Tạo giao dịch
      const transaction = new Transaction({
         userId: user._id,
         bookingId: booking._id,
         amount: totalAmount,
         points: pointsEarned,
         type: 'earn',
         status: 'completed',
      });
      await transaction.save({ session });

      // Cập nhật điểm cho user
      user.points = (user.points || 0) + pointsEarned;
      await user.save({ session });

      // Commit transaction
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
//Da sua
// POST /api/bookings - Đặt phòng
exports.createBooking = async (req, res) => {
   const { roomid, name, email, phone, checkin, checkout, adults, children, roomType, paymentMethod, roomsBooked } = req.body;
   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      if (!mongoose.Types.ObjectId.isValid(roomid)) {
         return res.status(400).json({ message: "ID phòng không hợp lệ" });
      }

      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate) || isNaN(checkoutDate) || checkinDate >= checkoutDate) {
         return res.status(400).json({ message: "Ngày nhận/trả phòng không hợp lệ" });
      }

      const room = await Room.findById(roomid).session(session);
      if (!room) {
         return res.status(404).json({ message: "Không tìm thấy phòng" });
      }

      // Kiểm tra số phòng có thể đặt
      for (let day = new Date(checkinDate); day < checkoutDate; day.setDate(day.getDate() + 1)) {
         let bookedToday = 0;
         room.currentbookings.forEach(b => {
            if (day >= b.checkin && day < b.checkout) {
               bookedToday += b.roomsBooked || 1;
            }
         });

         if (bookedToday + roomsBooked > room.quantity) {
            return res.status(400).json({ message: "Không đủ phòng trống cho ngày " + day.toISOString().split("T")[0] });
         }
      }

      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const totalAmount = room.rentperday * days * roomsBooked;

      const newBooking = new Booking({
         hotelId: room.hotelId,
         roomid,
         name,
         email: email.toLowerCase(),
         phone,
         checkin: checkinDate,
         checkout: checkoutDate,
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
         checkin: checkinDate,
         checkout: checkoutDate,
         roomsBooked
      });
      await room.save({ session });

      await session.commitTransaction();

      // Tạo thông báo cho người đặt phòng
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
               message: `Đã thanh toán thành công cho đơn đặt phòng tại ${hotelName}`,
               hotelName,
               checkin: checkinDate,
               checkout: checkoutDate,
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


//Da sua
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
      totalAmount,
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

      // Điều chỉnh múi giờ cho checkin/checkout
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);

      // Đặt giờ check-in là 14:00 và check-out là 12:00 theo múi giờ Việt Nam
      checkinDate.setHours(14, 0, 0, 0);
      checkoutDate.setHours(12, 0, 0, 0);

      // Chuyển đổi sang múi giờ UTC để lưu vào database
      const checkinISO = new Date(checkinDate.getTime() - (checkinDate.getTimezoneOffset() + 420) * 60000); // +7 hours (420 minutes)
      const checkoutISO = new Date(checkoutDate.getTime() - (checkoutDate.getTimezoneOffset() + 420) * 60000); if (isNaN(checkinISO) || isNaN(checkoutISO) || checkinISO >= checkoutISO) {
         throw new Error("Ngày nhận phòng hoặc trả phòng không hợp lệ");
      }

      const room = await Room.findById(roomid).session(session);
      if (!room) {
         throw new Error("Không tìm thấy phòng");
      }

      if (room.quantity < roomsBooked) {
         throw new Error("Số lượng phòng không đủ");
      }

      // Kiểm tra xem khách sạn có giảm giá hoạt động không
      const now = new Date();
      const activeDiscounts = await Discount.find({
         type: "festival",
         applicableHotels: room.hotelId,
         isDeleted: false,
         startDate: { $lte: now },
         endDate: { $gte: now },
      });

      // Chọn discount tốt nhất (ưu tiên % cao nhất hoặc fixed lớn nhất)
      let activeDiscount = null;
      if (activeDiscounts.length > 0) {
         activeDiscount = activeDiscounts.reduce((best, current) => {
            if (current.discountType === "percentage" && (!best || current.discountValue > best.discountValue)) return current;
            if (current.discountType === "fixed" && (!best || current.discountValue > best.discountValue)) return current;
            return best;
         }, null);
      }

      let finalAmount = totalAmount;
      let discountApplied = null;

      if (activeDiscount) {
         let reduced = 0;
         if (activeDiscount.discountType === "percentage") {
            reduced = (totalAmount * activeDiscount.discountValue) / 100;
         } else if (activeDiscount.discountType === "fixed") {
            reduced = activeDiscount.discountValue;
         }

         finalAmount = Math.max(totalAmount - reduced, 0);

         discountApplied = {
            id: activeDiscount._id,
            name: activeDiscount.name,
            discountType: activeDiscount.discountType,
            discountValue: activeDiscount.discountValue,
            amountReduced: reduced,
         };
      }
      // Tạo booking mới
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
         totalAmount: finalAmount,
         status: "pending",
         paymentStatus: "pending",
         roomsBooked: Number(roomsBooked),
         diningServices,
         appliedVouchers,
         voucherDiscount,
         discount: discountApplied,
      });

      await booking.save({ session });

      // Xử lý các phương thức thanh toán
      let paymentResult;
      switch (paymentMethod) {
         case "bank_transfer":
            paymentResult = await processBankPayment(booking, session);
            break;

         case "vnpay":
            // Chuẩn bị cho redirect VNPay
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
            // Chuẩn bị cho redirect MoMo
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

      // Giảm số lượng phòng có sẵn
      for (let day = new Date(checkinDate); day < checkoutDate; day.setDate(day.getDate() + 1)) {

         const dayStr = day.toISOString().split("T")[0];
         const daily = getOrInitInventory(room, dayStr, room.quantity); // 5 phòng/ngày mặc định

         if (daily.quantity < roomsBooked) {
            throw new Error(`Không đủ phòng vào ngày ${dayStr}`);
         }

         daily.quantity -= roomsBooked; 
      }

      await room.save({ session });


      await session.commitTransaction();

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
               message: `Đã thanh toán thành công cho đơn đặt phòng tại ${hotelName}`,
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

//Da sua
// POST /api/bookings/book-multi - Đặt nhiều phòng (Booking.com style)
exports.bookMulti = async (req, res) => {
   const {
      rooms,           // Array: [{roomid, roomType, roomsBooked, checkin, checkout}, ...]
      customer         // Object: {name, email, phone, adults, children, paymentMethod, diningServices, appliedVouchers, voucherDiscount}
   } = req.body;

   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      // Validation
      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
         throw new Error("Phải có ít nhất một phòng trong đơn đặt");
      }

      if (!customer || !customer.name || !customer.email || !customer.phone) {
         throw new Error("Thông tin khách hàng không đầy đủ");
      }

      // Get hotel from first room
      const firstRoom = await Room.findById(rooms[0].roomid).session(session);
      if (!firstRoom) {
         throw new Error("Không tìm thấy phòng");
      }

      const hotelId = firstRoom.hotelId;

      // Adjust dates
      const checkinDate = new Date(rooms[0].checkin);
      const checkoutDate = new Date(rooms[0].checkout);

      checkinDate.setHours(14, 0, 0, 0);
      checkoutDate.setHours(12, 0, 0, 0);

      const checkinISO = new Date(checkinDate.getTime() - (checkinDate.getTimezoneOffset() + 420) * 60000);
      const checkoutISO = new Date(checkoutDate.getTime() - (checkoutDate.getTimezoneOffset() + 420) * 60000);

      if (isNaN(checkinISO) || isNaN(checkoutISO) || checkinISO >= checkoutISO) {
         throw new Error("Ngày nhận phòng hoặc trả phòng không hợp lệ");
      }

      // Process each room
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

         if (room.quantity < roomItem.roomsBooked) {
            throw new Error(`Số lượng phòng ${roomItem.type} không đủ`);
         }

         // Calculate price for this room
         const days = Math.max(1, Math.floor((checkoutISO - checkinISO) / (1000 * 60 * 60 * 24)));
         const roomPrice = room.rentperday * roomItem.roomsBooked * days;
         totalPrice += roomPrice;

         // Store room details
         roomDetails.push({
            roomid: room._id,
            roomType: room.type,
            roomsBooked: roomItem.roomsBooked,
            checkin: checkinISO,
            checkout: checkoutISO,
            finalAmount: roomPrice,
            rentperday: room.rentperday
         });

         // Reduce quantity
         room.quantity -= roomItem.roomsBooked;
         await room.save({ session });
      }

      // Calculate service cost
      let serviceCost = 0;
      if (customer.diningServices && customer.diningServices.length > 0) {
         const services = await Service.find({ _id: { $in: customer.diningServices } }).session(session);
         serviceCost = services.reduce((sum, s) => sum + s.price, 0);
      }

      // Apply voucher
      const voucherDiscount = customer.voucherDiscount || 0;

      // Final amount
      const finalAmount = Math.max(0, totalPrice + serviceCost - voucherDiscount);

      // Create booking with rooms array (NOT roomid)
      const booking = new Booking({
         hotelId,
         rooms: roomDetails,        // ARRAY of room objects
         // roomid is still required by schema but we don't use it for multi-room
         roomid: rooms[0].roomid,   // Set to first room for schema compatibility
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
         roomsBooked: rooms.reduce((sum, r) => sum + r.roomsBooked, 0) // Total rooms count
      });

      await booking.save({ session });

      // Check for active discounts
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

      // XỬ lý thanh toán
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

      await session.commitTransaction();

      // Thông báo cho người đặt phòng
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


//Da sua
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

      // Xóa booking khỏi room.currentbookings
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

      // Tự động tích điểm sau khi xác nhận thanh toán
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

      // Thông báo duyệt đơn cho người đặt
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

// GET /api/bookings - Lấy danh sách đặt phòng
exports.getBookings = async (req, res) => {
   const { status, email } = req.query;

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

      const bookings = await Booking.find(query)
         .populate("roomid")
         .populate("hotelId", "name address") // thêm dòng này để hotelId có dữ liệu
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

//GET /api/booking/cancel-reason - Lấy lý do hủy
exports.getCancelReason = async (req, res) => {
   const { bookingId } = req.query;

   const booking = await Booking.findById(bookingId).lean();
   if (!booking) {
      return res.status(400).json({ message: "Không tìm thấy id phòng" })
   }
   if (!booking.cancelReason) {
      return res.status(400).json({ message: "Đặt phòng này chưa có lý do hủy" });
   }
   res.json({ cancelReason: booking.cancelReason });
};

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



// Gửi email xác nhận đặt phòng (dùng ảnh khách sạn từ DB)
exports.sendBookingConfirmationEmail = async (req, res) => {
   try {
      const { bookingId, email, name, roomName, checkin, checkout, totalAmount, paymentMethod } = req.body;

      // 🔍 Tìm thông tin đặt phòng kèm phòng & khách sạn
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


      // Lấy ảnh khách sạn: Ưu tiên Cloudinary → Fallback placeholder public
      let hotelImage = 'https://via.placeholder.com/600x250/0a84ff/ffffff?text=Khach+San'; // Default public

      if (hotel.imageurls && hotel.imageurls.length > 0) {
         const firstImage = hotel.imageurls[0];

         // Ưu tiên Cloudinary (HTTPS + public)
         if (firstImage.includes('res.cloudinary.com')) {
            hotelImage = firstImage;
         }
         // Nếu là ảnh cũ local → vẫn dùng (nhưng cảnh báo)
         else if (firstImage.startsWith('http')) {
            hotelImage = firstImage;
         }
         // Nếu là relative path → convert thành full URL (nếu cần)
         else {
            hotelImage = `${req.protocol}://${req.get("host")}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
         }
      }

      // Đảm bảo luôn HTTPS (Gmail ưu tiên)
      if (hotelImage.startsWith('http://')) {
         hotelImage = hotelImage.replace('http://', 'https://');
      }

      // 💳 Text phương thức thanh toán
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

      // 🕓 Format ngày
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

      // 📧 Cấu hình email
      const nodemailer = require("nodemailer");
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
      console.log(` Email xác nhận đã gửi tới ${email}`);
      res.status(200).json({ message: "Gửi email xác nhận thành công" });
   } catch (err) {
      console.error(" Lỗi gửi email xác nhận:", err);
      res.status(500).json({ message: "Không thể gửi email xác nhận", error: err.message });
   }
};
