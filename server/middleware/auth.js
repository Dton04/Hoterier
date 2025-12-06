const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Booking = require('../models/booking');

// Middleware kiểm tra token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
      }
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Không được phép, token đã hết hạn' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Không được phép, token không hợp lệ' });
      }
      return res.status(401).json({ message: 'Không được phép, xác thực token thất bại' });
    }
  } else {
    return res.status(401).json({ message: 'Không được phép, không cung cấp token' });
  }
};

// Middleware chỉ cho admin
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  }
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép với vai trò admin' });
  }
};

// Middleware chỉ cho staff
const staff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  }
  if (req.user.role === 'staff') {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép với vai trò nhân viên' });
  }
};

// Middleware kiểm tra admin hoặc staff
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép, yêu cầu vai trò admin hoặc staff' });
  }
};

// Middleware phân quyền cho API admin quản lý phòng
const restrictRoomManagement = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  }
  if (req.user.isAdmin) {
    return next();
  }

  // Cho phép staff quản lý phòng thuộc khách sạn có email trùng với staff
  if (req.user.role === 'staff') {
    try {
      const staffEmail = String(req.user.email || '').toLowerCase();

      // Tạo mới phòng: cần hotelId trong body
      if (req.method === 'POST' && req.baseUrl?.includes('/rooms') && !req.params.id) {
        const { hotelId } = req.body || {};
        if (!hotelId) return res.status(400).json({ message: 'hotelId là bắt buộc' });
        const hotel = await Hotel.findById(hotelId).select('email');
        if (hotel && String(hotel.email || '').toLowerCase() === staffEmail) return next();
        return res.status(403).json({ message: 'Bạn không có quyền quản lý phòng của khách sạn này' });
      }

      // Cập nhật/Xử lý ảnh/Xóa tiện ích: cần kiểm tra roomId trong params
      const roomId = req.params?.id;
      if (roomId) {
        const room = await Room.findById(roomId).select('hotelId');
        if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng' });
        const hotel = await Hotel.findById(room.hotelId).select('email');
        if (hotel && String(hotel.email || '').toLowerCase() === staffEmail) return next();
        return res.status(403).json({ message: 'Bạn không có quyền quản lý phòng của khách sạn này' });
      }

      // Mặc định từ chối
      return res.status(403).json({ message: 'Không được phép quản lý phòng' });
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi kiểm tra quyền quản lý phòng', error: err?.message });
    }
  }

  return res.status(403).json({ message: 'Không được phép quản lý phòng' });
};

// Middleware: chỉ cho phép duyệt/hủy đơn trong phạm vi khách sạn staff sở hữu
const restrictBookingApproval = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  }
  if (req.user.isAdmin) return next();

  if (req.user.role === 'staff') {
    try {
      const staffEmail = String(req.user.email || '').toLowerCase();
      const bookingId = req.params?.id;
      if (!bookingId) return res.status(400).json({ message: 'Thiếu ID đặt phòng' });

      const booking = await Booking.findById(bookingId).select('hotelId');
      if (!booking) return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });

      const hotel = await Hotel.findById(booking.hotelId).select('email');
      if (hotel && String(hotel.email || '').toLowerCase() === staffEmail) return next();
      return res.status(403).json({ message: 'Bạn không có quyền duyệt/hủy đơn của khách sạn này' });
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi kiểm tra quyền đặt phòng', error: err?.message });
    }
  }

  return res.status(403).json({ message: 'Không được phép duyệt/hủy đặt phòng' });
};

// Hotel update: admin or staff that owns the hotel; staff cannot change email
const restrictHotelUpdate = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  if (req.user.isAdmin) { req.allowUpdateEmail = true; return next(); }
  if (req.user.role === 'staff') {
    try {
      const hotelId = req.params?.id || req.body?.hotelId;
      if (!hotelId) return res.status(400).json({ message: 'Thiếu ID khách sạn' });
      const hotel = await Hotel.findById(hotelId).select('email');
      if (!hotel) return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
      const staffEmail = String(req.user.email || '').toLowerCase();
      if (String(hotel.email || '').toLowerCase() !== staffEmail) {
        return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa khách sạn này' });
      }
      req.allowUpdateEmail = false;
      return next();
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi kiểm tra quyền khách sạn', error: err?.message });
    }
  }
  return res.status(403).json({ message: 'Không được phép chỉnh sửa khách sạn' });
};

module.exports = { protect, admin, staff, adminOrStaff, restrictRoomManagement, restrictBookingApproval, restrictHotelUpdate };
