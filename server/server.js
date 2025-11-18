// server.js
  require('dotenv').config();

  const express = require('express');
  const cors = require('cors');
  const multer = require('multer');
  const path = require('path');
  const mongoose = require('mongoose');
  const fs = require('fs');
  const chatbotRoutes = require('./routes/chatbotRoutes');

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
  app.use("/Uploads", express.static(path.join(__dirname, "Uploads")));

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
  const chatRoutes = require('./routes/chatRoutes');
  const notificationsRoutes = require('./routes/notificationsRoutes');


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
  app.use('/api/amenities', require('./routes/amenityRoutes'));
  app.use('/api/momo', momoRoutes);
  app.use('/api/vnpay', vnpayRoutes);
  // Mount chat routes tại đây
  app.use('/api/chats', chatRoutes);
  app.use('/api/chatbot',chatbotRoutes);
  app.use('/api/notifications', notificationsRoutes);

  // Xử lý lỗi không được bắt
  app.use((err, req, res, next) => {
    const multer = require('multer');
    // Bắt lỗi từ Multer (giới hạn size, v.v.)
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Kích thước ảnh vượt quá 5MB' });
      }
      return res.status(400).json({ message: `Upload lỗi: ${err.code}` });
    }
    // Bắt multipart lỗi boundary / part header
    if (err && typeof err.message === 'string' && err.message.includes('Malformed part header')) {
      return res.status(400).json({
        message: 'Yêu cầu multipart/form-data không hợp lệ (thiếu hoặc sai boundary). Hãy để Postman tự đặt Content-Type khi dùng form-data.',
      });
    }
  
    // Middleware xử lý lỗi chung (đơn giản)
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
  });

  const port = process.env.PORT || 5000;

// Tạo HTTP server và Socket.IO
  const http = require('http');
  const server = http.createServer(app);
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');
  const User = require('./models/user');
  const Conversation = require('./models/conversation');
  const Message = require('./models/message');

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  // Cho phép sử dụng ở controller
  global.io = io;

  // Xác thực socket bằng JWT
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      const token = socket.handshake.auth?.token || socket.handshake.query?.token || tokenFromHeader;

      if (!token) {
        console.error('Socket auth missing token:', {
          headersAuth: !!tokenFromHeader,
          authToken: !!socket.handshake.auth?.token,
          queryToken: !!socket.handshake.query?.token,
        });
        return next(new Error('Không có token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Token không hợp lệ'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Xác thực socket thất bại'));
    }
  });

  // Sự kiện realtime
  io.on('connection', (socket) => {
    // Thêm user vào rooms theo role
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user._id}`);
    
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const role = socket.user.role;
        const isParticipant = conv.participants.some(p => p.user.equals(socket.user._id));
        const hasAgent = conv.participants.some(p => p.role === 'staff' || p.role === 'admin');

        if (role === 'admin') {
          if (!isParticipant) conv.participants.push({ user: socket.user._id, role: 'admin' });
        } else if (role === 'staff') {
          if (!isParticipant) conv.participants.push({ user: socket.user._id, role: 'staff' });
        } else {
          if (!isParticipant || !hasAgent) return;
        }
        if ((role === 'staff' || role === 'admin') && !isParticipant) {
          conv.participants.push({ user: socket.user._id, role });
          await conv.save();
        }
        socket.join(conversationId);
        io.to(conversationId).emit('conversation:joined', { userId: socket.user._id.toString() });
      } catch (e) {}
    });

    socket.on('message:send', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) return;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const role = socket.user.role;
        const isParticipant = conv.participants.some(p => p.user.equals(socket.user._id));
        const hasAgent = conv.participants.some(p => p.role === 'staff' || p.role === 'admin');

        if (role === 'admin') {
          if (!isParticipant) conv.participants.push({ user: socket.user._id, role: 'admin' });
        } else if (role === 'staff') {
          if (!isParticipant) conv.participants.push({ user: socket.user._id, role: 'staff' });
        } else {
          if (!isParticipant || !hasAgent) return;
        }

        const msg = await Message.create({
          conversation: conv._id,
          sender: socket.user._id,
          content: content.trim(),
        });

        conv.lastMessageAt = msg.createdAt;
        await conv.save();

        io.to(conversationId).emit('message:new', {
          _id: msg._id.toString(),
          conversation: conversationId,
          sender: socket.user._id.toString(),
          content: msg.content,
          createdAt: msg.createdAt,
        });
      } catch (e) {}
    });

    socket.on('typing', ({ conversationId }) => {
      if (conversationId) socket.to(conversationId).emit('typing', { userId: socket.user._id.toString() });
    });
  });

// Khởi động server HTTP thay cho app.listen
  server.listen(port, () => console.log(`Server is running on port ${port}`));
