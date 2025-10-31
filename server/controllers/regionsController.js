const mongoose = require('mongoose');
const Region = require('../models/region');
const User = require('../models/user');

// ✅ Tạo region mới (hỗ trợ upload ảnh)
exports.createRegion = async (req, res) => {
  try {
    const { name, cities } = req.body;
    if (!name) return res.status(400).json({ message: "Thiếu tên khu vực" });

    const regionExists = await Region.findOne({ name });
    if (regionExists)
      return res.status(400).json({ message: "Khu vực đã tồn tại" });

    // 👇 Xử lý ảnh nếu có
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/Uploads/${req.file.filename}`;
    }

    const region = new Region({
      name,
      cities: cities ? JSON.parse(cities) : [],
      imageUrl,
    });

    const saved = await region.save();
    res.status(201).json({ message: "Tạo khu vực thành công", region: saved });
  } catch (err) {
    console.error("Lỗi tạo khu vực:", err);
    res.status(500).json({ message: "Lỗi tạo khu vực", error: err.message });
  }
};

// ✅ Thêm thành phố
exports.addCityToRegion = async (req, res) => {
  const { regionId } = req.params;
  const { name } = req.body;
  try {
    const region = await Region.findById(regionId);
    if (!region) return res.status(404).json({ message: "Không tìm thấy khu vực" });

    if (region.cities.some((c) => c.name === name))
      return res.status(400).json({ message: "Thành phố đã tồn tại" });

    region.cities.push({ name });
    await region.save();
    res.status(200).json({ message: "Đã thêm thành phố mới", region });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi thêm thành phố", error: err.message });
  }
};

// ✅ Lấy danh sách regions
exports.getRegions = async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json(regions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khu vực:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khu vực', error: error.message });
  }
};

// ✅ Upload ảnh cho region
exports.uploadRegionImage = async (req, res) => {
  const { id } = req.params;
  try {
    const region = await Region.findById(id);
    if (!region) return res.status(404).json({ message: "Không tìm thấy khu vực" });
    if (!req.file) return res.status(400).json({ message: "Vui lòng tải lên 1 ảnh" });

    region.imageUrl = `${req.protocol}://${req.get("host")}/Uploads/${req.file.filename}`;
    await region.save();

    res.status(201).json({ message: "Upload ảnh khu vực thành công", region });
  } catch (error) {
    console.error("Lỗi upload ảnh region:", error);
    res.status(500).json({ message: "Lỗi khi upload ảnh region", error: error.message });
  }
};

// ✅ Xóa ảnh khu vực
exports.deleteRegionImage = async (req, res) => {
  const { id } = req.params;
  try {
    const region = await Region.findById(id);
    if (!region) return res.status(404).json({ message: "Không tìm thấy khu vực" });

    region.imageUrl = null;
    await region.save();
    res.status(200).json({ message: "Xóa ảnh khu vực thành công", region });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa ảnh region", error: error.message });
  }
};

// ✅ Xóa region
exports.deleteRegion = async (req, res) => {
  const { id } = req.params;
  try {
    const region = await Region.findById(id);
    if (!region) return res.status(404).json({ message: "Không tìm thấy khu vực" });

    await Region.deleteOne({ _id: id });
    res.status(200).json({ message: "Xóa khu vực thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa khu vực", error: error.message });
  }
};
