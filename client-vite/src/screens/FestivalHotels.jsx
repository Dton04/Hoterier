import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";

export default function FestivalHotels() {
  const { id } = useParams();
  const [festival, setFestival] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFestivalHotels = async () => {
      try {
        const { data } = await axios.get(`/api/discounts/${id}/festival-hotels`);
        setFestival(data.festival);

        // Gom nhóm khách sạn theo khu vực và lấy giá thấp nhất sau giảm
        const groupedByRegion = {};
        data.hotels.forEach((hotel) => {
          const regionName = hotel.region?.name || "Khu vực khác";
          if (!groupedByRegion[regionName]) {
            groupedByRegion[regionName] = {
              regionId: hotel.region?._id,
              image: hotel.imageurls?.[0],
              lowestPrice: Infinity,
              count: 0,
            };
          }
          const regionData = groupedByRegion[regionName];
          const hotelLowest = Math.min(...hotel.rooms.map((r) => r.discountedPrice));
          regionData.lowestPrice = Math.min(regionData.lowestPrice, hotelLowest);
          regionData.count += 1;
        });

        const regionList = Object.entries(groupedByRegion).map(([name, info]) => ({
          name,
          ...info,
        }));
        setRegions(regionList);
      } catch (err) {
        console.error("Lỗi khi tải ưu đãi lễ hội:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFestivalHotels();
  }, [id]);

  if (loading) return <Loader message="Đang tải ưu đãi..." />;

  return (
    <div className="font-outfit bg-gray-50 text-gray-800">
      {/* 🟦 Banner dạng đặc biệt cho ưu đãi */}
     <section className="relative w-full h-[60vh] flex flex-col items-center justify-center text-white overflow-hidden -mt-[68px]">
  <img
    src={
      festival?.image ||
      "https://static.vecteezy.com/system/resources/previews/021/984/534/large_2x/cat-with-sunglasses-chilling-on-the-beach-vacation-holiday-mood-relax-sand-and-sea-blue-sky-travel-generative-ai-photo.jpg"
    }
    alt="Festival"
    className="absolute inset-0 w-full h-full object-cover"
  />

        {/* Overlay màu gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"></div>

        {/* Text trung tâm */}
        <div className="relative z-10 text-flex px-4 ">
          <h2 className="text-xl md:text-2xl font-light mb-2">
            Ưu Đãi Cuối Năm
          </h2>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-3">
            Đón Giờ Vàng
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-4">
            Tiết kiệm {festival?.discountValue}
            {festival?.discountType === "percentage" ? "%" : "₫"} trở lên khi lưu trú
            trước ngày 7 tháng 1 năm 2026
          </p>
          <div className="mt-2 text-sm text-gray-200">
            Đã bao gồm <span className="font-semibold">Ưu Đãi Cuối Năm</span> trong
            tìm kiếm
          </div>
        </div>

        {/* Booking Form nổi ở giữa giống Booking.com */}
        <div className="absolute bottom-[10px] sm:bottom-[30px] md:bottom-[40px] text-black left-1/2 -translate-x-1/2 z-20 w-full max-w-6xl">
  <BookingForm />
</div>

      </section>

      {/* 🟩 Danh sách khu vực có ưu đãi */}
      <section className="py-20 bg-white mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#003580] mb-10 text-center">
            Điểm đến hàng đầu có ưu đãi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {regions.map((region) => (
              <div
                key={region.name}
                onClick={() =>
                  navigate(
                    `/hotel-results?destination=${region.regionId}&festival=${id}`
                  )
                }
                className="cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={region.image || "/images/default-region.jpg"}
                    alt={region.name}
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                    {region.count} Ưu Đãi Cuối Năm
                  </div>
                </div>

                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {region.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Từ{" "}
                    <span className="font-semibold text-green-700">
                      VND {region.lowestPrice.toLocaleString()}
                    </span>{" "}
                    mỗi đêm
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
