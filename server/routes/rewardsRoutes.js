const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const Discount = require('../models/discount');
const UserVoucher = require('../models/userVouchers');
const { protect, admin } = require('../middleware/auth');

// Schema cho Reward
const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  membershipLevel: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    required: true,
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0,
  },
  voucherCode: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reward = mongoose.model('Reward', rewardSchema);

// Route admin: Tạo ưu đãi
router.post('/', protect, admin, async (req, res) => {
  const { name, description, membershipLevel, pointsRequired, voucherCode } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(membershipLevel)) {
      return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
    }

    const discountExists = await Discount.findOne({ code: voucherCode, type: 'voucher' });
    if (!discountExists) {
      return res.status(404).json({ message: 'Không tìm thấy voucher với mã này trong danh sách khuyến mãi' });
    }

    const reward = new Reward({
      name,
      description,
      membershipLevel,
      pointsRequired,
      voucherCode,
    });

    await reward.save();
    res.status(201).json({ message: 'Tạo ưu đãi thành công', reward });
  } catch (error) {
    console.error('Lỗi khi tạo ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo ưu đãi', error: error.message });
  }
});

// Route admin: Sửa ưu đãi
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const { name, description, membershipLevel, pointsRequired, voucherCode } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID ưu đãi không hợp lệ' });
    }

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({ message: 'Không tìm thấy ưu đãi' });
    }

    if (membershipLevel && !['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].includes(membershipLevel)) {
      return res.status(400).json({ message: 'Cấp độ thành viên không hợp lệ' });
    }

    if (voucherCode) {
      const discountExists = await Discount.findOne({ code: voucherCode, type: 'voucher' });
      if (!discountExists) {
        return res.status(404).json({ message: 'Không tìm thấy voucher với mã này trong danh sách khuyến mãi' });
      }
    }

    reward.name = name || reward.name;
    reward.description = description || reward.description;
    reward.membershipLevel = membershipLevel || reward.membershipLevel;
    reward.pointsRequired = pointsRequired !== undefined ? pointsRequired : reward.pointsRequired;
    reward.voucherCode = voucherCode || reward.voucherCode;

    const updatedReward = await reward.save();
    res.status(200).json({ message: 'Cập nhật ưu đãi thành công', reward: updatedReward });
  } catch (error) {
    console.error('Lỗi khi cập nhật ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật ưu đãi', error: error.message });
  }
});

// Route admin: Xóa ưu đãi
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID ưu đãi không hợp lệ' });
    }

    const reward = await Reward.findById(id);
    if (!reward) {
      return res.status(404).json({ message: 'Không tìm thấy ưu đãi' });
    }

    await Reward.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa ưu đãi thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa ưu đãi', error: error.message });
  }
});

// Route admin: Lấy tất cả ưu đãi
router.get('/admin', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const rewards = await Reward.find({});
    res.status(200).json({ rewards });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách ưu đãi', error: error.message });
  }
});

// Route người dùng: Lấy danh sách ưu đãi khả dụng
router.get('/', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const user = await User.findById(req.user.id).select('points');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    let membershipLevel;
    if (user.points >= 400000) membershipLevel = 'Diamond';
    else if (user.points >= 300000) membershipLevel = 'Platinum';
    else if (user.points >= 200000) membershipLevel = 'Gold';
    else if (user.points >= 100000) membershipLevel = 'Silver';
    else membershipLevel = 'Bronze';

    const rewards = await Reward.find({
      membershipLevel: membershipLevel,
      pointsRequired: { $lte: user.points },
    });

    res.status(200).json({
      rewards,
      userPoints: user.points,
      membershipLevel: membershipLevel,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ưu đãi:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách ưu đãi', error: error.message });
  }
});

// Route người dùng: Đổi ưu đãi
router.post('/redeem', protect, async (req, res) => {
  const { rewardId } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(rewardId)) {
      throw new Error('ID ưu đãi không hợp lệ');
    }

    const reward = await Reward.findById(rewardId).session(session);
    if (!reward) {
      throw new Error('Không tìm thấy ưu đãi');
    }
    console.log('Reward data:', reward); // Thêm log để kiểm tra

    const user = await User.findById(req.user.id).select('points vouchers').session(session);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    let userMembershipLevel;
    if (user.points >= 400000) userMembershipLevel = 'Diamond';
    else if (user.points >= 300000) userMembershipLevel = 'Platinum';
    else if (user.points >= 200000) userMembershipLevel = 'Gold';
    else if (user.points >= 100000) userMembershipLevel = 'Silver';
    else userMembershipLevel = 'Bronze';

    if (userMembershipLevel !== reward.membershipLevel) {
      throw new Error('Cấp độ thành viên không đủ để đổi ưu đãi này');
    }

    if (user.points < reward.pointsRequired) {
      throw new Error('Không đủ điểm để đổi ưu đãi này');
    }

    const existingVoucher = await UserVoucher.findOne({
      userId: req.user.id,
      voucherCode: reward.voucherCode,
    }).session(session);
    if (existingVoucher) {
      throw new Error('Bạn đã đổi ưu đãi này rồi');
    }

    const discount = await Discount.findOne({ code: reward.voucherCode, type: 'voucher' }).session(session);
    if (!discount) {
      throw new Error('Không tìm thấy voucher tương ứng');
    }

    user.points -= reward.pointsRequired;
    await user.save({ session });

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'reward_redemption',
      description: `Đổi ưu đãi: ${reward.name} - ${reward.description || 'Không có mô tả'}`,
      points: -reward.pointsRequired,
      createdAt: new Date(),
    });
    await transaction.save({ session });

    const userVoucher = new UserVoucher({
      userId: req.user.id,
      rewardId: reward._id,
      voucherCode: reward.voucherCode,
      isUsed: false,
      expiryDate: discount.endDate,
    });
    await userVoucher.save({ session });

    user.vouchers.push(userVoucher._id);
    await user.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      message: 'Đổi ưu đãi thành công',
      voucherCode: reward.voucherCode,
      expiryDate: discount.endDate,
      remainingPoints: user.points,
      description: reward.description || 'Không có mô tả'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Lỗi khi đổi ưu đãi:', error.message, error.stack);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Route người dùng: Lấy lịch sử đổi thưởng
router.get('/history', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const transactions = await Transaction.find({
      userId: req.user.id,
      type: 'reward_redemption',
    })
      .sort({ createdAt: -1 })
      .select('createdAt description points');

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử đổi thưởng:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử đổi thưởng', error: error.message });
  }
});

// Route người dùng: Lấy danh sách voucher đã đổi
router.get('/vouchers', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const vouchers = await UserVoucher.find({ userId: req.user.id, isUsed: false })
      .populate('rewardId', 'name description pointsRequired')
      .sort({ createdAt: -1 });

    res.status(200).json(vouchers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách voucher:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách voucher', error: error.message });
  }
});

module.exports = router;
