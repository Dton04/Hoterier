const Amenity = require('../models/amenity');
const Room = require('../models/room');

exports.getAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find({ isActive: true }).sort({ name: 1 });
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách tiện ích', error: error.message });
  }
};

exports.createAmenity = async (req, res) => {
  try {
    let { name, description, icon, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên tiện ích là bắt buộc' });
    }
    name = name.trim();

    const exists = await Amenity.findOne({ name });
    if (exists) {
      return res.status(409).json({ message: 'Tiện ích đã tồn tại' });
    }

    const amenity = await Amenity.create({
      name,
      description: description || '',
      icon: icon || '',
      isActive: typeof isActive === 'boolean' ? isActive : true
    });

    res.status(201).json({ message: 'Tạo tiện ích thành công', amenity });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo tiện ích', error: error.message });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const amenity = await Amenity.findById(id);
    if (!amenity) {
      return res.status(404).json({ message: 'Không tìm thấy tiện ích' });
    }

    await Room.updateMany(
      { amenities: amenity.name },
      { $pull: { amenities: amenity.name } }
    );

    await Amenity.findByIdAndDelete(id);

    res.json({ message: 'Xóa tiện ích thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa tiện ích', error: error.message });
  }
};