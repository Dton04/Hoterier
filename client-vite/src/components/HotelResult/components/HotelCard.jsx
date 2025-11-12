import React from "react";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

const HotelCard = ({
  hotel,
  isFavorite = false,
  toggleFavorite = () => { },
  ratingInfo = { average: 0, totalReviews: 0 },
  discountInfo = null,
  onSelect = () => { },
}) => {
  const { average, totalReviews } = ratingInfo;
  const ratingText =
    average >= 9 ? "Tuyệt hảo" : average >= 8 ? "Tuyệt vời" : average >= 7 ? "Rất tốt" : "Tốt";

  // 🔥 Tính toán giá hiển thị (có discount hay không)
  const basePrice = hotel.lowestPrice || 0;
  let finalPrice = basePrice;
  let discountBadge = null;

  if (discountInfo) {
    if (discountInfo.discountType === "percentage") {
      finalPrice = Math.round(basePrice * (1 - discountInfo.discountValue / 100));
      discountBadge = `-${discountInfo.discountValue}%`;
    } else {
      finalPrice = Math.max(0, basePrice - discountInfo.discountValue);
      discountBadge = `Tiết kiệm ${discountInfo.discountValue.toLocaleString()}₫`;
    }
  } else if (hotel.rooms?.[0]?.discountedPrice) {
    const lowestDiscount = Math.min(
      ...hotel.rooms.map((r) => r.discountedPrice || r.rentperday)
    );
    if (lowestDiscount < basePrice) {
      finalPrice = lowestDiscount;
      const diff = basePrice - lowestDiscount;
      const discountPercent = Math.round((diff / basePrice) * 100);
      discountBadge = `-${discountPercent}%`;
    }
  }

  const showDiscount = finalPrice < basePrice;

  return (
    <div
      onClick={() => onSelect(hotel._id)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition overflow-hidden cursor-pointer flex flex-col md:flex-row"
    >
      {/* 🖼 Ảnh khách sạn */}
      <div className="relative w-full md:w-1/3 h-56 sm:h-60 p-3 overflow-hidden rounded-xl">
        <img
          src={hotel.imageurls?.[0] || "/images/default-hotel.jpg"}
          alt={hotel.name}
          className="w-full h-full object-cover rounded-xl transform hover:scale-105 transition duration-500"
        />

        {/* ❤️ Nút yêu thích */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(hotel._id);
          }}
          className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-2 m-2 shadow-md"
        >
          {isFavorite ? (
            <FaHeart className="text-red-500 text-lg" />
          ) : (
            <FaRegHeart className="text-gray-500 text-lg" />
          )}
        </button>

        {/* 🏷️ Tag giảm giá */}
        {(discountInfo || showDiscount) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discountInfo?.name && (
              <span className="bg-[#0071c2] text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md">
                {discountInfo.name}
              </span>
            )}
            {showDiscount && (
              <span className="bg-[#d4111e] text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md">
                {discountBadge || "Giảm giá"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 🏨 Thông tin khách sạn */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          {/* Cột trái */}
          <div className="flex-1">
            {/* 🔹 Tên khách sạn + sao + nổi bật */}
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-xl font-semibold text-[#003580] hover:underline">
                {hotel.name}
              </h3>

              {/* Sao khách sạn */}
              <div className="flex items-center text-yellow-400">
                {[...Array(hotel.starRating || 3)].map((_, i) => (
                  <FaStar key={i} className="text-yellow-400 text-sm" />
                ))}
              </div>

              {/* Badge nổi bật */}
              {hotel.isFeatured && (
                <span className="bg-yellow-300 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-md">
                  Nổi bật
                </span>
              )}
            </div>

            {/* Địa chỉ */}
            <p className="text-sm text-[#0071c2] hover:underline cursor-pointer">
              {hotel.district ? `${hotel.district}, ` : ""}
              {hotel.region?.name || "Việt Nam"}
            </p>

            {/* Phòng nổi bật */}
            {hotel.rooms?.length > 0 && (
              <div className="mt-2">
                {discountInfo?.name && (
                  <div className="mt-1 bg-green-700 border border-blue-200 text-white text-xs rounded-md px-2 py-1 w-fit">
                    {discountInfo.name} –{" "}
                    {discountInfo.discountType === "percentage"
                      ? `Giảm ${discountInfo.discountValue}%`
                      : `Giảm ${discountInfo.discountValue.toLocaleString()}₫`}
                  </div>
                )}
                <p className="text-sm text-gray-800 font-medium">
                  {hotel.rooms[0].name}
                </p>


                <p className="text-xs text-gray-600">
                  {hotel.rooms[0].beds} giường • {hotel.rooms[0].baths} phòng tắm
                </p>
                <ul className="mt-1 text-xs sm:text-sm text-green-700 space-y-0.5">
                  <li>✔ Miễn phí hủy</li>
                  <li>✔ Thanh toán tại chỗ nghỉ</li>
                </ul>
                <p className="text-xs sm:text-sm text-red-500 font-medium">
                  Chỉ còn {hotel.rooms[0].quantity} phòng với giá này
                </p>
              </div>
            )}
          </div>

          {/* Cột phải: giá + đánh giá */}
          <div className="flex flex-col justify-between items-end min-w-[180px] text-right">
            {/* ⭐ Đánh giá */}
            <div>
              {average > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-gray-700 text-sm sm:text-base">
                      {ratingText}
                    </span>
                    <span className="text-xs text-gray-500">
                      {totalReviews} đánh giá
                    </span>
                  </div>
                  <div className="bg-[#003580] text-white font-bold rounded-md px-2 py-1 text-sm">
                    {average.toFixed(1)}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 text-sm italic">
                  Chưa có đánh giá
                </span>
              )}
            </div>

            {/* 💰 Giá */}
            {finalPrice > 0 && (
              <div className="mt-3">
                <p className="text-xs sm:text-sm text-gray-500 mb-0.5">
                  1 đêm, 2 người lớn
                </p>
                {showDiscount && (
                  <p className="text-gray-500 text-xs line-through">
                    {basePrice.toLocaleString()} ₫
                  </p>
                )}
                <p className="text-xl sm:text-2xl font-semibold text-[#d4111e]">
                  {finalPrice.toLocaleString()} ₫
                </p>
                <p className="text-xs text-gray-500">
                  Đã bao gồm thuế và phí
                </p>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hotel._id);
              }}
              className="mt-3 bg-[#0071c2] text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-blue-800 transition"
            >
              Xem chỗ trống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
