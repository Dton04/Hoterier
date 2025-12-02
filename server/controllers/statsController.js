const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/room");
const Review = require("../models/review");
const Hotel = require("../models/hotel");
const Region = require("../models/region");

// @desc    Get revenue report by time period
// @route   GET /api/stats/revenue
// @access  Private/Admin/Staff
exports.getRevenueStats = async (req, res) => {
  const { startDate, endDate, groupBy = "month" } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }

    if (!["day", "month", "year"].includes(groupBy)) {
      return res.status(400).json({ message: "groupBy phải là 'day', 'month' hoặc 'year'" });
    }

    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $gte: start, $lte: end },
    }).populate("roomid");

    const revenue = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.roomid.rentperday) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const amount = booking.roomid.rentperday * days - (booking.voucherDiscount || 0);

      let key;
      if (groupBy === "day") {
        key = checkinDate.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        key = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = checkinDate.getFullYear().toString();
      }

      acc[key] = (acc[key] || 0) + amount;
      return acc;
    }, {});

    res.status(200).json({ revenue });
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo doanh thu:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy báo cáo doanh thu", error: error.message });
  }
};

// @desc    Get booking rate statistics
// @route   GET /api/stats/booking-rate
// @access  Private/Admin/Staff
exports.getBookingRateStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }

    const totalRooms = await Room.countDocuments();
    if (totalRooms === 0) {
      return res.status(200).json({ bookingRate: 0, totalRooms: 0, bookedRoomDays: 0, totalPossibleRoomDays: 0 });
    }

    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $lte: end },
      checkout: { $gte: start },
    }).populate("roomid");

    const bookedRoomDays = bookings.reduce((acc, booking) => {
      const checkin = new Date(Math.max(booking.checkin, start));
      const checkout = new Date(Math.min(booking.checkout, end));
      const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      return acc + (days > 0 ? days : 0);
    }, 0);

    const totalPossibleRoomDays = totalRooms * Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const bookingRate = totalPossibleRoomDays > 0 ? (bookedRoomDays / totalPossibleRoomDays) * 100 : 0;

    res.status(200).json({
      bookingRate: parseFloat(bookingRate.toFixed(2)),
      totalRooms,
      bookedRoomDays,
      totalPossibleRoomDays,
    });
  } catch (error) {
    console.error("Lỗi khi tính tỷ lệ đặt phòng:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi tính tỷ lệ đặt phòng", error: error.message });
  }
};

// @desc    Get review statistics
// @route   GET /api/stats/review-stats
// @access  Private/Admin/Staff
exports.getReviewStats = async (req, res) => {
  const { startDate, endDate, roomId, hotelId } = req.query;
  const Room = require("../models/room");

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (roomId && !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "ID phòng không hợp lệ" });
    }

    if (hotelId && !mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "ID khách sạn không hợp lệ" });
    }

    const query = { isDeleted: false };
    if (roomId) query.roomId = roomId;
    // Lọc đánh giá theo khách sạn (thông qua các phòng thuộc khách sạn)
    if (hotelId) {
      const hotelRooms = await Room.find({ hotelId }, "_id");
      const roomIds = hotelRooms.map(room => room._id);
      query.roomId = { $in: roomIds };
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
      }
      query.createdAt = { $gte: start, $lte: end };
    }

    const reviews = await Review.find(query);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    res.status(200).json({
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingDistribution,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê đánh giá:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy thống kê đánh giá", error: error.message });
  }
};

// @desc    Get revenue grouped by location (district/city/region) and by time (day/month/year)
// @route   GET /api/stats/revenue/by-location
// @access  Private/Admin/Staff
exports.getRevenueByLocation = async (req, res) => {
  const {
    startDate,
    endDate,
    groupBy = "month",
    locationType = "district",
    regionId,
    regionName,
    district,
  } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }

    if (!["day", "month", "year"].includes(groupBy)) {
      return res.status(400).json({ message: "groupBy phải là 'day', 'month' hoặc 'year'" });
    }

    if (!["district", "city", "region"].includes(locationType)) {
      return res.status(400).json({ message: "locationType phải là 'district', 'city' hoặc 'region'" });
    }

    const bookingQuery = {
      status: "confirmed",
      checkin: { $gte: start, $lte: end },
    };

    // Tiền xử lý lọc theo địa điểm (nếu có)
    const hotelsFilter = {};
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      hotelsFilter.region = regionId;
    } else if (regionName) {
      const Region = require("../models/region");
      const foundRegion = await Region.findOne({ name: regionName }).select("_id");
      if (foundRegion) hotelsFilter.region = foundRegion._id;
    }

    if (district) {
      const normalizeVietnamese = (str) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");
      const normalized = normalizeVietnamese(district);
      hotelsFilter.$or = [
        { district: { $regex: district, $options: "i" } },
        { district: { $regex: normalized, $options: "i" } },
      ];
    }

    if (Object.keys(hotelsFilter).length > 0) {
      const hotels = await Hotel.find(hotelsFilter).select("_id");
      if (!hotels || hotels.length === 0) {
        return res.status(200).json({
          locationType: locationType === "city" ? "district" : locationType,
          groupBy,
          startDate,
          endDate,
          totalLocations: 0,
          revenueByLocation: {},
        });
      }
      bookingQuery.hotelId = { $in: hotels.map((h) => h._id) };
    }

    const bookings = await Booking.find(bookingQuery)
      .populate({ path: "roomid", select: "rentperday" })
      .populate({
        path: "hotelId",
        select: "district region",
        populate: { path: "region", select: "name" },
      });

    const revenueByLocation = bookings.reduce((acc, booking) => {
      if (!booking.roomid || !booking.hotelId) return acc;

      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const amount = Math.max(
        (booking.roomid.rentperday || 0) * (days > 0 ? days : 0) - (booking.voucherDiscount || 0),
        0
      );

      let locationKey;
      if (locationType === "region") {
        locationKey = booking.hotelId?.region?.name || "Khác";
      } else {
        // "city" dùng chung với "district" vì schema hiện tại chưa có city
        locationKey = booking.hotelId?.district || "Khác";
      }

      let timeKey;
      if (groupBy === "day") {
        timeKey = checkinDate.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        timeKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;
      } else {
        timeKey = checkinDate.getFullYear().toString();
      }

      if (!acc[locationKey]) acc[locationKey] = {};
      acc[locationKey][timeKey] = (acc[locationKey][timeKey] || 0) + amount;
      return acc;
    }, {});

    res.status(200).json({
      locationType: locationType === "city" ? "district" : locationType,
      groupBy,
      startDate,
      endDate,
      totalLocations: Object.keys(revenueByLocation).length,
      revenueByLocation,
    });
  } catch (error) {
    console.error("Lỗi khi thống kê doanh thu theo địa điểm:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi thống kê doanh thu theo địa điểm", error: error.message });
  }
};

exports.getRevenueByRegionCity = async (req, res) => {
  const { regionId, regionName, startDate, endDate, groupBy = "month", cityName, ownerEmail } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }
    if (!["day", "month", "year"].includes(groupBy)) {
      return res.status(400).json({ message: "groupBy phải là 'day', 'month' hoặc 'year'" });
    }
    if (!regionId && !regionName) {
      return res.status(400).json({ message: "Vui lòng cung cấp regionId hoặc regionName" });
    }

    const normalizeVietnamese = (str) =>
      (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

    // Lấy region
    const region =
      regionId && mongoose.Types.ObjectId.isValid(regionId)
        ? await Region.findById(regionId)
        : await Region.findOne({ name: regionName });
    if (!region) {
      return res.status(404).json({ message: "Không tìm thấy khu vực" });
    }

    // Lọc city theo cityName nếu có
    const targetCities = (region.cities || []).filter((c) => {
      if (!cityName) return true;
      return normalizeVietnamese(c.name) === normalizeVietnamese(cityName);
    });

    if (targetCities.length === 0) {
      return res.status(200).json({
        region: region.name,
        groupBy,
        startDate,
        endDate,
        totalCities: 0,
        revenueByCity: {},
      });
    }

    // Gom danh sách hotelId theo city:
    // - ưu tiên dùng cities[i].hotels
    // - nếu rỗng, fallback: tìm Hotel theo { region: region._id, district ~ cityName } (có và không dấu)
    const revenueByCity = {};
    const cityHotelMap = {}; // hotelId -> cityName

    // Nếu có ownerEmail, chuẩn hóa dạng thường
    const emailFilter = ownerEmail ? String(ownerEmail).toLowerCase() : null;

    for (const city of targetCities) {
      const cityNameRaw = city.name;
      let hotelIds = (city.hotels || []).map((h) => h.toString());

      if (hotelIds.length === 0) {
        const noAccent = normalizeVietnamese(cityNameRaw);
        const fallbackHotels = await Hotel.find({
          region: region._id,
          $or: [
            { district: { $regex: cityNameRaw, $options: "i" } },
            { district: { $regex: noAccent, $options: "i" } },
          ],
        }).select("_id");
        hotelIds = fallbackHotels.map((h) => h._id.toString());
      }

      // Nếu có ownerEmail, chỉ giữ các khách sạn thuộc email đó
      if (emailFilter && hotelIds.length) {
        const ownerHotels = await Hotel.find({ _id: { $in: hotelIds }, email: emailFilter }).select("_id");
        hotelIds = ownerHotels.map(h => h._id.toString());
      }

      // Khởi tạo nhóm city
      if (!revenueByCity[cityNameRaw]) revenueByCity[cityNameRaw] = {};
      // Gán map
      for (const hid of hotelIds) {
        cityHotelMap[hid] = cityNameRaw;
      }
    }

    const allHotelIds = Object.keys(cityHotelMap);
    if (allHotelIds.length === 0) {
      return res.status(200).json({
        region: region.name,
        groupBy,
        startDate,
        endDate,
        totalCities: targetCities.length,
        revenueByCity,
      });
    }

    // Lấy bookings theo khoảng thời gian và trong danh sách hotelIds
    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $gte: start, $lte: end },
      hotelId: { $in: allHotelIds },
    })
      .populate({ path: "roomid", select: "rentperday" })
      .select("hotelId checkin checkout voucherDiscount roomid");

    // Tính doanh thu và nhóm theo (city -> timeKey)
    for (const booking of bookings) {
      const hotelId = booking.hotelId?.toString();
      const cityKey = cityHotelMap[hotelId] || "Khác";
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const amount = Math.max(
        (booking.roomid?.rentperday || 0) * (days > 0 ? days : 0) - (booking.voucherDiscount || 0),
        0
      );

      let timeKey;
      if (groupBy === "day") {
        timeKey = checkinDate.toISOString().split("T")[0];
      } else if (groupBy === "month") {
        timeKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;
      } else {
        timeKey = checkinDate.getFullYear().toString();
      }

      if (!revenueByCity[cityKey]) revenueByCity[cityKey] = {};
      revenueByCity[cityKey][timeKey] = (revenueByCity[cityKey][timeKey] || 0) + amount;
    }

    return res.status(200).json({
      region: region.name,
      groupBy,
      startDate,
      endDate,
      totalCities: Object.keys(revenueByCity).length,
      revenueByCity,
    });
  } catch (error) {
    console.error("Lỗi khi lấy doanh thu theo city của region:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi lấy doanh thu theo city của region", error: error.message });
  }
};

// @desc    Get revenue grouped by staff-owned hotels and by time (day/month/year)
// @route   GET /api/stats/revenue/by-owner-hotels
// @access  Private/Admin/Staff
exports.getRevenueByOwnerHotels = async (req, res) => {
  const { ownerEmail, startDate, endDate, groupBy = "month", hotelId } = req.query;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Kết nối cơ sở dữ liệu chưa sẵn sàng" });
    }

    if (!ownerEmail) {
      return res.status(400).json({ message: "Vui lòng cung cấp ownerEmail" });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp startDate và endDate" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }
    if (!["day", "month", "year"].includes(groupBy)) {
      return res.status(400).json({ message: "groupBy phải là 'day', 'month' hoặc 'year'" });
    }

    const email = String(ownerEmail).toLowerCase();
    const hotels = await Hotel.find({ email }).select("_id name");
    if (!hotels.length) {
      return res.status(200).json({ ownerEmail: email, groupBy, startDate, endDate, totalHotels: 0, revenueByHotel: {} });
    }

    let hotelIds = hotels.map(h => h._id.toString());
    const hotelNameMap = hotels.reduce((acc, h) => { acc[h._id.toString()] = h.name; return acc; }, {});
    if (hotelId && mongoose.Types.ObjectId.isValid(hotelId)) {
      hotelIds = hotelIds.filter(id => id === String(hotelId));
    }

    const bookings = await Booking.find({
      status: "confirmed",
      checkin: { $gte: start, $lte: end },
      hotelId: { $in: hotelIds },
    }).populate({ path: "roomid", select: "rentperday" });

    const revenueByHotel = {};
    let totalRevenue = 0;
    for (const booking of bookings) {
      const hId = booking.hotelId?.toString();
      const hotelKey = hotelNameMap[hId] || "Khách sạn";
      const checkinDate = new Date(booking.checkin);
      const checkoutDate = new Date(booking.checkout);
      const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
      const amount = Math.max((booking.roomid?.rentperday || 0) * (days > 0 ? days : 0) - (booking.voucherDiscount || 0), 0);
      totalRevenue += amount;

      let timeKey;
      if (groupBy === "day") timeKey = checkinDate.toISOString().split("T")[0];
      else if (groupBy === "month") timeKey = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}`;
      else timeKey = checkinDate.getFullYear().toString();

      if (!revenueByHotel[hotelKey]) revenueByHotel[hotelKey] = {};
      revenueByHotel[hotelKey][timeKey] = (revenueByHotel[hotelKey][timeKey] || 0) + amount;
    }

    return res.status(200).json({ ownerEmail: email, groupBy, startDate, endDate, totalHotels: hotelIds.length, totalRevenue, revenueByHotel });
  } catch (error) {
    console.error("Lỗi khi thống kê doanh thu theo khách sạn của staff:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi khi thống kê doanh thu theo khách sạn của staff", error: error.message });
  }
};
