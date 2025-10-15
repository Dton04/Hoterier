import React from "react";
import { Star } from "lucide-react";

export default function ReviewsTab({ reviews = [], average = 0 }) {
  if (reviews.length === 0)
    return <p className="text-gray-600">Chưa có đánh giá nào cho khách sạn này.</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      {/* Tổng điểm */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Đánh giá của khách</h2>
          <p className="text-gray-600 mt-1">
            {reviews.length} lượt đánh giá · <span className="text-blue-600 font-medium">Tuyệt vời</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-blue-700">{average.toFixed(1)}</div>
          <p className="text-gray-500 text-sm">/ 10 điểm trung bình</p>
        </div>
      </div>

      {/* Biểu đồ điểm (giả lập 6 tiêu chí) */}
      <div className="grid md:grid-cols-3 gap-4">
        {["Nhân viên phục vụ", "Thoải mái", "Tiện nghi", "Sạch sẽ", "Địa điểm", "Đáng giá tiền"].map((cat, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm text-gray-700">
              <span>{cat}</span>
              <span>{(8 + Math.random() * 2).toFixed(1)}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${80 + Math.random() * 20}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chủ đề đánh giá */}
      <div className="flex flex-wrap gap-2 mt-4">
        {["Vị trí", "Phòng", "Bữa sáng", "Tầm nhìn", "Hồ bơi"].map((tag) => (
          <span
            key={tag}
            className="border px-3 py-1 rounded-full text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
          >
            + {tag}
          </span>
        ))}
      </div>

      {/* Danh sách đánh giá */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {reviews.slice(0, 6).map((r) => (
          <div
            key={r._id}
            className="border rounded-xl p-4 bg-gray-50 hover:shadow transition"
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="text-yellow-500 fill-yellow-400" size={16} />
              <span className="font-semibold text-gray-800">{r.username || "Ẩn danh"}</span>
              <span className="text-sm text-gray-500 ml-auto">{r.rating}/5</span>
            </div>
            <p className="text-gray-700 text-sm italic mb-1">
              “{r.comment.length > 150 ? r.comment.slice(0, 150) + "..." : r.comment}”
            </p>
            <p className="text-xs text-gray-500">Đã đánh giá gần đây</p>
          </div>
        ))}
      </div>
    </div>
  );
}
