// roomController.js
const mongoose = require('mongoose');
const Room = require("../models/room");
const Booking = require("../models/booking");
const Hotel = require("../models/hotel");
const fs = require('fs');
const path = require('path');
const Amenity = require("../models/amenity");

// GET /api/rooms/getallrooms - Lấy tất cả phòng
exports.getAllRooms = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    // sau khi lấy rooms, cập nhật trạng thái tự động
    const rooms = await Room.find({});

    const updatedRooms = rooms.map(room => {
      const r = room.toObject();
      r.availabilityStatus = room.quantity > 0 ? "available" : "unavailable";
      return r;
    });

    res.send(updatedRooms);

  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng", error: error.message });
  }
};

// POST /api/rooms/getroombyid - Lấy phòng theo ID (kèm thông tin khách sạn)

exports.getRoomById = async (req, res) => {
  const { roomid } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(roomid)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(roomid)
      .populate("hotelId", "name address imageurls region")
      .lean();

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    room.availabilityStatus = room.quantity > 0 ? "available" : "unavailable";
    // Đưa hotelId thành field "hotel" để FE dễ dùng
    if (room.hotelId) {
      room.hotel = {
        _id: room.hotelId._id,
        name: room.hotelId.name,
        address: room.hotelId.address,
        imageurls: room.hotelId.imageurls,
        region: room.hotelId.region,
      };
      delete room.hotelId;
    }

    res.status(200).json(room);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng" });
  }
};


// POST /api/rooms - Tạo phòng mới (chỉ admin)
// roomController.js
exports.createRoom = async (req, res) => {
  try {
    const { hotelId, name, type, description, maxcount, beds, baths, rentperday, phonenumber, quantity, amenities } = req.body;

    if (!hotelId) {
      return res.status(400).json({ message: "hotelId là bắt buộc" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Validate tiện ích theo DB (nếu có truyền)
    let amenityNames = Array.isArray(amenities) ? amenities.filter(a => typeof a === 'string') : [];
    if (amenityNames.length) {
      const found = await Amenity.find({ name: { $in: amenityNames }, isActive: true }).select('name');
      const foundNames = found.map(a => a.name);
      const invalid = amenityNames.filter(a => !foundNames.includes(a));
      if (invalid.length) {
        return res.status(400).json({ message: "Một số tiện ích không hợp lệ hoặc không hoạt động", invalid });
      }
    }

    const room = new Room({
      hotelId,
      name,
      type,
      description,
      maxcount,
      beds,
      baths,
      rentperday,
      phonenumber,
      quantity: quantity || 1,
      amenities: amenityNames,
    });

    const savedRoom = await room.save();

    // ✅ Gắn phòng vào khách sạn
    hotel.rooms.push(savedRoom._id);
    await hotel.save();

    res.status(201).json({ message: "Tạo phòng thành công", room: savedRoom });
  } catch (err) {
    console.error("Lỗi khi tạo phòng:", err.message);
    res.status(500).json({ message: "Lỗi khi tạo phòng", error: err.message });
  }
};



// BE4.20 PATCH /api/rooms/:id Cập nhật phòng
exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const allowedFields = [
      "name",
      "type",
      "description",
      "maxcount",
      "beds",
      "baths",
      "rentperday",
      "phonenumber",
      "quantity",
      "availabilityStatus",
      "amenities"
    ];

    // lọc chỉ cho phép update các field hợp lệ
    const updateData = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để cập nhật" });
    }

    // Nếu cập nhật amenities: validate theo DB
    if (updates.amenities !== undefined) {
      const amenityNames = Array.isArray(updates.amenities) ? updates.amenities.filter(a => typeof a === 'string') : [];
      const found = await Amenity.find({ name: { $in: amenityNames }, isActive: true }).select('name');
      const foundNames = found.map(a => a.name);
      const invalid = amenityNames.filter(a => !foundNames.includes(a));
      if (invalid.length) {
        return res.status(400).json({ message: "Một số tiện ích không hợp lệ hoặc không hoạt động", invalid });
      }
      updates.amenities = amenityNames;
    }

    const updatedRoom = await Room.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    res.status(200).json({ message: "Cập nhật phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi cập nhật phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi cập nhật phòng", error: error.message });
  }
};

// BE4.21 POST /api/rooms/:id/images - Tải ảnh phòng
exports.uploadRoomImages = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp ít nhất một ảnh" });
    }

    const newImages = req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`);
    room.imageurls = [...room.imageurls, ...newImages];
    const updatedRoom = await room.save();

    res.status(201).json({ message: "Tải ảnh phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi tải ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tải ảnh phòng", error: error.message });
  }
};

// BE4.22 DELETE /api/rooms/:id/images/:imgId - Xóa ảnh phòng
exports.deleteRoomImage = async (req, res) => {
  const { id, imgId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const imageIndex = room.imageurls.findIndex(url => url.includes(imgId));
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ảnh" });
    }

    const imageUrl = room.imageurls[imageIndex];
    const filePath = path.join(__dirname, '../', imageUrl.replace(`${req.protocol}://${req.get('host')}`, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    room.imageurls.splice(imageIndex, 1);
    const updatedRoom = await room.save();

    res.status(200).json({ message: "Xóa ảnh phòng thành công", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi xóa ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xóa ảnh phòng", error: error.message });
  }
};

// BE4.23 GET /api/rooms/images/:id - Lấy danh sách ảnh của phòng
exports.getRoomImages = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findById(id).select('imageurls');
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    res.status(200).json({ images: room.imageurls });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ảnh phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh phòng", error: error.message });
  }
};

// DELETE /api/rooms/:id?hotelId=xxx
exports.deleteRoom = async (req, res) => {
  const { id } = req.params;
  const { hotelId } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    // Nếu có hotelId thì gỡ phòng ra khỏi khách sạn
    if (hotelId && mongoose.Types.ObjectId.isValid(hotelId)) {
      await Hotel.findByIdAndUpdate(hotelId, { $pull: { rooms: id } });
    }

    res.status(200).json({ message: "Xóa phòng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa phòng:", error.message);
    res.status(500).json({ message: "Lỗi khi xóa phòng", error: error.message });
  }
};

// roomController.js
exports.addAmenityToRoom = async (req, res) => {
  const { id } = req.params;
  let { amenity, amenities } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!amenities && amenity) amenities = [amenity];
    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp ít nhất một tiện ích" });
    }

    // Validate theo DB
    const found = await Amenity.find({ name: { $in: amenities }, isActive: true }).select('name');
    const foundNames = found.map(a => a.name);
    const invalid = amenities.filter(a => !foundNames.includes(a));
    if (invalid.length) {
      return res.status(400).json({ message: "Tiện ích không hợp lệ hoặc không hoạt động", invalid });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $addToSet: { amenities: { $each: foundNames } } },
      { new: true }
    );
    if (!updatedRoom) return res.status(404).json({ message: "Không tìm thấy phòng" });

    res.status(200).json({ message: "Đã thêm tiện ích cho phòng", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi thêm tiện ích:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi thêm tiện ích", error: error.message });
  }
};

// roomController.js
exports.removeAmenityFromRoom = async (req, res) => {
  const { id } = req.params;
  let { amenity, amenities } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (!amenities && amenity) amenities = [amenity];
    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({ message: "Vui lòng cung cấp ít nhất một tiện ích để xóa" });
    }

    // Chỉ cho phép xóa các tiện ích tồn tại trong DB (nếu cần chặt chẽ)
    const found = await Amenity.find({ name: { $in: amenities } }).select('name');
    const foundNames = found.map(a => a.name);

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $pull: { amenities: { $in: foundNames.length ? foundNames : amenities } } },
      { new: true }
    );
    if (!updatedRoom) return res.status(404).json({ message: "Không tìm thấy phòng" });

    res.status(200).json({ message: "Đã xóa tiện ích khỏi phòng", room: updatedRoom });
  } catch (error) {
    console.error("Lỗi khi xóa tiện ích:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi xóa tiện ích", error: error.message });
  }
};
