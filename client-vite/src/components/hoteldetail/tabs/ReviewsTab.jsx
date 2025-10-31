import React from "react";
import { Star } from "lucide-react";
import moment from "moment";
import "moment/locale/vi";

export default function ReviewsTab({ reviews = [], average = 0 }) {
  if (!reviews.length)
    return (
      <p className="text-gray-600 text-sm">
        Chưa có đánh giá nào cho khách sạn này.
      </p>
    );

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-8">
      {/* Tổng quan */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Đánh giá của khách
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {reviews.length} lượt đánh giá ·{" "}
            <span className="text-blue-600 font-medium">
              {average >= 4.5
                ? "Tuyệt vời"
                : average >= 4
                ? "Rất tốt"
                : average >= 3
                ? "Tốt"
                : "Trung bình"}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-blue-700 leading-none">
            {average.toFixed(1)}
          </div>
          <p className="text-sm text-gray-500">/ 5 điểm trung bình</p>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      <div className="grid md:grid-cols-2 gap-5">
        {reviews.map((r) => (
          <div
            key={r._id}
            className="border rounded-xl p-5 bg-gray-50 hover:shadow-md transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                  {r.bookingId?.fullName
                    ? r.bookingId.fullName.charAt(0).toUpperCase()
                    : r.userName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {r.bookingId?.fullName || r.userName || "Ẩn danh"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.bookingId?.checkInDate
                      ? `Đã ở từ ${moment(r.bookingId.checkInDate).format(
                          "DD/MM/YYYY"
                        )}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="bg-blue-700 text-white px-2 py-1 rounded text-sm font-semibold">
                  {r.rating.toFixed(1)}
                </span>
                <Star className="text-yellow-500 fill-yellow-400" size={14} />
              </div>
            </div>

            {/* Nội dung */}
            <p className="text-gray-700 italic text-sm mb-2">
              “{r.comment.length > 200
                ? r.comment.slice(0, 200) + "..."
                : r.comment}”
            </p>

            {/* Thông tin phụ */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                {r.roomId?.name
                  ? `Phòng: ${r.roomId.name}`
                  : "Không rõ loại phòng"}
              </span>
              <span>{moment(r.createdAt).fromNow()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
