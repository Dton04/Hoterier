import React, { useState } from "react";
import { MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import moment from "moment";
import "moment/locale/vi";

export default function ReviewsTab({ reviews = [], average = 0 }) {
  const [selectedFilter, setSelectedFilter] = useState({
    type: "Tất cả",
    score: "Tất cả",
    language: "Tất cả",
    time: "Tất cả",
  });

  // 🔹 Giả lập dữ liệu hạng mục
  const categories = [
    { label: "Nhân viên phục vụ", score: 8.7 },
    { label: "Tiện nghi", score: 8.6 },
    { label: "Sạch sẽ", score: 8.9 },
    { label: "Thoải mái", score: 8.8 },
    { label: "Đáng giá tiền", score: 8.8 },
    { label: "Địa điểm", score: 9.1 },
  ];

  // 🔹 Nếu chưa có dữ liệu thật thì hiển thị mẫu
  if (!reviews.length) {
    reviews = [
      {
        _id: 1,
        userName: "Văn",
        country: "Việt Nam",
        rating: 10,
        title: "Xuất sắc",
        comment: "Phòng sạch sẽ thoáng mát, nhân viên thân thiện và nhiệt tình.",
        roomName: "Căn hộ 1 Phòng Ngủ Có Ban Công",
        stay: "1 đêm - 10/2025",
        group: "Khách lẻ",
        createdAt: "2025-10-06",
      },
      {
        _id: 2,
        userName: "Không tên",
        country: "Úc",
        rating: 1.0,
        title: "Cực kỳ tệ",
        comment: "Quá tệ.",
        roomName: "Căn hộ 1 Phòng Ngủ Có Ban Công",
        stay: "1 đêm - 10/2025",
        group: "Cặp đôi",
        createdAt: "2025-10-21",
      },
    ];
  }

  return (
    <div className="bg-white rounded-xl border shadow-lg p-6 space-y-10">
      {/* === PHẦN TỔNG QUAN === */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Đánh giá của khách về {reviews?.[0]?.hotelName || "khách sạn này"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Chúng tôi cố gắng mang đến 100% đánh giá thật từ khách hàng
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-blue-700">
            {average.toFixed(1) || "5.0"}
          </div>
          <div>
            <p className="font-semibold text-gray-800">Tuyệt vời</p>
            <p className="text-gray-500 text-sm">{reviews.length} đánh giá</p>
          </div>
        </div>
      </div>

      {/* === HẠNG MỤC === */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Hạng mục</h3>
        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-12">
          {categories.map((c, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-gray-700 text-sm">{c.label}</span>
              <div className="flex items-center gap-2 w-40">
                <div className="flex-1 bg-gray-200 h-[6px] rounded-full">
                  <div
                    className={`h-[6px] rounded-full ${c.score >= 9 ? "bg-green-600" : "bg-blue-600"
                      }`}
                    style={{ width: `${(c.score / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {c.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === BỘ LỌC === */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Bộ lọc</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          {[
            { key: "type", label: "Khách đánh giá" },
            { key: "score", label: "Điểm đánh giá" },
            { key: "language", label: "Ngôn ngữ" },
            { key: "time", label: "Thời gian" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1">
                {f.label}
              </label>
              <select
                value={selectedFilter[f.key]}
                onChange={(e) =>
                  setSelectedFilter({ ...selectedFilter, [f.key]: e.target.value })
                }
                className="w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Tất cả</option>
                <option>Khách Việt Nam</option>
                <option>Khách quốc tế</option>
              </select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {["Phòng", "Vị trí", "Sạch sẽ", "Bữa sáng", "Giường", "Nhân viên"].map(
            (tag, i) => (
              <button
                key={i}
                className="px-3 py-1.5 border rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                + {tag}
              </button>
            )
          )}
        </div>
      </div>

      {/* === DANH SÁCH ĐÁNH GIÁ === */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Đánh giá của khách
        </h3>
        <div className="space-y-8">
          {reviews.map((r) => (
            <div key={r._id} className="border-b pb-6">
              {/* Header */}
              <div className="flex justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    {r.userName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{r.userName}</p>
                    <p className="text-sm text-gray-500">{r.country}</p>
                    <p className="text-xs text-gray-400">
                      Ngày đánh giá:{" "}
                      {moment(r.createdAt).format("DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-700 text-white font-bold px-2.5 py-1 rounded text-lg">
                  {r.rating.toFixed(1)}
                </div>
              </div>

              {/* Title & Comment */}
              <div className="mt-3">
                <p className="font-semibold text-gray-900 text-lg">{r.title}</p>
                <p className="text-gray-700 mt-1">{r.comment}</p>
              </div>
              {/* Thông tin chi tiết */}
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>🏨 Khách sạn: {r.hotelId?.name || "Không rõ"}</p>
                <p>📍 Địa chỉ: {r.hotelId?.address || "Chưa cập nhật"}</p>
                <p>🛏️ Phòng: {r.roomId?.name || "Không rõ"}</p>
                <p>
                  📅 Thời gian ở:{" "}
                  {r.bookingId?.checkInDate
                    ? `${moment(r.bookingId.checkInDate).format("DD/MM/YYYY")} - ${moment(
                      r.bookingId.checkOutDate
                    ).format("DD/MM/YYYY")}`
                    : "Không xác định"}
                </p>
                <p>👤 Khách: {r.bookingId?.fullName || r.userName || "Ẩn danh"}</p>
              </div>


              {/* Actions */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                <button className="flex items-center gap-1 hover:text-blue-700">
                  <ThumbsUp size={16} /> Hữu ích
                </button>
                <button className="flex items-center gap-1 hover:text-blue-700">
                  <ThumbsDown size={16} /> Không hữu ích
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
