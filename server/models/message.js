const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  content: { type: String, trim: true },
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  isSystem: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  // Thêm trường cho ảnh
  imageUrl: { type: String, default: null }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);