import { useState, useEffect } from "react";
import axios from "axios";
import { Star, Car, Heart, MapPin, Building } from "lucide-react";
import { toast } from "react-toastify";

export default function HotelHighlights({ hotel }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userInfo) return;
      try {
        const { data } = await axios.get("/api/favorites", config);
        const found = data.some((f) => f._id === hotel?._id);
        setIsFavorite(found);
      } catch (err) {
        console.warn("Không thể lấy danh sách yêu thích:", err.message);
      }
    };
    fetchFavorites();
  }, [hotel?._id]);

  const handleFavorite = async () => {
    if (!userInfo) {
      toast.warn("Vui lòng đăng nhập để lưu chỗ nghỉ");
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`/api/favorites/${hotel._id}`, config);
        setIsFavorite(false);
        toast.info("Đã xoá khỏi danh sách yêu thích");
      } else {
        await axios.post("/api/favorites", { hotelId: hotel._id }, config);
        setIsFavorite(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu chỗ nghỉ");
    }
  };

  const handleBookNow = () => {
    const roomsSection = document.getElementById("rooms");
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      toast.warn("Không tìm thấy phần Thông tin & Giá phòng");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md w-full">
      {/* Tiêu đề */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Điểm nổi bật của chỗ nghỉ
      </h3>

      {/* Đánh giá */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
        <p className="font-semibold text-sm text-[#003580]">
          Hoàn hảo cho kỳ nghỉ 1 đêm!
        </p>
        <div className="flex items-start gap-2 mt-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
          <span>
            Địa điểm hàng đầu: Được khách gần đây đánh giá cao{" "}
            {/* <span className="font-semibold text-gray-900">(10,0 điểm)</span> */}
          </span>
        </div>
      </div>

      {/* Thông tin phòng */}
      <div className="space-y-2 mb-5">
        <p className="font-medium text-gray-800">Phòng có:</p>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Building className="w-4 h-4 text-gray-600" />
          <span>Nhìn ra thành phố</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Car className="w-4 h-4 text-gray-600" />
          <span>Có bãi đậu xe riêng miễn phí ở khách sạn này</span>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={handleBookNow}
          className="px-5 py-2.5 bg-[#0071c2] hover:bg-[#004999] text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          Đặt ngay
        </button>

        <button
          onClick={handleFavorite}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition ${
            isFavorite
              ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-[#0071c2] text-[#0071c2] hover:bg-blue-50"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-[#0071c2]"
            }`}
          />
          {isFavorite ? "Đã lưu chỗ nghỉ" : "Lưu chỗ nghỉ"}
        </button>
      </div>
    </div>
  );
}
