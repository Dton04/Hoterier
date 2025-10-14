const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Discount = require('../models/discount');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const Booking = require('../models/booking');
const UserVoucher = require('../models/userVouchers');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   POST /api/discounts
 * @desc    Tạo khuyến mãi hoặc voucher mới
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.post('/', protect, admin, async (req, res) => {
  const {
    name,
    code,
    description,
    type,
    discountType,
    discountValue,
    applicableHotels,
    startDate,
    endDate,
    minBookingAmount,
    maxDiscount,
    isStackable,
    membershipLevel,
    minSpending,
    image
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!name || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc: name, type, discountType, discountValue, startDate, endDate' });
    }
    if (discountValue < 0) {
      return res.status(400).json({ message: 'Giá trị giảm giá không thể âm' });
    }

    const validTypes = ['voucher', 'festival', 'member', 'accumulated'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Loại khuyến mãi không hợp lệ' });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const hotels = await Hotel.find({ _id: { $in: applicableHotels } });
      if (hotels.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều khách sạn không tồn tại' });
      }
    }


    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ' });
    }

    if (type === 'voucher') {
      if (!code) {
        return res.status(400).json({ message: 'Mã voucher là bắt buộc cho loại voucher' });
      }
      const discountExists = await Discount.findOne({ code });
      if (discountExists) {
        return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
      }
    } else if (code) {
      return res.status(400).json({ message: 'Mã code chỉ được cung cấp cho loại voucher' });
    }

    if (type === 'member') {
      const validLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      if (!membershipLevel || !validLevels.includes(membershipLevel)) {
        return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ hoặc thiếu' });
      }
    } else if (membershipLevel) {
      return res.status(400).json({ message: 'Cấp độ thành viên chỉ được cung cấp cho loại member' });
    }

    if (type === 'accumulated') {
      if (!minSpending || minSpending < 0) {
        return res.status(400).json({ message: 'Chi tiêu tối thiểu không hợp lệ hoặc thiếu' });
      }
    } else if (minSpending) {
      return res.status(400).json({ message: 'Chi tiêu tối thiểu chỉ được cung cấp cho loại accumulated' });
    }

    const discount = new Discount({
      name,
      code: type === 'voucher' ? code : null,
      description,
      type,
      discountType,
      discountValue,
      applicableHotels: applicableHotels || [],
      startDate: start,
      endDate: end,
      minBookingAmount: minBookingAmount || 0,
      maxDiscount: maxDiscount || null,
      isStackable: !!isStackable,
      membershipLevel: type === 'member' ? membershipLevel : null,
      minSpending: type === 'accumulated' ? minSpending : null,
      image: image || null,
    });

    console.log('Dữ liệu khuyến mãi trước khi lưu:', discount);
    await discount.save();
    res.status(201).json({ message: 'Tạo khuyến mãi thành công', discount });
  } catch (error) {
    console.error('Lỗi khi tạo khuyến mãi:', {
      message: error.message,
      stack: error.stack,
      errors: error.errors,
      code: error.code,
    });
    res.status(500).json({
      message: 'Lỗi khi tạo khuyến mãi',
      error: error.message,
      details: error.errors || error.code,
    });
  }
});

/**
 * @route   PUT /api/discounts/:id
 * @desc    Cập nhật khuyến mãi
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    code,
    description,
    discountType,
    discountValue,
    applicableHotels,
    startDate,
    endDate,
    minBookingAmount,
    maxDiscount,
    isStackable,
    membershipLevel,
    minSpending,
    image
  } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khuyến mãi không hợp lệ' });
    }

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    if (discountType && !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ message: 'Loại giảm giá không hợp lệ' });
    }

    if (discountValue !== undefined && discountValue < 0) {
      return res.status(400).json({ message: 'Giá trị giảm giá không thể âm' });
    }

    if (applicableHotels && applicableHotels.length > 0) {
      const hotels = await Hotel.find({ _id: { $in: applicableHotels } });
      if (hotels.length !== applicableHotels.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ' });
      }
    }

    if (code !== undefined && discount.type === 'voucher') {
      if (!code) {
        return res.status(400).json({ message: 'Mã voucher là bắt buộc cho loại voucher' });
      }
      const discountExists = await Discount.findOne({ code, _id: { $ne: id } });
      if (discountExists) {
        return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
      }
    } else if (code && discount.type !== 'voucher') {
      return res.status(400).json({ message: 'Mã code chỉ được cung cấp cho loại voucher' });
    }

    if (discount.type === 'member') {
      const validLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      if (membershipLevel && !validLevels.includes(membershipLevel)) {
        return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
      }
      if (!membershipLevel && !discount.membershipLevel) {
        return res.status(400).json({ message: 'Cấp độ thành viên là bắt buộc cho loại member' });
      }
    } else if (membershipLevel) {
      return res.status(400).json({ message: 'Cấp độ thành viên chỉ được cung cấp cho loại member' });
    }

    if (discount.type === 'accumulated') {
      if (minSpending !== undefined && (minSpending === null || minSpending < 0)) {
        return res.status(400).json({ message: 'Chi tiêu tối thiểu không hợp lệ' });
      }
      if (minSpending === undefined && !discount.minSpending) {
        return res.status(400).json({ message: 'Chi tiêu tối thiểu là bắt buộc cho loại accumulated' });
      }
    } else if (minSpending !== undefined) {
      return res.status(400).json({ message: 'Chi tiêu tối thiểu chỉ được cung cấp cho loại accumulated' });
    }

    discount.name = name || discount.name;
    discount.code = code !== undefined && discount.type === 'voucher' ? code : discount.code;
    discount.description = description || discount.description;
    discount.discountType = discountType || discount.discountType;
    discount.discountValue = discountValue !== undefined ? discountValue : discount.discountValue;
    discount.applicableHotels = applicableHotels !== undefined ? applicableHotels : discount.applicableHotels;
    discount.startDate = startDate || discount.startDate;
    discount.endDate = endDate || discount.endDate;
    discount.minBookingAmount = minBookingAmount !== undefined ? minBookingAmount : discount.minBookingAmount;
    discount.maxDiscount = maxDiscount !== undefined ? maxDiscount : discount.maxDiscount;
    discount.isStackable = isStackable !== undefined ? isStackable : discount.isStackable;
    discount.membershipLevel = membershipLevel !== undefined && discount.type === 'member' ? membershipLevel : discount.membershipLevel;
    discount.minSpending = minSpending !== undefined && discount.type === 'accumulated' ? minSpending : discount.minSpending;
    discount.image = image !== undefined ? image : discount.image;

    const updatedDiscount = await discount.save();
    res.status(200).json({ message: 'Cập nhật khuyến mãi thành công', discount: updatedDiscount });
  } catch (error) {
    console.error('Lỗi khi cập nhật khuyến mãi:', {
      message: error.message,
      stack: error.stack,
      errors: error.errors,
      code: error.code,
    });
    res.status(500).json({
      message: 'Lỗi khi cập nhật khuyến mãi',
      error: error.message,
      details: error.errors || error.code,
    });
  }
});

/**
 * @route   GET /api/discounts
 * @desc    Lấy danh sách khuyến mãi hiện có (công khai)
 * @access  Công khai
 */
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const now = new Date();
    const discounts = await Discount.find({
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name');

    res.status(200).json(discounts);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error: error.message });
  }
});

/**
 * @route   GET /api/discounts/admin
 * @desc    Lấy danh sách tất cả khuyến mãi (chỉ admin)
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.get('/admin', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const discounts = await Discount.find({ isDeleted: false }).populate('applicableHotels', 'name');
    res.status(200).json(discounts);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error: error.message });
  }
});

/**
 * @route   GET /api/discounts/member
 * @desc    Lấy khuyến mãi theo cấp độ thành viên
 * @access  Riêng tư (yêu cầu token)
 */
router.get('/member', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let membershipLevel;
    if (user.points >= 400000) membershipLevel = 'Diamond';
    else if (user.points >= 300000) membershipLevel = 'Platinum';
    else if (user.points >= 200000) membershipLevel = 'Gold';
    else if (user.points >= 100000) membershipLevel = 'Silver';
    else membershipLevel = 'Bronze';

    const now = new Date();
    const discounts = await Discount.find({
      type: 'member',
      membershipLevel,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name');

    res.status(200).json({ membershipLevel, discounts });
  } catch (error) {
    console.error('Lỗi khi lấy khuyến mãi theo cấp độ thành viên:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi theo cấp độ thành viên', error: error.message });
  }
});

/**
 * @route   GET /api/discounts/accumulated
 * @desc    Lấy khuyến mãi dựa trên chi tiêu tích lũy
 * @access  Riêng tư (yêu cầu token)
 */
router.get('/accumulated', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const transactions = await Transaction.find({ userId: req.user.id, status: 'completed' });
    const totalSpending = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const now = new Date();
    const discounts = await Discount.find({
      type: 'accumulated',
      minSpending: { $lte: totalSpending },
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name');

    res.status(200).json({
      totalSpending,
      discounts: discounts.map(discount => ({
        id: discount._id,
        name: discount.name,
        code: discount.code,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minBookingAmount: discount.minBookingAmount,
        maxDiscount: discount.maxDiscount,
        applicableHotels: discount.applicableHotels,
        startDate: discount.startDate,
        endDate: discount.endDate,
      })),
    });
  } catch (error) {
    console.error('Lỗi khi lấy khuyến mãi theo chi tiêu tích lũy:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi theo chi tiêu tích lũy', error: error.message });
  }
});

/**
 * @route   DELETE /api/discounts/:id
 * @desc    Xóa khuyến mãi (soft delete)
 * @access  Riêng tư (yêu cầu token, chỉ admin)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khuyến mãi không hợp lệ' });
    }

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
    }

    discount.isDeleted = true;
    await discount.save();
    res.status(200).json({ message: 'Xóa khuyến mãi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error: error.message });
  }
});

/**
 * @route   POST /api/discounts/apply
 * @desc    Áp dụng các khuyến mãi/voucher cho đặt phòng, hỗ trợ chồng khuyến mãi
 * @access  Công khai
 */
router.post('/apply', async (req, res) => {
  const { bookingData, identifiers } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (
      !bookingData ||
      !bookingData.roomid ||
      !bookingData.checkin ||
      !bookingData.checkout ||
      !identifiers ||
      !Array.isArray(identifiers)
    ) {
      return res.status(400).json({ message: 'Dữ liệu đặt phòng hoặc danh sách khuyến mãi không hợp lệ' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingData.roomid)) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }

    const room = await Room.findById(bookingData.roomid);
    if (!room) {
      return res.status(404).json({ message: 'Không tìm thấy phòng' });
    }

    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
      return res.status(400).json({ message: 'Ngày nhận phòng hoặc trả phòng không hợp lệ' });
    }

    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    let totalAmount = room.rentperday * days;

    const discounts = await Discount.find({
      $or: [
        { code: { $in: identifiers } },
        { _id: { $in: identifiers.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      ],
      isDeleted: false,
    });

    if (!discounts.length) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi hợp lệ' });
    }

    let totalDiscount = 0;
    const appliedDiscounts = [];
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let user;
      if (bookingData.userId && mongoose.Types.ObjectId.isValid(bookingData.userId)) {
        user = await User.findById(bookingData.userId).select('points').session(session);
        if (!user) {
          throw new Error('Không tìm thấy người dùng');
        }
      }

      let booking;
      if (bookingData.bookingId && mongoose.Types.ObjectId.isValid(bookingData.bookingId)) {
        booking = await Booking.findById(bookingData.bookingId).session(session);
        if (!booking) {
          throw new Error('Không tìm thấy đặt phòng');
        }
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
          throw new Error('Không thể áp dụng khuyến mãi cho đặt phòng đã hủy');
        }
      }

      for (const discount of discounts) {
        const now = new Date();
        if (now < discount.startDate || now > discount.endDate) {
          continue;
        }

        if (
          discount.applicableHotels.length > 0 &&
          !discount.applicableHotels.some((id) => id.equals(bookingData.hotelid))
        ) {
          continue;
        }

        if (totalAmount < discount.minBookingAmount) {
          continue;
        }

        // Kiểm tra voucher trong UserVouchers nếu là loại voucher
        let userVoucher;
        if (discount.type === 'voucher' && user) {
          userVoucher = await UserVoucher.findOne({
            userId: user._id,
            voucherCode: discount.code,
            isUsed: false,
            expiryDate: { $gte: now },
          }).session(session);


          // Nếu không có voucher hợp lệ hoặc đã dùng rồi thì bỏ qua
          const userUsage = discount.usedBy.find((u) => u.userId.equals(user._id));
          if (!userVoucher || (userUsage && userUsage.count >= 1)) {
            continue;
          }
        }

        if (discount.type === 'member' && user) {
          let membershipLevel;
          if (user.points >= 1000000) membershipLevel = 'Diamond';
          else if (user.points >= 500000) membershipLevel = 'Platinum';
          else if (user.points >= 100000) membershipLevel = 'Gold';
          else if (user.points >= 50000) membershipLevel = 'Silver';
          else membershipLevel = 'Bronze';

          if (discount.membershipLevel && discount.membershipLevel !== membershipLevel) {
            continue;
          }
        }

        if (discount.type === 'accumulated' && user) {
          const transactions = await Transaction.find({ userId: user._id, status: 'completed' }).session(session);
          const totalSpending = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
          if (discount.minSpending && totalSpending < discount.minSpending) {
            continue;
          }
        }

        if (!discount.isStackable && appliedDiscounts.length > 0) {
          continue;
        }

        let discountAmount = 0;
        if (discount.discountType === 'percentage') {
          discountAmount = (totalAmount * discount.discountValue) / 100;
          if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
            discountAmount = discount.maxDiscount;
          }
        } else {
          discountAmount = discount.discountValue;
        }

        totalDiscount += discountAmount;
        appliedDiscounts.push({
          id: discount._id,
          code: discount.code,
          name: discount.name,
          type: discount.type,
          discount: discountAmount,
        });

        // Đánh dấu voucher là đã sử dụng
        if (discount.type === 'voucher' && userVoucher) {
          userVoucher.isUsed = true;
          await userVoucher.save({ session });
        }

        // Cập nhật usedBy trong Discount cho voucher
        if (discount.type === 'voucher' && user) {
          if (!discount.usedBy) discount.usedBy = [];
          const userUsage = discount.usedBy.find((u) => u.userId.equals(user._id));
          if (userUsage) {
            userUsage.count += 1;
          } else {
            discount.usedBy.push({ userId: user._id, count: 1 });
          }
          await discount.save({ session });
        }
      }

      if (booking) {
        booking.voucherDiscount = totalDiscount;
        booking.appliedVouchers = appliedDiscounts.map((d) => ({
          code: d.code || d.id,
          discount: d.discount,
        }));
        await booking.save({ session });
      }

      totalAmount = Math.max(0, totalAmount - totalDiscount);

      await session.commitTransaction();
      res.status(200).json({
        message: 'Áp dụng khuyến mãi thành công',
        totalAmount,
        appliedDiscounts,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Lỗi khi áp dụng khuyến mãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi áp dụng khuyến mãi', error: error.message });
  }
});

// POST thu thập mã giảm giá
// POST thu thập mã giảm giá
router.post("/collect/:identifier", protect, async (req, res) => {
  try {
    const { identifier } = req.params;
    let discount;

    // Nếu identifier là ObjectId -> tìm theo _id, ngược lại -> tìm theo code
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      discount = await Discount.findById(identifier);
    } else {
      discount = await Discount.findOne({ code: identifier });
    }

    if (!discount) {
      return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }

    const voucher = await UserVoucher.create({
      userId: req.user._id,
      discountId: discount._id, // bạn nên đổi lại field này trong model cho hợp lý
      voucherCode: discount.code,
      expiryDate: discount.endDate,
    });

    res.json({ message: "Đã thu thập mã", voucher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET tất cả mã user đã thu thập
router.get("/my-vouchers", protect, async (req, res) => {
  try {
    const vouchers = await UserVoucher.find({ userId: req.user._id, isUsed: false });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy voucher của bạn" });
  }
});


/**
 * @route   GET /api/discounts/:id/hotels
 * @desc    Lấy danh sách khách sạn áp dụng khuyến mãi theo ID
 * @access  Công khai
 */
// GET /api/discounts/:id/hotels - Lấy các khách sạn áp dụng discount
router.get('/:id/hotels', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('applicableHotels'); // populate từ Hotel
    if (!discount) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });

    res.json(discount.applicableHotels);
  } catch (error) {
    console.error('Error fetching hotels for discount:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * @route   GET /api/discounts/festival
 * @desc    Lấy danh sách các khuyến mãi lễ hội đang hoạt động
 * @access  Công khai
 */
router.get('/festival', async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      type: 'festival',
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableHotels', 'name region imageurls address rating');

    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách festival', error: error.message });
  }
});

/**
 * @route   GET /api/discounts/:id/festival-hotels
 * @desc    Lấy chi tiết 1 lễ hội + danh sách khách sạn áp dụng
 * @access  Công khai
 */
router.get('/:id/festival-hotels', async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate({
        path: 'applicableHotels',
        populate: { path: 'region', select: 'name' },
        select: 'name region imageurls address rating rooms',
      });

    if (!discount) {
      return res.status(404).json({ message: 'Không tìm thấy khuyến mãi lễ hội' });
    }

    if (discount.type !== 'festival') {
      return res.status(400).json({ message: 'Khuyến mãi này không phải là loại lễ hội' });
    }
    const hotelsWithDiscountedRooms = await Promise.all(
      discount.applicableHotels.map(async (hotel) => {
        const populatedHotel = await hotel.populate('rooms', 'name rentperday imageurls');
        const h = populatedHotel.toObject();

        h.rooms = h.rooms.map((room) => ({
          ...room,
          discountedPrice:
            discount.discountType === 'percentage'
              ? Math.round(room.rentperday * (1 - discount.discountValue / 100))
              : Math.max(room.rentperday - discount.discountValue, 0),
        }));

        return h;
      })
    );
    res.status(200).json({
      festival: {
        _id: discount._id,
        name: discount.name,
        description: discount.description,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        startDate: discount.startDate,
        endDate: discount.endDate,
      },
      hotels: hotelsWithDiscountedRooms,
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu lễ hội:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu lễ hội', error: error.message });
  }
});




module.exports = router;