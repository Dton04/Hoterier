const Notification = require('../models/notification');
const User = require('../models/user');

// Lấy danh sách thông báo cho admin
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

// Gửi thông báo mới (chỉ admin)
const sendNotification = async (req, res) => {
  try {
    const { audience, message, type } = req.body;
    
    if (!message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }

    // Tạo thông báo mới
    const notification = new Notification({
      userId: req.user?._id || null, // ID của admin đang tạo thông báo
      message,
      type: type || 'info',
      audience: audience || 'all',
      createdAt: new Date()
    });

    await notification.save();

    // Gửi realtime qua socket.io nếu có
    if (global.io) {
      if (audience === 'staff') {
        global.io.to('role:staff').emit('notification:new', notification);
      } else {
        global.io.to('role:user').emit('notification:new', notification);
        global.io.to('role:admin').emit('notification:new', notification);
        global.io.to('role:staff').emit('notification:new', notification);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thông báo đã được gửi thành công',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

// Lấy thông báo cho user hiện tại
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [
        { audience: 'all' },
        { audience: req.user.role }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    const latest = notifications[0]?.createdAt || null;
    const hasNew = !req.user.lastNotificationSeenAt || (latest && latest > req.user.lastNotificationSeenAt);

    res.status(200).json({
      success: true,
      notifications,
      hasNew
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
};

// Lấy thông báo công khai mới nhất
const getLatestPublicNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      audience: 'all'
    })
    .sort({ createdAt: -1 });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không có thông báo nào'
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
};

module.exports = {
  getAdminNotifications,
  sendNotification,
  getUserNotifications,
  getLatestPublicNotification,
  markNotificationsSeen: async (req, res) => {
    try {
      req.user.lastNotificationSeenAt = new Date();
      await req.user.save();
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái thông báo', error: error.message });
    }
  }
};