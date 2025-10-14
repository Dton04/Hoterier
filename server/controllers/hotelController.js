// hotelController.js
const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Region = require('../models/region');
const Booking = require('../models/booking');
const Discount = require('../models/discount');

const fs = require('fs');
const path = require('path');

// GET /api/hotels - Lấy danh sách tất cả khách sạn
exports.getAllHotels = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const hotels = await Hotel.find()
      .populate('region', 'name')
      .populate('rooms', '_id name maxcount beds baths rentperday type description imageurls availabilityStatus currentbookings')
      .lean();

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn nào' });
    }

    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn', error: error.message });
  }
};

// GET /api/hotels/:id - Lấy chi tiết khách sạn
exports.getHotelById = async (req, res) => {
  const { id } = req.params;
  const includeEmpty = req.query.includeEmpty === "true";

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id)
      .populate("region", "name")
      .populate({
        path: "rooms",
        select: "_id name maxcount beds baths rentperday type description imageurls availabilityStatus currentbookings quantity",
      });

    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    res.status(200).json({
      _id: hotel._id,
      name: hotel.name,
      address: hotel.address,
      region: hotel.region,
      contactNumber: hotel.contactNumber,
      email: hotel.email,
      description: hotel.description,
      imageurls: hotel.imageurls,
      rooms: hotel.rooms,
      amenities: hotel.amenities,
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết khách sạn', error: error.message });
  }
};

// POST /api/hotels/:id/images - Tải ảnh khách sạn
exports.uploadHotelImages = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một ảnh' });
    }

    const newImages = req.files.map(file => `${req.protocol}://${req.get('host')}/Uploads/${file.filename}`);
    hotel.imageurls = [...(hotel.imageurls || []), ...newImages];
    const updatedHotel = await hotel.save();

    res.status(201).json({ message: 'Tải ảnh khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi tải ảnh khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tải ảnh khách sạn', error: error.message });
  }
};

// DELETE /api/hotels/:id/images/:imgId - Xóa ảnh khách sạn
exports.deleteHotelImage = async (req, res) => {
  const { id, imgId } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const imageIndex = hotel.imageurls.findIndex(url => url.includes(imgId));
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy ảnh' });
    }

    const imageUrl = hotel.imageurls[imageIndex];
    const filePath = path.join(__dirname, '../', imageUrl.replace(`${req.protocol}://${req.get('host')}`, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    hotel.imageurls.splice(imageIndex, 1);
    const updatedHotel = await hotel.save();

    res.status(200).json({ message: 'Xóa ảnh khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi xóa ảnh khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa ảnh khách sạn', error: error.message });
  }
};

// POST /api/hotels - Tạo khách sạn mới
exports.createHotel = async (req, res) => {
  const { name, address, region, contactNumber, email, description, rooms } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!name || !address || !region || !contactNumber || !email) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: name, address, region, contactNumber, email',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    if (rooms && rooms.length > 0) {
      const validRooms = await Room.find({ _id: { $in: rooms } });
      if (validRooms.length !== rooms.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const hotelExists = await Hotel.findOne({ name });
    if (hotelExists) {
      return res.status(400).json({ message: 'Tên khách sạn đã tồn tại' });
    }

    const hotel = new Hotel({
      name,
      address,
      region,
      contactNumber,
      email,
      description,
      rooms: rooms || [],
    });

    const savedHotel = await hotel.save();
    res.status(201).json({ message: 'Tạo khách sạn thành công', hotel: savedHotel });
  } catch (error) {
    console.error('Lỗi khi tạo khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi tạo khách sạn', error: error.message });
  }
};

// PUT /api/hotels/:id - Cập nhật thông tin khách sạn
exports.updateHotel = async (req, res) => {
  const { id } = req.params;
  const { name, address, region, contactNumber, email, description, rooms } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    if (!name || !address || !region || !contactNumber || !email) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: name, address, region, contactNumber, email',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const regionExists = await Region.findById(region);
    if (!regionExists) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    if (rooms && rooms.length > 0) {
      const validRooms = await Room.find({ _id: { $in: rooms } });
      if (validRooms.length !== rooms.length) {
        return res.status(400).json({ message: 'Một hoặc nhiều phòng không tồn tại' });
      }
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    hotel.name = name;
    hotel.address = address;
    hotel.region = region;
    hotel.contactNumber = contactNumber;
    hotel.email = email;
    hotel.description = description || hotel.description;
    hotel.rooms = rooms || hotel.rooms;

    const updatedHotel = await hotel.save();
    res.status(200).json({ message: 'Cập nhật khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi cập nhật khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi cập nhật khách sạn', error: error.message });
  }
};

// DELETE /api/hotels/:id - Xóa khách sạn
exports.deleteHotel = async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const activeBookings = await Booking.find({
      roomid: { $in: hotel.rooms },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ message: 'Không thể xóa khách sạn vì vẫn còn đặt phòng đang hoạt động' });
    }

    await Hotel.deleteOne({ _id: id });
    res.status(200).json({ message: 'Xóa khách sạn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa khách sạn:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi xóa khách sạn', error: error.message });
  }
};

// POST /api/hotels/region - Phân vùng khu vực quản lý
exports.assignRegion = async (req, res) => {
  const { hotelId, regionId } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId) || !mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID khách sạn hoặc khu vực không hợp lệ' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }

    hotel.region = regionId;
    await hotel.save();

    res.status(200).json({ message: 'Gán khu vực quản lý cho khách sạn thành công', hotel });
  } catch (error) {
    console.error('Lỗi khi gán khu vực quản lý:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi khi gán khu vực quản lý', error: error.message });
  }
};


// GET /api/hotels/:id/rooms - Lấy khách sạn và danh sách phòng
exports.getHotelWithRooms = async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ' });
    }

    const hotel = await Hotel.findById(id)
      .populate('region', 'name')
      .populate("rooms")
      .lean();

    if (!hotel) {
      return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
    }

    res.status(200).json({
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        address: hotel.address,
        region: hotel.region,
        contactNumber: hotel.contactNumber,
        email: hotel.email,
        description: hotel.description,
        imageurls: hotel.imageurls,
      },
      rooms: hotel.rooms,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách sạn và phòng:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin khách sạn và phòng', error: error.message });
  }
};

// Lấy khách sạn có áp dụng festival discount
// GET /api/hotels/festival/:id - Lấy danh sách khách sạn có áp dụng festival
exports.getHotelsByFestival = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id)
      .populate({
        path: 'applicableHotels',
        populate: { path: 'rooms', select: 'rentperday imageurls' },
      });

    if (!discount || discount.type !== 'festival') {
      return res.status(404).json({ message: 'Không tìm thấy ưu đãi lễ hội' });
    }

    const hotels = discount.applicableHotels.map((hotel) => {
      const h = hotel.toObject();
      h.rooms = h.rooms?.map((r) => ({
        ...r,
        discountedPrice:
          discount.discountType === 'percentage'
            ? r.rentperday * (1 - discount.discountValue / 100)
            : Math.max(r.rentperday - discount.discountValue, 0),
      }));
      return h;
    });

    // ✅ Trả về cả festival và hotels (đúng với FE)
    res.status(200).json({
      festival: {
        _id: discount._id,
        name: discount.name,
        description: discount.description,
        image: discount.image,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
      },
      hotels,
    });
  } catch (error) {
    console.error('Lỗi khi lấy khách sạn theo festival:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy khách sạn theo festival',
      error: error.message,
    });
  }
};
//Lay phong trong theo ngay
exports.getAvailableRoomsByHotelId = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkin, checkout, adults, children } = req.query;

    const hotel = await Hotel.findById(id).populate('rooms');
    if (!hotel) return res.status(404).json({ message: "Không tìm thấy khách sạn" });

    // Giả lập filter phòng trống
    const availableRooms = hotel.rooms.filter(room => room.quantity > 0);

    res.status(200).json({
      ...hotel.toObject(),
      rooms: availableRooms
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


