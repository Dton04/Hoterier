const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

function canCreateConversation(requesterRole, targetRole) {
  if (requesterRole === 'user') return targetRole === 'staff';
  return ['user', 'staff', 'admin'].includes(targetRole);
}

// Tạo hội thoại: user chỉ tạo với staff, staff/admin tạo với bất kỳ
exports.createConversation = async (req, res) => {
  try {
    const requester = req.user;
    const { targetUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'ID người dùng mục tiêu không hợp lệ' });
    }

    const target = await User.findById(targetUserId).select('role isDeleted');
    if (!target || target.isDeleted) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng mục tiêu' });
    }

    if (!canCreateConversation(requester.role, target.role)) {
      return res.status(403).json({ message: 'Không được phép tạo hội thoại với đối tượng này' });
    }

    // Tìm hội thoại mở giữa 2 người
    let conv = await Conversation.findOne({
      status: 'open',
      $and: [
        { 'participants.user': requester._id },
        { 'participants.user': target._id },
      ],
    });

    if (!conv) {
      const participants = [
        { user: requester._id, role: requester.role },
        { user: target._id, role: target.role },
      ];
      conv = await Conversation.create({
        participants,
        createdBy: requester._id,
        assignedStaff: target.role === 'staff' ? target._id : null,
      });
    }

    const populated = await Conversation.findById(conv._id)
      .populate('participants.user', 'name email role avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error('createConversation error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo hội thoại' });
  }
};

// Danh sách hội thoại: user thấy hội thoại của mình; staff/admin thấy tất cả (Chế độ A)
exports.listConversations = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    if (user.role === 'user') {
      filter = { 'participants.user': user._id };
    }
    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .populate('participants.user', 'name email role avatar')
      .lean();

    res.status(200).json(conversations);
  } catch (error) {
    console.error('listConversations error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách hội thoại' });
  }
};

// Lấy tin nhắn: user chỉ khi là participant; staff/admin xem được tất cả (Chế độ A)
exports.getMessages = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID hội thoại không hợp lệ' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    if (user.role === 'user' && !conv.participants.some(p => p.user.equals(user._id))) {
      return res.status(403).json({ message: 'Không được phép xem hội thoại này' });
    }

    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn' });
  }
};

// Gửi tin nhắn: admin/staff auto-join; user chỉ gửi nếu hội thoại có staff
exports.sendMessage = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không hợp lệ' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID hội thoại không hợp lệ' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    if (user.role === 'admin') {
      if (!conv.participants.some(p => p.user.equals(user._id))) {
        conv.participants.push({ user: user._id, role: 'admin' });
      }
    } else if (user.role === 'staff') {
      if (!conv.participants.some(p => p.user.equals(user._id))) {
        conv.participants.push({ user: user._id, role: 'staff' });
      }
    } else {
      const isParticipant = conv.participants.some(p => p.user.equals(user._id));
      const hasStaff = conv.participants.some(p => p.role === 'staff');
      if (!isParticipant || !hasStaff) {
        return res.status(403).json({ message: 'Không được phép gửi tin nhắn vào hội thoại này' });
      }
    }

    const msg = await Message.create({
      conversation: conv._id,
      sender: user._id,
      content: content.trim(),
    });

    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    // Phát realtime cho phòng hội thoại
    try {
      if (global.io) {
        global.io.to(id).emit('message:new', {
          _id: msg._id.toString(),
          conversation: id,
          sender: user._id.toString(),
          content: msg.content,
          createdAt: msg.createdAt,
        });
      }
    } catch {}

    res.status(201).json(msg);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
  }
};

// Admin/Staff tham gia hội thoại: admin/staff join bất kỳ; user chỉ khi là participant
exports.joinConversation = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID hội thoại không hợp lệ' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    if (user.role === 'user') {
      const isParticipant = conv.participants.some(p => p.user.equals(user._id));
      if (!isParticipant) {
        return res.status(403).json({ message: 'Không được phép tham gia hội thoại này' });
      }
    } else {
      if (!conv.participants.some(p => p.user.equals(user._id))) {
        conv.participants.push({ user: user._id, role: user.role });
        await conv.save();
      }
    }

    const populated = await Conversation.findById(id)
      .populate('participants.user', 'name email role avatar');
    res.status(200).json(populated);
  } catch (error) {
    console.error('joinConversation error:', error);
    res.status(500).json({ message: 'Lỗi server khi tham gia hội thoại' });
  }
};

// Admin gán nhân viên phụ trách
exports.assignStaff = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { staffId } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin được gán nhân viên' });
    }
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const staff = await User.findById(staffId).select('role isDeleted');
    if (!staff || staff.isDeleted || staff.role !== 'staff') {
      return res.status(400).json({ message: 'Nhân viên không hợp lệ' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    conv.assignedStaff = staffId;
    if (!conv.participants.some(p => p.user.equals(staffId))) {
      conv.participants.push({ user: staffId, role: 'staff' });
    }
    await conv.save();

    const populated = await Conversation.findById(id)
      .populate('participants.user', 'name email role avatar');

    res.status(200).json({ message: 'Gán nhân viên thành công', conversation: populated });
  } catch (error) {
    console.error('assignStaff error:', error);
    res.status(500).json({ message: 'Lỗi server khi gán nhân viên' });
  }
};

exports.sendImageMessage = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const caption = (req.body.caption || '').trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID hội thoại không hợp lệ' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn một ảnh để gửi' });
    }

    const conv = await Conversation.findById(id);
    if (!conv) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    // Quyền: giống sendMessage
    if (user.role === 'admin') {
      if (!conv.participants.some(p => p.user.equals(user._id))) {
        conv.participants.push({ user: user._id, role: 'admin' });
      }
    } else if (user.role === 'staff') {
      if (!conv.participants.some(p => p.user.equals(user._id))) {
        conv.participants.push({ user: user._id, role: 'staff' });
      }
    } else {
      const isParticipant = conv.participants.some(p => p.user.equals(user._id));
      const hasStaff = conv.participants.some(p => p.role === 'staff');
      if (!isParticipant || !hasStaff) {
        return res.status(403).json({ message: 'Không được phép gửi ảnh vào hội thoại này' });
      }
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/Uploads/${req.file.filename}`;

    const msg = await Message.create({
      conversation: conv._id,
      sender: user._id,
      type: 'image',
      content: caption,       // có thể rỗng
      imageUrl,
    });

    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    // Phát realtime cho phòng hội thoại (nếu có Socket.IO)
    try {
      if (global.io) {
        global.io.to(id).emit('message:new', {
          _id: msg._id.toString(),
          conversation: id,
          sender: user._id.toString(),
          type: 'image',
          content: msg.content,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
        });
      }
    } catch {}

    res.status(201).json(msg);
  } catch (error) {
    console.error('sendImageMessage error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi ảnh' });
  }
};