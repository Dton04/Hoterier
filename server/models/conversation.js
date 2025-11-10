const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  role: { type: String, enum: ['user', 'staff', 'admin'], required: true },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  participants: { type: [participantSchema], validate: v => v.length >= 2 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
  lastMessageAt: { type: Date, default: null },
  status: { type: String, enum: ['open', 'closed', 'archived'], default: 'open' },
}, { timestamps: true });

conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);