import React, { useEffect, useState } from "react";
import { Input, Button, Spin, Empty } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FileText, Star } from "lucide-react";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";
import toast from "react-hot-toast";
import Banner from "../components/Banner";

const { TextArea } = Input;

const Review = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paidBookings, setPaidBookings] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [criteria, setCriteria] = useState({
    cleanliness: 10,
    comfort: 10,
    staff: 10,
    location: 10,
    facilities: 10,
    value: 10
  });

  const userFromRedux = useSelector((state) => state.loginUserReducer.currentUser);
  const storedRaw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
  const stored = (() => { try { const p = storedRaw ? JSON.parse(storedRaw) : null; return p?.user || p || null; } catch { return null; } })();
  const user = userFromRedux || stored;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const bookingsResponse = await axios.get(`/api/bookings`, {
          params: {
            email: user.email,
            status: "confirmed"
          }
        });

        const confirmedAndPaidBookings = bookingsResponse.data.filter(
          (b) => b.paymentStatus === "paid" && b.status === "confirmed"
        );

        setPaidBookings(confirmedAndPaidBookings);

        const reviewsResponse = await axios.get(`/api/reviews/by-email`, {
          params: { email: user.email }
        });
        setReviews(reviewsResponse.data);

      } catch (error) {
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!selectedHotel || rating < 1 || rating > 10) {
      return toast.error("Vui lòng chọn khách sạn và đánh giá tổng từ 1–10");
    }

    if (!comment.trim()) {
      return toast.error("Vui lòng chia sẻ trải nghiệm của bạn");
    }

    try {
      setSubmitting(true);
      await axios.post(
        "/api/reviews",
        {
          hotelId: selectedHotel,
          rating,
          comment: comment.trim(),
          criteriaRatings: criteria,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      toast.success("Đánh giá thành công!");

      // Reset form
      setRating(10);
      setComment("");
      setSelectedHotel(null);
      setCriteria({ cleanliness: 10, comfort: 10, staff: 10, location: 10, facilities: 10, value: 10 });

      // Refresh reviews
      const reviewsResponse = await axios.get(`/api/reviews/by-email`, {
        params: { email: user.email }
      });
      setReviews(reviewsResponse.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Bạn cần đặt phòng và thanh toán trước khi đánh giá");
      } else {
        toast.error(err.response?.data?.message || "Lỗi khi gửi đánh giá");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative w-full -mt-[260px] sm:-mt-[330px]">
        <Banner />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              {/* User Avatar */}
              <div className="flex flex-col items-center mb-6">
                <img
                  src={
                    user?.avatar
                      ? user.avatar.startsWith("http")
                        ? user.avatar
                        : `http://localhost:5000/${user.avatar.replace(/^\/+/, "")}`
                      : "https://cf.bstatic.com/static/img/theme-index/default-avatar.svg"
                  }
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-blue-200"
                />
                <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
              </div>

              {/* Stats */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between py-2 border-b hover:bg-gray-50 px-2 rounded cursor-pointer">
                  <span className="text-sm text-gray-700">Tất cả đánh giá</span>
                  <span className="font-semibold text-gray-900">{reviews.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded cursor-pointer">
                  <span className="text-sm text-gray-700">Đánh giá về chỗ nghỉ</span>
                  <span className="font-semibold text-gray-900">{reviews.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6 ">
            {/* Review Form Card */}
            {paidBookings.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 ">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Viết đánh giá mới</h2>

                {/* Hotel Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn khách sạn bạn đã trải nghiệm
                  </label>
                  <select
                    value={selectedHotel || ""}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn khách sạn --</option>
                    {paidBookings.map((b) => {
                      const reviewExists = reviews.some(r => r.hotelId?._id === b.hotelId?._id);
                      return (
                        <option
                          key={b._id}
                          value={b.hotelId?._id}
                          disabled={reviewExists}
                        >
                          {b.hotelId?.name || "Khách sạn"} - {b.roomType}
                          {reviewExists ? " (Đã đánh giá)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Rating Score */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm tổng (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    disabled={submitting}
                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Criteria Ratings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Chấm điểm tiêu chí (1–10)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(criteria).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-700 font-medium">
                          {k === 'staff' ? 'Nhân viên phục vụ' :
                            k === 'facilities' ? 'Tiện nghi' :
                              k === 'cleanliness' ? 'Sạch sẽ' :
                                k === 'comfort' ? 'Thoải mái' :
                                  k === 'value' ? 'Đáng giá tiền' : 'Địa điểm'}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={v}
                          onChange={(e) => setCriteria((s) => ({ ...s, [k]: Number(e.target.value) }))}
                          disabled={submitting}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chia sẻ trải nghiệm của bạn
                  </label>
                  <TextArea
                    rows={6}
                    placeholder="Hãy chia sẻ những điều bạn thích về khách sạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                    className="rounded-lg"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  size="large"
                  className="w-full md:w-auto px-8"
                  style={{ backgroundColor: '#003580', borderColor: '#003580' }}
                >
                  Gửi đánh giá
                </Button>
              </div>
            )}

            {/* Empty State for No Bookings */}
            {paidBookings.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bạn hiện không có đánh giá đang chờ xử lý nào
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa có đơn đặt phòng nào đã hoàn thành.<br />
                  Hãy đặt phòng và trải nghiệm dịch vụ của chúng tôi!
                </p>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Đánh giá của bạn ({reviews.length})
                  </h2>
                </div>
                <div className="divide-y">
                  {reviews.map((review) => (
                    <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Hotel Image Placeholder */}
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          {review.hotelId?.imageurls?.[0] ? (
                            <img
                              src={review.hotelId.imageurls[0]}
                              alt={review.hotelId?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FileText size={32} />
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {review.hotelId?.name || "Khách sạn"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Đánh giá vào {moment(review.createdAt).locale("vi").format("DD MMMM YYYY")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 bg-[#003580] text-white px-3 py-1 rounded-lg">
                              <Star size={16} fill="white" />
                              <span className="font-bold">{Number(review.rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Bạn chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
