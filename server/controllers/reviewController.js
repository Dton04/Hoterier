// reviewController.js
const mongoose = require("mongoose");
const Review = require("../models/review");
const Booking = require("../models/booking");
const Hotel = require("../models/hotel");

// POST /api/reviews – Gửi đánh giá mới
exports.createReview = async (req, res) => {
  try {
    const { hotelId, rating, comment, criteriaRatings } = req.body;

    if (!hotelId || !rating) {
      return res.status(400).json({ message: "Thiếu dữ liệu đánh giá" });
    }

    // Tìm booking hợp lệ của user
    const booking = await Booking.findOne({
      hotelId,
      email: req.user.email.toLowerCase(),
      paymentStatus: "paid"
    });

    if (!booking) {
      return res.status(403).json({
        message: "Bạn chỉ có thể đánh giá sau khi đã thanh toán và xác nhận đặt phòng."
      });
    }

    // Tạo hoặc cập nhật review
    let review = await Review.findOne({
      hotelId,
      email: req.user.email.toLowerCase()
    });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      review.userName = booking.name || req.user.name || review.userName;
      review.criteriaRatings = criteriaRatings;
      await review.save();
    } else {
      review = new Review({
        hotelId,
        rating,
        comment,
        email: req.user.email.toLowerCase(),
        bookingId: booking._id,
        criteriaRatings,
        userName: booking.name || req.user.name,
      });
      await review.save();
    }

    res.status(201).json({ message: "Đánh giá thành công", review });
  } catch (error) {
    console.error("Lỗi khi tạo đánh giá:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// GET /api/reviews - Lấy danh sách review
exports.getReviews = async (req, res) => {
  try {
    const { hotelId, email, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (hotelId) filter.hotelId = hotelId;
    if (email) filter.email = { $regex: email, $options: "i" }; // ✅ lọc email gần đúng (không phân biệt hoa/thường)

    if (status && status !== 'all') {
      if (status === 'active') {
        filter.isDeleted = false;
        filter.isVisible = true;
      } else if (status === 'hidden') {
        filter.isDeleted = false;
        filter.isVisible = false;
      } else if (status === 'deleted') {
        filter.isDeleted = true;
      }
    }

    const skip = (page - 1) * limit;
    const total = await Review.countDocuments(filter);

    // Thay trong reviewController.js
    const reviewsRaw = await Review.find(filter)
      .populate("hotelId", "name")
      .populate("roomId", "name type")
      .populate({
        path: "bookingId",
        select: "name checkin checkout",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const reviews = reviewsRaw.map((r) => {
      const o = r.toObject();
      if (!o.userName || o.userName === "Ẩn danh") {
        o.userName = o.bookingId?.name || (o.email ? o.email.split("@")[0] : "");
      }
      return o;
    });

    res.status(200).json({
      reviews,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đánh giá" });
  }
};


// GET /api/reviews/average
exports.getAverageRating = async (req, res) => {
  const { hotelId } = req.query;
  try {
    const reviews = await Review.find({ hotelId, isDeleted: false, isVisible: true });
    const avg = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    res.json({ average: avg, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tính điểm trung bình", error: error.message });
  }
};

// GET /api/reviews/by-email
exports.getReviewsByEmail = async (req, res) => {
  try {
    const reviews = await Review.find({
      email: req.query.email.toLowerCase(),
      isDeleted: false,
      isVisible: true
    })
      .populate("hotelId", "name imageurls")
      .populate("roomId", "name type")
      .select("hotelId roomId rating comment createdAt criteriaRatings")
      .lean()
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy đánh giá theo email", error: error.message });
  }
};

// PATCH /api/reviews/:id/toggle-hidden
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    review.isVisible = !review.isVisible;
    await review.save();
    res.json({
      message: review.isVisible ? "Hiển thị đánh giá" : "Ẩn đánh giá",
      review
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thay đổi trạng thái", error: error.message });
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    review.isDeleted = true;
    await review.save();
    res.json({ message: "Xóa mềm thành công", review });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa đánh giá", error: error.message });
  }
};

// GET /api/reviews/categories-average
exports.getCategoriesAverage = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ message: "Thiếu hotelId" });
    const reviews = await Review.find({ hotelId, isDeleted: false, isVisible: true }, {
      criteriaRatings: 1,
    });
    const sum = {
      cleanliness: 0,
      comfort: 0,
      staff: 0,
      location: 0,
      facilities: 0,
      value: 0,
    };
    let count = 0;
    for (const r of reviews) {
      const c = r.criteriaRatings || {};
      const keys = Object.keys(sum);
      let hasAny = false;
      for (const k of keys) {
        if (typeof c[k] === 'number') {
          sum[k] += c[k];
          hasAny = true;
        }
      }
      if (hasAny) count++;
    }
    const avg = Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, count ? v / count : 0]));
    res.json({ average: avg, count });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tính điểm tiêu chí", error: error.message });
  }
};

// GET /api/reviews/eligibility
exports.getEligibility = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ message: "Thiếu hotelId" });
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(401).json({ message: "Không được phép" });
    const booking = await Booking.findOne({ hotelId, email, status: 'confirmed', paymentStatus: 'paid' });
    const review = await Review.findOne({ hotelId, email });
    res.json({ canReview: !!booking, hasReviewed: !!review });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra điều kiện đánh giá", error: error.message });
  }
};
