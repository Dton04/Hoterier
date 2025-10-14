// regionsController.js
const mongoose = require('mongoose');
const Region = require('../models/region');
const User = require('../models/user');

// POST /api/regions - Tạo region mới
exports.createRegion = async (req, res) => {
  try {
    const name = req.body?.name;
    const hotels = req.body?.hotels ? JSON.parse(req.body.hotels) : [];

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên khu vực" });
    }

    // Nếu đã tồn tại
    const regionExists = await Region.findOne({ name });
    if (regionExists) {
      return res.status(400).json({ message: "Khu vực đã tồn tại" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/Uploads/${req.file.filename}`;
    }

    const region = new Region({
      name,
      hotels,
      imageUrl,
    });

    const savedRegion = await region.save();
    res.status(201).json({
      message: "Tạo khu vực thành công",
      region: savedRegion,
    });
  } catch (error) {
    console.error("Lỗi khi tạo khu vực:", error.message);
    res.status(500).json({
      message: "Lỗi khi tạo khu vực",
      error: error.message,
    });
  }
};


// GET /api/regions - Lấy danh sách regions
exports.getRegions = async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json(regions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khu vực:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khu vực', error: error.message });
  }
};

// POST /api/regions/assign-admin - Phân quyền admin khu vực
exports.assignAdmin = async (req, res) => {
  const { userId, regionId } = req.body;

  try {
    if (!userId || !regionId || typeof userId !== 'string' || typeof regionId !== 'string') {
      return res.status(400).json({ message: 'userId hoặc regionId phải là chuỗi hợp lệ' });
    }

    if (mongoose.connection.readyState !== 1) {
      console.error('Database connection not ready, state:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID người dùng hoặc khu vực không hợp lệ' });
    }

    const user = await User.findById(userId).select('_id name email role region');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ message: 'Người dùng phải có vai trò admin' });
    }

    const region = await Region.findById(regionId).select('_id name adminId hotels');
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    if (req.user.region && req.user.region.toString() !== regionId) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý khu vực này' });
    }

    if (region.adminId && region.adminId.toString() !== userId) {
      const currentAdmin = await User.findById(region.adminId).select('name');
      if (currentAdmin) {
        return res.status(400).json({
          message: `Khu vực này đã được quản lý bởi admin ${currentAdmin.name}`,
        });
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      region.adminId = userId;
      user.region = regionId;
      await region.save({ session });
      await user.save({ session });
      await session.commitTransaction();

      res.status(200).json({
        message: 'Phân quyền admin khu vực thành công',
        region: {
          _id: region._id,
          name: region.name,
          adminId: region.adminId,
          hotels: region.hotels,
        },
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          region: user.region,
          role: user.role,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Lỗi phân quyền admin khu vực:', {
      userId,
      regionId,
      error: error.message,
      stack: error.stack,
    });
    res.status(error.status || 500).json({
      message: error.message || 'Lỗi server khi phân quyền admin khu vực',
    });
  }
};

// GET /api/admin/hotels-by-region - Admin xem các khách sạn trong khu quản lý
exports.getHotelsByRegion = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.region) {
      return res.status(400).json({ message: 'Người dùng không được gán khu vực quản lý' });
    }

    const region = await Region.findById(user.region).populate('hotels');
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    res.status(200).json({
      region: region.name,
      hotels: region.hotels,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn theo khu vực:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn', error: error.message });
  }
};

// POST /api/regions/:id/image - Upload ảnh cho region
exports.uploadRegionImage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khu vực không hợp lệ" });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({ message: "Không tìm thấy khu vực" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng tải lên 1 ảnh" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/Uploads/${req.file.filename}`;
    region.imageUrl = imageUrl;
    await region.save();

    res.status(201).json({ message: "Upload ảnh khu vực thành công", region });
  } catch (error) {
    console.error("Lỗi upload ảnh region:", error.message);
    res.status(500).json({ message: "Lỗi khi upload ảnh region", error: error.message });
  }
};

// DELETE /api/regions/:id/image - Xóa ảnh khu vực
exports.deleteRegionImage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khu vực không hợp lệ" });
    }

    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({ message: "Không tìm thấy khu vực" });
    }

    region.imageUrl = null;
    await region.save();

    res.status(200).json({ message: "Xóa ảnh khu vực thành công", region });
  } catch (error) {
    console.error("Lỗi xóa ảnh region:", error.message);
    res.status(500).json({ message: "Lỗi khi xóa ảnh region", error: error.message });
  }
};
