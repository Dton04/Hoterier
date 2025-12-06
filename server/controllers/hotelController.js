// hotelController.js
const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Region = require('../models/region');
const Booking = require('../models/booking');
const Discount = require('../models/discount');
const Review = require('../models/review');

const fs = require('fs');
const path = require('path');


// GET /api/hotels - Lấy danh sách tất cả khách sạn
exports.getAllHotels = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const { region, city, district, includeUnapproved } = req.query;
    const filter = {};

    // Mặc định chỉ lấy đã duyệt, trừ khi có cờ includeUnapproved (dành cho Admin)
    if (includeUnapproved !== 'true') {
      filter.isApproved = true;
    }

    // Support both region id (ObjectId) or region name
    if (region) {
      if (mongoose.Types.ObjectId.isValid(region)) {
        filter.region = new mongoose.Types.ObjectId(region);
      } else {
        // Tìm theo tên khu vực
        const foundRegion = await Region.findOne({ name: { $regex: region, $options: "i" } }).select("_id");
        if (foundRegion) {
          filter.region = foundRegion._id;
        }
      }
    }

    if (district || city) {
      const keyword = district || city;

      const normalizeVietnamese = (str) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

      const normalizedKeyword = normalizeVietnamese(keyword);

      filter.$or = [
        { district: { $regex: keyword, $options: "i" } }, // có dấu
        { normalizedDistrict: { $regex: normalizedKeyword, $options: "i" } }, // không dấu
      ];
    }





    // Truy vấn và populate đầy đủ
    const hotels = await Hotel.find(filter)
      .populate('region', 'name')
      .populate('rooms', '_id name maxcount beds baths rentperday quantity type description imageurls availabilityStatus amenities')
      .lean();

    // Return an empty array (200) when no hotels found so frontend can safely handle the result
    if (!hotels || hotels.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn', error: error.message });
  }
};


//  GET /api/hotels/:id - Lấy chi tiết khách sạn (hỗ trợ festival)
exports.getHotelById = async (req, res) => {
  const { id } = req.params;
  const includeEmpty = req.query.includeEmpty === "true";
  const { festivalId } = req.query;

  try {
    // Kiểm tra kết nối DB
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID khách sạn không hợp lệ" });
    }

    // Lấy dữ liệu khách sạn + phòng
    const hotel = await Hotel.findById(id)
      .populate("region", "name")
      .populate({
        path: "rooms",
        select:
          "_id name maxcount beds baths rentperday type description imageurls availabilityStatus currentbookings quantity dailyInventory",
      })
      .lean(); // ✅ trả object thường, dễ map

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Nếu có festival → áp dụng giảm giá cho tất cả phòng
    if (festivalId && mongoose.Types.ObjectId.isValid(festivalId)) {
      const discount = await Discount.findById(festivalId);

      //  CHỈ ÁP DỤNG khi khách sạn thuộc applicableHotels
      const isApplicable =
        discount &&
        discount.type === "festival" &&
        Array.isArray(discount.applicableHotels) &&
        discount.applicableHotels.map((h) => h.toString()).includes(hotel._id.toString());

      if (isApplicable) {
        hotel.rooms = hotel.rooms.map((r) => {
          const discounted =
            discount.discountType === "percentage"
              ? Math.round(r.rentperday * (1 - discount.discountValue / 100))
              : Math.max(r.rentperday - discount.discountValue, 0);

          return {
            ...r,
            discountedPrice: discounted,
            festivalDiscount: r.rentperday - discounted,
          };
        });

        hotel.festival = {
          _id: discount._id,
          name: discount.name,
          discountType: discount.discountType,
          discountValue: discount.discountValue,
        };
      }
    }


    // ✅ Tính toán thống kê đánh giá từ database
    const reviews = await Review.find({
      hotelId: hotel._id,
      isDeleted: false,
      isVisible: true
    });

    let reviewScore = null;
    let reviewCount = 0;
    let reviewText = null;

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      reviewScore = (totalRating / reviews.length).toFixed(1);
      reviewCount = reviews.length;

      // Xác định text đánh giá dựa trên điểm
      const score = parseFloat(reviewScore);
      if (score >= 9) reviewText = "Tuyệt vời";
      else if (score >= 8) reviewText = "Rất tốt";
      else if (score >= 7) reviewText = "Tốt";
      else if (score >= 6) reviewText = "Khá tốt";
      else reviewText = "Trung bình";
    }

    //Trả về dữ liệu hoàn chỉnh
    res.status(200).json({
      _id: hotel._id,
      name: hotel.name,
      address: hotel.address,
      region: hotel.region,
      district: hotel.district,
      contactNumber: hotel.contactNumber,
      email: hotel.email,
      description: hotel.description,
      imageurls: hotel.imageurls,
      rooms: hotel.rooms,
      amenities: hotel.amenities,
      festival: hotel.festival || null,
      reviewScore,
      reviewCount,
      reviewText,
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết khách sạn:", error.message);
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết khách sạn",
      error: error.message,
    });
  }
};


// hotelController.js
const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/hotels/:id/images - Tải ảnh khách sạn lên CLOUDINARY
exports.uploadHotelImages = async (req, res) => {
  const { id } = req.params;

  try {
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

    const uploadPromises = req.files.map(file => {
      return cloudinary.uploader.upload(file.path, {
        folder: 'hotels', // Thư mục trên Cloudinary
        upload_preset: 'hotel_images',
        public_id: `${hotel._id}_${Date.now()}`, // Tên file unique
      });
    });

    const results = await Promise.all(uploadPromises);
    const newImageUrls = results.map(result => result.secure_url); // HTTPS URL

    // Xóa file tạm trên server
    req.files.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) console.error("Lỗi xóa file tạm:", err);
      });
    });

    hotel.imageurls = [...(hotel.imageurls || []), ...newImageUrls];
    const updatedHotel = await hotel.save();

    res.status(201).json({ message: 'Tải ảnh khách sạn thành công', hotel: updatedHotel });
  } catch (error) {
    console.error('Lỗi khi tải ảnh khách sạn:', error.message);
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
  const { name, address, region, district, contactNumber, email, description, rooms, starRating } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    if (!name || !address || !region || !contactNumber) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ các trường bắt buộc: name, address, region, contactNumber',
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
      district: district || null,
      starRating: starRating || 3,
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
  const { name, address, region, district, contactNumber, email, description, rooms, starRating } = req.body;

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

    hotel.name = name ?? hotel.name;
    hotel.address = address ?? hotel.address;
    hotel.region = region ?? hotel.region;
    hotel.contactNumber = contactNumber ?? hotel.contactNumber;
    if (req.allowUpdateEmail) {
      hotel.email = email ?? hotel.email;
    }
    hotel.description = description || hotel.description;
    hotel.rooms = rooms || hotel.rooms;
    hotel.district = district || hotel.district;
    hotel.starRating = starRating ?? hotel.starRating;


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

exports.getHotelsByRegion = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Kết nối cơ sở dữ liệu chưa sẵn sàng' });
    }

    const { regionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(regionId)) {
      return res.status(400).json({ message: 'ID khu vực không hợp lệ' });
    }

    const hotels = await Hotel.find({ region: regionId, isApproved: true })
      .populate('region', 'name')
      .lean();

    if (!hotels || hotels.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(hotels);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách sạn theo khu vực:', error.message);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khách sạn theo khu vực', error: error.message });
  }
};


