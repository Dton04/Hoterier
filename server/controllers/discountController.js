const Discount = require('../models/discount');
const UserVoucher = require('../models/userVouchers');
const Hotel = require('../models/hotel');

// @desc    Create new discount/voucher
// @route   POST /api/discounts
// @access  Admin
const createDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      applicableHotels,
      type,
      code,
      minBookingValue,
      maxDiscountAmount,
      isPublic,
      isStackable,
      targetUserSegments,
    } = req.body;

    const discount = new Discount({
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      applicableHotels,
      type,
      code,
      minBookingValue,
      maxDiscountAmount,
      isPublic,
      isStackable,
      targetUserSegments,
    });

    const createdDiscount = await discount.save();
    res.status(201).json(createdDiscount);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi tạo khuyến mãi',
      error: error.message
    });
  }
};

// @desc    Update discount/voucher
// @route   PUT /api/discounts/:id
// @access  Admin
const updateDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      applicableHotels,
      type,
      code,
      minBookingValue,
      maxDiscountAmount,
      isPublic,
      isStackable,
      targetUserSegments,
      isDeleted
    } = req.body;

    const discount = await Discount.findById(req.params.id);

    if (discount) {
      discount.name = name || discount.name;
      discount.description = description || discount.description;
      discount.discountType = discountType || discount.discountType;
      discount.discountValue = discountValue || discount.discountValue;
      discount.startDate = startDate || discount.startDate;
      discount.endDate = endDate || discount.endDate;
      discount.usageLimit = usageLimit || discount.usageLimit;
      discount.applicableHotels = applicableHotels || discount.applicableHotels;
      discount.type = type || discount.type;
      discount.code = code || discount.code;
      discount.minBookingValue = minBookingValue || discount.minBookingValue;
      discount.maxDiscountAmount = maxDiscountAmount || discount.maxDiscountAmount;
      discount.isPublic = isPublic !== undefined ? isPublic : discount.isPublic;
      discount.isStackable = isStackable !== undefined ? isStackable : discount.isStackable;
      discount.targetUserSegments = targetUserSegments || discount.targetUserSegments;
      discount.isDeleted = isDeleted !== undefined ? isDeleted : discount.isDeleted;

      const updatedDiscount = await discount.save();
      res.json(updatedDiscount);
    } else {
      res.status(404).json({
        message: 'Không tìm thấy khuyến mãi'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi cập nhật khuyến mãi',
      error: error.message
    });
  }
};

// @desc    Get all public discounts (voucher + limited)
// @route   GET /api/discounts
// @access  Public
const getPublicDiscounts = async (req, res) => {
  try {
    const now = new Date();

    // ✅ Cho phép cả voucher lẫn limited, kể cả khi type bị thiếu hoặc viết hoa
    const discounts = await Discount.find({
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { type: /voucher/i },
        { type: /festival/i },
        { type: /limited/i },
        { type: { $exists: false } },
      ],
    }).populate("applicableHotels", "name region imageurls address rating");

    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách khuyến mãi công khai",
      error: error.message,
    });
  }
};



// @desc    Get all discounts for admin
// @route   GET /api/discounts/admin
// @access  Admin
const getAllDiscountsAdmin = async (req, res) => {
  try {
    const discounts = await Discount.find({}).populate('applicableHotels', 'name');
    res.json(discounts);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách khuyến mãi cho admin',
      error: error.message
    });
  }
};

// @desc    Get member-level discounts
// @route   GET /api/discounts/member
// @access  Private (User)
const getMemberDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      isDeleted: false,
      startDate: {
        $lte: now
      },
      endDate: {
        $gte: now
      },
      $or: [{
        isPublic: true
      }, {
        targetUserSegments: 'member'
      }, ],
    }).populate('applicableHotels', 'name region imageurls address rating');
    res.json(discounts);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách khuyến mãi thành viên',
      error: error.message
    });
  }
};

// @desc    Get accumulated discounts (based on spending)
// @route   GET /api/discounts/accumulated
// @access  Private (User)
const getAccumulatedDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      isDeleted: false,
      startDate: {
        $lte: now
      },
      endDate: {
        $gte: now
      },
      type: 'accumulated',
    }).populate('applicableHotels', 'name region imageurls address rating');
    res.json(discounts);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách khuyến mãi tích lũy',
      error: error.message
    });
  }
};

// @desc    Soft delete a discount
// @route   DELETE /api/discounts/:id
// @access  Admin
const deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (discount) {
      discount.isDeleted = true;
      await discount.save();
      res.json({
        message: 'Khuyến mãi đã được xóa mềm'
      });
    } else {
      res.status(404).json({
        message: 'Không tìm thấy khuyến mãi'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi xóa khuyến mãi',
      error: error.message
    });
  }
};

// @desc    Apply multiple discounts to a booking
// @route   POST /api/discounts/apply
// @access  Private (User)
const applyDiscounts = async (req, res) => {
  try {
    const {
      discountCodes,
      bookingValue,
      hotelId
    } = req.body;
    const userId = req.user._id;
    const now = new Date();

    let totalDiscountAmount = 0;
    let appliedDiscounts = [];

    for (const code of discountCodes) {
      const discount = await Discount.findOne({
        code,
        isDeleted: false,
        startDate: {
          $lte: now
        },
        endDate: {
          $gte: now
        },
      });

      if (!discount) {
        return res.status(400).json({
          message: `Mã khuyến mãi ${code} không hợp lệ hoặc đã hết hạn.`
        });
      }

      if (discount.minBookingValue && bookingValue < discount.minBookingValue) {
        return res.status(400).json({
          message: `Giá trị đặt phòng không đủ để áp dụng mã ${code}. Yêu cầu tối thiểu ${discount.minBookingValue}.`
        });
      }

      if (discount.applicableHotels && discount.applicableHotels.length > 0 && !discount.applicableHotels.includes(hotelId)) {
        return res.status(400).json({
          message: `Mã khuyến mãi ${code} không áp dụng cho khách sạn này.`
        });
      }

      // Check usage limit
      const usageCount = await UserVoucher.countDocuments({
        userId,
        discountId: discount._id
      });
      if (discount.usageLimit && usageCount >= discount.usageLimit) {
        return res.status(400).json({
          message: `Bạn đã sử dụng mã khuyến mãi ${code} quá số lần cho phép.`
        });
      }

      let currentDiscount = 0;
      if (discount.discountType === 'percentage') {
        currentDiscount = bookingValue * (discount.discountValue / 100);
      } else {
        currentDiscount = discount.discountValue;
      }

      if (discount.maxDiscountAmount && currentDiscount > discount.maxDiscountAmount) {
        currentDiscount = discount.maxDiscountAmount;
      }

      totalDiscountAmount += currentDiscount;
      appliedDiscounts.push(discount._id);

      // Record usage
      await UserVoucher.create({
        userId,
        discountId: discount._id,
        code: discount.code,
        appliedAt: now,
      });
    }

    res.json({
      totalDiscountAmount,
      appliedDiscounts
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi áp dụng khuyến mãi',
      error: error.message
    });
  }
};

// @desc    Collect a discount code
// @route   POST /api/discounts/collect/:identifier
// @access  Private (User)
const collectDiscount = async (req, res) => {
  try {
    const {
      identifier
    } = req.params; // Can be discount ID or code
    const userId = req.user._id;

    let discount;
    if (identifier.length === 24 && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      discount = await Discount.findById(identifier);
    } else {
      discount = await Discount.findOne({
        code: identifier
      });
    }

    if (!discount) {
      return res.status(404).json({
        message: 'Không tìm thấy khuyến mãi'
      });
    }

    if (discount.isDeleted || discount.startDate > new Date() || discount.endDate < new Date()) {
      return res.status(400).json({
        message: 'Khuyến mãi không hợp lệ hoặc đã hết hạn.'
      });
    }

    const existingVoucher = await UserVoucher.findOne({
      userId,
      discountId: discount._id
    });
    if (existingVoucher) {
      return res.status(400).json({
        message: 'Bạn đã thu thập khuyến mãi này rồi.'
      });
    }

    const voucher = await UserVoucher.create({
      userId,
      discountId: discount._id,
      code: discount.code,
      collectedAt: new Date(),
    });

    res.json({
      message: 'Đã thu thập mã',
      voucher
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// @desc    Get all collected vouchers for a user
// @route   GET /api/discounts/my-vouchers
// @access  Private (User)
const getMyVouchers = async (req, res) => {
  try {
    const vouchers = await UserVoucher.find({
      userId: req.user._id,
      isUsed: false
    }).populate('discountId');
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({
      message: 'Lỗi khi lấy voucher của bạn',
      error: err.message
    });
  }
};

// @desc    Get hotels applicable to a discount by ID
// @route   GET /api/discounts/:id/hotels
// @access  Public
const getHotelsByDiscountId = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('applicableHotels');
    if (!discount) return res.status(404).json({
      message: 'Không tìm thấy khuyến mãi'
    });

    res.json(discount.applicableHotels);
  } catch (error) {
    console.error('Error fetching hotels for discount:', error);
    res.status(500).json({
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Get active festival discounts
// @route   GET /api/discounts/festival
// @access  Public
const getFestivalDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      type: 'festival',
      isDeleted: false,
      startDate: {
        $lte: now
      },
      endDate: {
        $gte: now
      },
    }).populate('applicableHotels', 'name region imageurls address rating');

    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách festival',
      error: error.message
    });
  }
};

// @desc    Get details of a festival discount + applicable hotels
// @route   GET /api/discounts/:id/festival-hotels
// @access  Public
const getFestivalDiscountDetails = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate({
        path: 'applicableHotels',
        populate: {
          path: 'region',
          select: 'name'
        },
        select: 'name region imageurls address rating rooms',
      });

    if (!discount) {
      return res.status(404).json({
        message: 'Không tìm thấy khuyến mãi lễ hội'
      });
    }

    if (discount.type !== 'festival') {
      return res.status(400).json({
        message: 'Khuyến mãi này không phải là loại lễ hội'
      });
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
    res.status(500).json({
      message: 'Lỗi khi lấy dữ liệu lễ hội',
      error: error.message
    });
  }
};


module.exports = {
  createDiscount,
  updateDiscount,
  getPublicDiscounts,
  getAllDiscountsAdmin,
  getMemberDiscounts,
  getAccumulatedDiscounts,
  deleteDiscount,
  applyDiscounts,
  collectDiscount,
  getMyVouchers,
  getHotelsByDiscountId,
  getFestivalDiscounts,
  getFestivalDiscountDetails,
};