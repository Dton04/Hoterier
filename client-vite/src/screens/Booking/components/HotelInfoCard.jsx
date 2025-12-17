import React from "react";
import { MapPin, Star, Car, Wifi } from "lucide-react";

export default function HotelInfoCard({ hotel }) {
  if (!hotel) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-gray-100 text-gray-500 rounded-lg shadow-inner">
        Không có thông tin khách sạn
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
      {/* Ảnh khách sạn */}
      <div className="relative">
        <img
          src={hotel.imageurls?.[0] || hotel.image || "/images/default-hotel.jpg"}
          alt={hotel.name}
          className="w-full h-64 object-cover"
        />
        {hotel.rating && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-lg shadow">
            {hotel.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Thông tin khách sạn */}
      <div className="p-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {hotel.name}
          {hotel.stars && (
            <div className="flex gap-1 text-yellow-500">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} size={18} fill="#facc15" stroke="#facc15" />
              ))}
            </div>
          )}
        </h2>

        <div className="flex items-center gap-2 text-gray-600 mt-1">
          <MapPin size={16} />
          <p className="text-sm">{hotel.address}</p>
        </div>

        {hotel.city && (
          <p className="text-gray-500 text-sm mt-1">{hotel.city}, Việt Nam</p>
        )}

        {/* Thông tin thêm */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-700">
          {hotel.parking && (
            <div className="flex items-center gap-1">
              <Car size={16} /> Chỗ đỗ xe
            </div>
          )}
          {hotel.wifi && (
            <div className="flex items-center gap-1">
              <Wifi size={16} /> Wi-Fi miễn phí
            </div>
          )}
        </div>

        {/* Đánh giá */}
        {hotel.reviewScore && (
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-md font-bold">
              {hotel.reviewScore}
            </div>
            <p className="text-gray-700 text-sm">{hotel.reviewText}</p>
            <p className="text-gray-500 text-sm">
              ({hotel.reviewCount?.toLocaleString()} đánh giá)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
