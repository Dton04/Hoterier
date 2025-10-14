const jwt = require('jsonwebtoken');
const User = require('../models/user');

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
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép, yêu cầu vai trò admin hoặc staff' });
  }
};

// Middleware phân quyền cho API admin quản lý phòng
const restrictRoomManagement = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không được phép, không tìm thấy người dùng' });
  }
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Không được phép quản lý phòng' });
  }
};

module.exports = { protect, admin, staff, adminOrStaff, restrictRoomManagement };