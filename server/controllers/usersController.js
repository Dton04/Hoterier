// usersController.js
const mongoose = require('mongoose');
const User = require('../models/user');
const Booking = require('../models/booking');
const Review = require('../models/review');
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Notification = require('../models/notification');
const Region = require('../models/region');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

const generateToken = require('../utils/generateToken');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Gửi OTP qua Gmail
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"HOTERIER" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Mã xác minh OTP của bạn',
    html: `
      <h3>Xin chào,</h3>
      <p>Mã OTP của bạn là: <b>${otp}</b></p>
      <p>Mã này sẽ hết hạn sau 5 phút.</p>
    `,
  });
};
// Đăng ký người dùng mới
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email đã tồn tại' });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 5 * 60 * 1000,
      isDeleted: true, // Chưa xác minh OTP => tạm khóa tài khoản
    });

    await user.save();
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: 'Đã gửi mã OTP. Vui lòng kiểm tra email để xác nhận tài khoản.',
      redirect: `/verify-otp?email=${encodeURIComponent(email)}`,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};


// Đăng nhập và nhận JWT token
// Đăng nhập thường - gửi OTP qua email trước khi xác nhận
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: 'Email không tồn tại.' });

    if (user.isDeleted)
      return res.status(400).json({ message: 'Tài khoản chưa được xác minh OTP.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Sai mật khẩu.' });

    // Tạo và lưu OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: 'OTP đã được gửi, vui lòng xác minh để đăng nhập.',
      redirect: `/verify-otp?email=${encodeURIComponent(email)}`,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
};


// Xử lý callback từ Google OAuth

// Google OAuth callback – Gửi OTP trước khi cho login
exports.googleCallback = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.redirect('http://localhost:3000/login?error=User not found');
    }

    // --- Sinh OTP ---
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // Hết hạn sau 5 phút
    await user.save();

    // --- Gửi email OTP bằng Gmail trung gian ---
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gmail trung gian
        pass: process.env.EMAIL_PASS, // App password của Gmail này
      },
    });

    const mailOptions = {
      from: `"Booking Hotel OTP" <${process.env.EMAIL_USER}>`,
      to: user.email, // gửi OTP đến email người dùng
      subject: 'Mã OTP xác nhận đăng nhập bằng Google',
      html: `
        <p>Xin chào ${user.name || 'người dùng'},</p>
        <p>Mã OTP đăng nhập của bạn là: <b>${otp}</b></p>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
        <p>Trân trọng,<br/>Đội ngũ Booking Hotel</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Đã gửi OTP tới ${user.email}`);

    // --- Redirect về trang nhập OTP ---
    res.redirect(`http://localhost:3000/verify-otp?email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error('❌ Google callback OTP error:', error.message);
    res.redirect('http://localhost:3000/login?error=Không thể gửi mã OTP');
  }
};

// Xác minh OTP Google
// Xác minh OTP (dùng chung cho đăng nhập thường & Google)
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Không tìm thấy người dùng.' });

    if (!user.otp || Date.now() > user.otpExpires)
      return res.status(400).json({ message: 'OTP đã hết hạn.' });

    if (String(user.otp).trim() !== String(otp).trim())
      return res.status(400).json({ message: 'OTP không hợp lệ.' });

    user.isDeleted = false;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Xác minh OTP thành công.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        avatar: user.avatar || "",
        phone: user.phone || "",
        token,
      },
    });

  } catch (error) {
    console.error('Lỗi xác minh OTP:', error);
    res.status(500).json({ message: 'Lỗi server khi xác minh OTP.' });
  }
};







// Xử lý callback từ Facebook OAuth
exports.facebookCallback = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.redirect('http://localhost:3000/login?error=User not found');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      phone: user.phone,
      token,
      bookingsCount: await Booking.countDocuments({ email: user.email.toLowerCase() }),
    };

    const userDataParam = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`http://localhost:3000/auth/facebook/callback?user=${userDataParam}`);
  } catch (error) {
    console.error('Facebook callback error:', error.message);
    res.redirect('http://localhost:3000/login?error=Facebook authentication failed');
  }
};

// Lấy điểm tích lũy của người dùng hiện tại
exports.getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const transactions = await Transaction.find({ userId: req.user.id })
      .select('points amount bookingId createdAt')
      .populate('bookingId', 'checkin checkout')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      points: user.points,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error('Lỗi lấy điểm tích lũy:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy điểm tích lũy', error: error.message });
  }
};

// Lấy lịch sử điểm tích lũy của một người dùng
exports.getPointsHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const user = await User.findById(userId).select('points name email');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const transactions = await Transaction.find({ userId })
      .select('points amount bookingId paymentMethod status createdAt')
      .populate('bookingId', 'checkin checkout roomid')
      .sort({ createdAt: -1 });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
      transactions,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử điểm:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử điểm', error: error.message });
  }
};

// Lấy cấp độ thành viên
exports.getMembershipLevel = async (req, res) => {
  const { userId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    const user = await User.findById(userId).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let membershipLevel;
    if (user.points >= 400000) {
      membershipLevel = 'Diamond';
    } else if (user.points >= 300000) {
      membershipLevel = 'Platinum';
    } else if (user.points >= 200000) {
      membershipLevel = 'Gold';
    } else if (user.points >= 100000) {
      membershipLevel = 'Silver';
    } else {
      membershipLevel = 'Bronze';
    }

    res.status(200).json({
      userId,
      points: user.points,
      membershipLevel,
    });
  } catch (error) {
    console.error('Lỗi khi lấy cấp độ thành viên:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy cấp độ thành viên', error: error.message });
  }
};

// Tích điểm theo số điện thoại
exports.accumulatePoints = async (req, res) => {
  const { phone, bookingId, amount } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!phone || !bookingId || !amount) {
      return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại, ID đặt phòng và số tiền' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'ID đặt phòng không hợp lệ' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
    }

    if (booking.phone !== phone) {
      return res.status(400).json({ message: 'Số điện thoại không khớp với đặt phòng' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng với số điện thoại này' });
    }

    const pointsEarned = Math.floor(amount / 1000); // 1000 VNĐ = 1 điểm
    user.points += pointsEarned;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      bookingId,
      amount,
      pointsEarned,
      paymentMethod: booking.paymentMethod,
      status: 'completed',
    });
    await transaction.save();

    res.status(200).json({
      message: 'Tích điểm thành công',
      pointsEarned,
      newPoints: user.points,
    });
  } catch (error) {
    console.error('Lỗi tích điểm:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tích điểm', error: error.message });
  }
};
// Tạo user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: false,
      role: 'user',
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Create staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
};
// Cập nhật người dùng
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// 🟢 Lấy toàn bộ người dùng (bao gồm user, staff, admin)
exports.getAllUsers = async (req, res) => {
  try {
    let filter = { isDeleted: false };

    //Nếu là staff → chỉ thấy user
    if (req.user.role === "staff") {
      filter.role = "user";
    }

    //Nếu là admin → chỉ thấy user + staff (ẩn admin khác)
    if (req.user.role === "admin") {
      filter.role = { $in: ["user", "staff"] };
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error.message);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
};


// Tạo staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: false,
      role: 'staff',
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Create staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách staff
exports.getStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff', isDeleted: false }).select('-password');
    res.json(staffMembers);
  } catch (error) {
    console.error('Get staff error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật staff
exports.updateStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user.role === 'staff') {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase() : user.email;
      user.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: 'Nhân viên không tồn tại' });
    }
  } catch (error) {
    console.error('Update staff error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Xóa staff (soft delete)
exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
    }
    user.isDeleted = true;
    await user.save();
    res.json({ message: 'Người dùng đã được đánh dấu là xóa' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách đặt phòng của một người dùng
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const bookings = await Booking.find({ email: user.email.toLowerCase() });
    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy thông tin hồ sơ người dùng
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Đếm tổng số đặt phòng
    const bookingsCount = await Booking.countDocuments({ email: user.email.toLowerCase() });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || '',
      bookingsCount,
    });
  } catch (error) {
    console.error('Lỗi khi lấy hồ sơ người dùng:', error.message);
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ người dùng' });
  }
};

// Cập nhật profile người dùng
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const updates = {
      name: req.body.name || user.name,
      phone: req.body.phone || user.phone,
    };

    // Handle complex fields (parse JSON if sent as string via FormData)
    if (req.body.companions) {
      try {
        updates.companions = typeof req.body.companions === 'string' ? JSON.parse(req.body.companions) : req.body.companions;
      } catch (e) { console.error("Error parsing companions", e); }
    }
    if (req.body.settings) {
      try {
        updates.settings = typeof req.body.settings === 'string' ? JSON.parse(req.body.settings) : req.body.settings;
      } catch (e) { console.error("Error parsing settings", e); }
    }
    if (req.body.paymentMethods) {
      try {
        updates.paymentMethods = typeof req.body.paymentMethods === 'string' ? JSON.parse(req.body.paymentMethods) : req.body.paymentMethods;
      } catch (e) { console.error("Error parsing paymentMethods", e); }
    }
    if (req.body.privacySettings) {
      try {
        updates.privacySettings = typeof req.body.privacySettings === 'string' ? JSON.parse(req.body.privacySettings) : req.body.privacySettings;
      } catch (e) { console.error("Error parsing privacySettings", e); }
    }

    // Upload avatar lên Cloudinary
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'users',
        public_id: `${user._id}_avatar_${Date.now()}`,
      });

      updates.avatar = uploadResult.secure_url;

      // Xóa file tạm
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Lỗi xóa file avatar tạm:", err);
      });
    }


    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user profile error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng!' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy danh sách review của người dùng
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const reviews = await Review.find({ email: user.email.toLowerCase() });
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy thống kê người dùng
exports.getUserStats = async (req, res) => {
  try {
    const { startDate, endDate, region } = req.query;

    let query = { isDeleted: false };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (region) {
      query.region = region;
    }

    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: { role: '$role', region: '$region' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Ban người dùng (soft delete với lý do)
exports.banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không thể khóa tài khoản admin' });
    }

    user.isDeleted = true;
    user.banReason = reason;
    await user.save();

    res.json({ message: 'Khóa tài khoản thành công', banReason: reason });
  } catch (error) {
    console.error('Ban user error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Cập nhật vai trò người dùng
exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    user.role = role;
    user.isAdmin = role === 'admin';
    await user.save();

    res.json({ message: 'Cập nhật vai trò thành công', role });
  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy người dùng gần đây
exports.getRecentUsers = async (req, res) => {
  try {
    const recentUsers = await User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');
    res.json(recentUsers);
  } catch (error) {
    console.error('Get recent users error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy người dùng thường xuyên đặt phòng
exports.getFrequentUsers = async (req, res) => {
  try {
    const frequentUsers = await Booking.aggregate([
      {
        $group: {
          _id: '$email',
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'email',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          bookingCount: 1,
        },
      },
    ]);

    res.json(frequentUsers);
  } catch (error) {
    console.error('Get frequent users error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Tìm kiếm người dùng
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Yêu cầu từ khóa tìm kiếm' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      isDeleted: false,
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy thông báo của người dùng
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = req.user;

    if (requestingUser.id !== userId && !['admin', 'staff'].includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Không được phép' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const notifications = await Notification.find({ userId });
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Gửi thông báo
exports.sendNotification = async (req, res) => {
  try {
    const userId = req.params.id;
    const { message, type } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const notification = new Notification({
      userId,
      message,
      type: type || 'info',
    });

    await notification.save();
    res.status(201).json({ message: 'Gửi thông báo thành công', notification });
  } catch (error) {
    console.error('Send notification error:', error.message);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Phân quyền admin khu vực
exports.assignRegionAdmin = async (req, res) => {
  const { userId, regionId } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID người dùng hoặc khu vực không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'Người dùng phải có vai trò admin' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    region.adminId = userId;
    user.region = regionId;
    await region.save();
    await user.save();

    res.status(200).json({ message: 'Phân quyền admin khu vực thành công', region, user });
  } catch (error) {
    console.error('Lỗi phân quyền admin khu vực:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi phân quyền admin khu vực', error: error.message });
  }
};

// Lấy quyền lợi thành viên
exports.getMembershipBenefits = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    const user = await User.findById(userId).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let membershipLevel;
    if (user.points >= 400000) membershipLevel = 'Diamond';
    else if (user.points >= 300000) membershipLevel = 'Platinum';
    else if (user.points >= 200000) membershipLevel = 'Gold';
    else if (user.points >= 100000) membershipLevel = 'Silver';
    else membershipLevel = 'Bronze';

    const benefits = {
      Bronze: ['Ưu đãi cơ bản', 'Tích điểm 1% mỗi giao dịch'],
      Silver: ['Ưu đãi cơ bản', 'Tích điểm 1.5% mỗi giao dịch', 'Miễn phí nâng cấp phòng 1 lần/năm'],
      Gold: ['Ưu đãi cơ bản', 'Tích điểm 2% mỗi giao dịch', 'Miễn phí nâng cấp phòng 2 lần/năm', 'Check-in ưu tiên'],
      Platinum: ['Ưu đãi cơ bản', 'Tích điểm 2.5% mỗi giao dịch', 'Miễn phí nâng cấp phòng 3 lần/năm', 'Check-in ưu tiên', 'Dịch vụ đưa đón sân bay'],
      Diamond: ['Ưu đãi cơ bản', 'Tích điểm 3% mỗi giao dịch', 'Miễn phí nâng cấp phòng không giới hạn', 'Check-in ưu tiên', 'Dịch vụ đưa đón sân bay', 'Quà tặng đặc biệt hàng năm'],
    };

    res.status(200).json({
      userId,
      membershipLevel,
      points: user.points,
      benefits: benefits[membershipLevel],
    });
  } catch (error) {
    console.error('Lỗi khi lấy quyền lợi thành viên:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy quyền lợi thành viên', error: error.message });
  }
};


//GỬi OTP qua gmail

exports.sendGoogleOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Thiếu email' });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Lưu OTP vào user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 phút
    await user.save();

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // email hệ thống
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận đăng nhập bằng Google',
      html: `<p>Xin chào ${user.name},</p>
             <p>Mã OTP của bạn là: <b>${otp}</b></p>
             <p>Mã này sẽ hết hạn sau 5 phút.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Lỗi gửi OTP:', error.message);
    res.status(500).json({ message: 'Không thể gửi OTP', error: error.message });
  }
};



// [GET] /api/users/:id/rewards-summary
exports.getRewardsSummary = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('points name email');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    let membershipLevel;
    if (user.points >= 400000) membershipLevel = 'Diamond';
    else if (user.points >= 300000) membershipLevel = 'Platinum';
    else if (user.points >= 200000) membershipLevel = 'Gold';
    else if (user.points >= 100000) membershipLevel = 'Silver';
    else membershipLevel = 'Bronze';

    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentIndex = levels.indexOf(membershipLevel);
    const nextLevel = levels[currentIndex + 1] || 'Max';
    const nextThreshold = [0, 100000, 200000, 300000, 400000, 500000][currentIndex + 1] || null;

    const benefitsMap = {
      Bronze: ['Ưu đãi cơ bản', 'Tích điểm 1% mỗi giao dịch'],
      Silver: ['Ưu đãi cơ bản', 'Tích điểm 1.5%', 'Nâng cấp phòng 1 lần/năm'],
      Gold: ['Ưu đãi cơ bản', 'Tích điểm 2%', 'Nâng cấp phòng 2 lần/năm', 'Check-in ưu tiên'],
      Platinum: ['Ưu đãi cơ bản', 'Tích điểm 2.5%', 'Nâng cấp phòng 3 lần/năm', 'Đưa đón sân bay'],
      Diamond: ['Ưu đãi cơ bản', 'Tích điểm 3%', 'Nâng cấp phòng không giới hạn', 'Quà tặng đặc biệt'],
    };

    res.json({
      name: user.name,
      email: user.email,
      points: user.points,
      membershipLevel,
      nextLevel,
      pointsToNext: nextThreshold ? Math.max(nextThreshold - user.points, 0) : 0,
      benefits: benefitsMap[membershipLevel],
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin điểm thưởng', error: error.message });
  }
};


