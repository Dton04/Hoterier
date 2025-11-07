// 📁 ./components/HotelResult/components/HotelList.jsx
import React from "react";
import Loader from "../../Loader";
import HotelCard from "./HotelCard";

export default function HotelList({
  loading,
  filteredHotels,
  favorites,
  toggleFavorite,
  averageRatings,
  festivalInfo,
  navigate,
}) {
  if (loading) return <Loader message="Đang tải kết quả..." />;
  if (filteredHotels.length === 0)
    return <p className="text-gray-500 text-center py-8">Không tìm thấy khách sạn phù hợp.</p>;

  return (
    <>
      {filteredHotels.map((hotel) => (
        <HotelCard
          key={hotel._id}
          hotel={hotel}
          isFavorite={favorites.includes(hotel._id)}
          toggleFavorite={toggleFavorite}
          ratingInfo={averageRatings[hotel._id] || { average: 0, totalReviews: 0 }}
          discountInfo={
            festivalInfo
              ? {
                  name: festivalInfo.name,
                  description: festivalInfo.description,
                  discountType: festivalInfo.discountType,
                  discountValue: festivalInfo.discountValue,
                  type: festivalInfo.type,
                  _id: festivalInfo._id, // ✅ thêm id của festival
                }
              : null
          }
          onSelect={(id) =>
            navigate(
              `/hotel/${id}${
                festivalInfo?._id ? `?festivalId=${festivalInfo._id}` : ""
              }`
            )
          }
        />
      ))}
    </>
  );
}
