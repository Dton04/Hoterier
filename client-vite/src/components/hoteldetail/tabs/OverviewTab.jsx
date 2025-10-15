import React from "react";
import { Star, MapPin } from "lucide-react";
import GoogleMapEmbed from "../components/GoogleMapEmbed";

export default function OverviewTab({ hotel, average, reviews }) {
  return (
    <div className="space-y-6">
      {/* Đánh giá tổng quan */}
      <div className="border rounded-lg p-5 shadow-sm bg-gray-50">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          Đánh giá tổng quan
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <Star className="text-yellow-500" size={20} />
          <span className="text-2xl font-bold text-blue-700">
            {average.toFixed(1)}
          </span>
          <span className="text-gray-600 text-sm">
            / 5 ({reviews.length} đánh giá)
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          “Khách nói rằng vị trí tuyệt vời, nhân viên thân thiện và phòng sạch
          sẽ.”
        </p>
      </div>

      {/* Bản đồ */}
      <div className="border rounded-lg p-4 shadow-sm bg-gray-50">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          Vị trí trên bản đồ
        </h3>
        <GoogleMapEmbed address={hotel.address} />
        <button
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                hotel.address || ""
              )}`,
              "_blank"
            )
          }
          className="mt-2 text-blue-600 hover:underline text-sm font-medium"
        >
          Xem vị trí chi tiết →
        </button>
      </div>
    </div>
  );
}
