// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

// Kiểm tra JWT_SECRET
console.log('JWT_SECRET:', process.env.JWT_SECRET);
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env file');
}

const app = express();

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Tạo thư mục uploads nếu chưa có
if (!fs.existsSync('Uploads')) {
  fs.mkdirSync('Uploads');
}

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static('Uploads'));

// Middleware
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json()); // Phân tích JSON body
app.use(express.urlencoded({ extended: true })); // Phân tích URL-encoded body

// Routes
const connectDB = require('./db');
const roomsRoute = require('./routes/roomRoutes');
const bookingRoute = require('./routes/bookingRoutes');
const usersRoute = require('./routes/usersRoutes');
const contactRoutes = require('./routes/contactRoutes');
const reviewRoute = require('./routes/reviewRoutes');
const dashboardRoute = require('./routes/dashboardRoutes');
const revenueRoute = require('./routes/revenueRoutes');
const regionsRoute = require('./routes/regionsRoutes');
const momoRoutes = require('./routes/momoRoutes');
const vnpayRoutes = require('./routes/vnpayRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const rewardsRoutes = require('./routes/rewardsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const discountRoutes = require('./routes/discountRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

// Debug routes
console.log('roomsRoute:', roomsRoute);
console.log('bookingRoute:', bookingRoute);
console.log('usersRoute:', usersRoute);
console.log('contactRoute:', contactRoutes);
console.log('reviewRoute:', reviewRoute);
console.log('dashboardRoute:', dashboardRoute);
console.log('revenueRoute:', revenueRoute);
console.log('regionsRoute:', regionsRoute);
console.log('momoRoutes:', momoRoutes);
console.log('serviceRoutes:', serviceRoutes);
console.log('hotelRoutes:', hotelRoutes);
console.log('rewardsRoutes:', rewardsRoutes);
console.log('statsRoutes:', statsRoutes);
console.log('discountRoutes:', discountRoutes);
console.log('favoriteRoutes:', favoriteRoutes);

// Routes
app.use('/api', contactRoutes);
app.use('/api/rooms', roomsRoute);
app.use('/api/bookings', bookingRoute);
app.use('/api/users', usersRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/revenue', revenueRoute);
app.use('/api/regions', regionsRoute);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/momo', momoRoutes);
app.use('/api/vnpay', vnpayRoutes);

// Xử lý lỗi không được bắt
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    message: 'Đã xảy ra lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));