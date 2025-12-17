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

            hotel.festival || festivalInfo
              ? {
                name: hotel.festival?.name || festivalInfo?.name,
                description: hotel.festival?.description || festivalInfo?.description,
                discountType: hotel.festival?.discountType || festivalInfo?.discountType,
                discountValue: hotel.festival?.discountValue || festivalInfo?.discountValue,
                type: hotel.festival?.type || festivalInfo?.type,
                _id: hotel.festival?._id || festivalInfo?._id,
              }
              : null
          }
          onSelect={(id) =>
            navigate(
              `/hotel/${id}${hotel.festival?._id || festivalInfo?._id
                ? `?festivalId=${hotel.festival?._id || festivalInfo?._id}`
                : ""
              }`
            )
          }
        />
      ))}
    </>
  );
}
