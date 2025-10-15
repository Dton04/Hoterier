import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import BookingForm from "./BookingForm";
import Banner from "./Banner";
import Loader from "../components/Loader";

const RoomResults = () => {
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [services, setServices] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [averageRatings, setAverageRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    region: "",
    minPrice: 0,
    maxPrice: 10000000,
    rating: 0,
    starRatings: [],
    services: [],
    amenities: [],
  });

  const [sortBy, setSortBy] = useState("recommended");
  const location = useLocation();
  const navigate = useNavigate();

  // 📦 Lấy dữ liệu ban đầu
  useEffect(() => {
    fetchRegions();
    fetchServices();
    fetchAmenities();
    fetchHotels();
  }, [location.search]);

  // 🗺️ Khu vực
  const fetchRegions = async () => {
    try {
      const { data } = await axios.get("/api/regions");
      setRegions(data);
    } catch (err) {
      console.error("Lỗi khi lấy regions:", err);
    }
  };


  // Lấy danh sách dịch vụ đang hoạt động
const fetchServices = async () => {
  try {
    const { data } = await axios.get("/api/services?isAvailable=true");
    const uniqueServices = [...new Set(data.map((s) => s.name))];
    setServices(uniqueServices);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách dịch vụ:", err);
  }
};

  // Tiện nghi phòng
  const fetchAmenities = async () => {
  try {
    const { data } = await axios.get("/api/amenities");
    setAmenities(data);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách tiện nghi:", err);
  }
};


  // 🏨 Lấy danh sách khách sạn
  const fetchHotels = async () => {
    const searchParams = new URLSearchParams(location.search);
    const destination = searchParams.get("destination");

    setLoading(true);
    try {
      const { data } = await axios.get("/api/hotels");
      const filtered = destination
        ? data.filter((hotel) => hotel.region?._id === destination)
        : data;

      const hotelsWithExtras = await Promise.all(
        filtered.map(async (hotel) => {
          const servicesRes = await axios.get(`/api/services?hotelId=${hotel._id}&isAvailable=true`);
          const services = servicesRes.data || [];

          const lowestPrice = hotel.rooms?.length
            ? Math.min(...hotel.rooms.map((r) => r.rentperday))
            : 0;

          return {
            ...hotel,
            services,
            lowestPrice,
          };
        })
      );
      setHotels(hotelsWithExtras);
      fetchAverageRatings(hotelsWithExtras);
    } catch (err) {
      console.error("Lỗi khi lấy khách sạn:", err);
      toast.error("Không thể tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Lấy điểm đánh giá trung bình từng khách sạn
  const fetchAverageRatings = async (hotelList) => {
    try {
      const ratings = {};
      await Promise.all(
        hotelList.map(async (hotel) => {
          const res = await axios.get("/api/reviews/average", {
            params: { hotelId: hotel._id },
          });
          ratings[hotel._id] = res.data;
        })
      );
      setAverageRatings(ratings);
    } catch (err) {
      console.error("Lỗi khi lấy điểm đánh giá:", err);
    }
  };

  // 🧮 Bộ lọc thực tế
  const filteredHotels = useMemo(() => {
    return hotels
      .filter((hotel) => {
        const avg = averageRatings[hotel._id]?.average || 0;
        const priceMin = Math.min(...hotel.rooms.map((r) => r.rentperday));
        const priceMax = Math.max(...hotel.rooms.map((r) => r.rentperday));

        const matchRegion = filters.region ? hotel.region?._id === filters.region : true;
        const matchRating = avg >= filters.rating;
        const matchPrice = priceMax >= filters.minPrice && priceMin <= filters.maxPrice;
        const matchStars = filters.starRatings.length === 0 || filters.starRatings.includes(hotel.starRating || 3);

        const matchService =
          filters.services.length === 0 ||
          filters.services.some((s) =>
            hotel.services?.some((sv) => sv.name.toLowerCase().includes(s.toLowerCase()))
          );

        const matchAmenity =
          filters.amenities.length === 0 ||
          filters.amenities.some((a) =>
            hotel.rooms?.some((r) =>
              r.amenities?.some((am) => am.toLowerCase().includes(a.toLowerCase()))
            )
          );

        return matchRegion && matchRating && matchPrice && matchStars && matchService && matchAmenity;
      })
      .sort((a, b) => {
        if (sortBy === "priceLow") return a.lowestPrice - b.lowestPrice;
        if (sortBy === "priceHigh") return b.lowestPrice - a.lowestPrice;
        if (sortBy === "rating")
          return (averageRatings[b._id]?.average || 0) - (averageRatings[a._id]?.average || 0);
        return 0;
      });
  }, [hotels, filters, sortBy, averageRatings]);


  // 🔁 Reset filters
  const resetFilters = () => {
    setFilters({
      region: "",
      minPrice: 0,
      maxPrice: 10000000,
      rating: 0,
      starRatings: [],
      services: [],
      amenities: [],
    });
  };


  return (
    <>

      <div className=" mt-[68px] flex justify-center items-center py-10 w-full">
        <div className="w-full max-w-7xl mx-auto flex justify-center">
          <BookingForm />
        </div>
      </div>




      {/* 🏨 Kết quả tìm kiếm */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 px-4">

          {/* SIDEBAR */}
          <aside className="bg-white rounded-xl shadow-md p-6 sticky top-24 h-fit">
            <h3 className="text-xl font-semibold text-[#003580] mb-4">
              Bộ lọc tìm kiếm
            </h3>

            {/* Region */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Khu vực</h4>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2 text-gray-600 focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Tất cả khu vực</option>
                {regions.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Khoảng giá (VND)</h4>
              <input
                type="range"
                min="0"
                max="10000000"
                step="500000"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: Number(e.target.value) })
                }
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Tối đa: {filters.maxPrice.toLocaleString()}₫</span>
              </div>
            </div>

            {/* Rating */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Điểm đánh giá</h4>
              {[5, 4, 3, 2, 1].map((r) => (
                <label key={r} className="flex items-center space-x-2 cursor-pointer mb-1">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.rating === r}
                    onChange={() => setFilters({ ...filters, rating: r })}
                    className="accent-blue-600"
                  />
                  <div className="flex text-yellow-400">
                    {[...Array(r)].map((_, i) => <FaStar key={i} />)}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">trở lên</span>
                </label>
              ))}
            </div>

            {/* Star rating */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Xếp hạng chỗ nghỉ</h4>
              {[5, 4, 3, 2, 1].map((star) => (
                <label key={star} className="flex items-center space-x-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked={filters.starRatings.includes(star)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        starRatings: prev.starRatings.includes(star)
                          ? prev.starRatings.filter((s) => s !== star)
                          : [...prev.starRatings, star],
                      }))
                    }
                  />
                  <div className="flex text-yellow-400">
                    {[...Array(star)].map((_, i) => <FaStar key={i} />)}
                  </div>
                </label>
              ))}
            </div>

            {/* Dịch vụ khách sạn */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Dịch vụ khách sạn</h4>
              <div className="max-h-40 overflow-y-auto">
                {services.map((s) => (
                  <label key={s} className="flex items-center space-x-2 text-sm cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={filters.services.includes(s)}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          services: prev.services.includes(s)
                            ? prev.services.filter((v) => v !== s)
                            : [...prev.services, s],
                        }))
                      }
                      className="accent-blue-600"
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tiện nghi phòng */}
            <div className="border-b pb-4 mb-4">
              <h4 className="text-gray-700 font-medium mb-2">Tiện nghi phòng</h4>
              <div className="max-h-40 overflow-y-auto">
                {amenities.map((a) => (
                  <label key={a} className="flex items-center space-x-2 text-sm cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(a)}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          amenities: prev.amenities.includes(a)
                            ? prev.amenities.filter((v) => v !== a)
                            : [...prev.amenities, a],
                        }))
                      }
                      className="accent-blue-600"
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </div>


            {/* Amenities */}
            <div>
              <h4 className="text-gray-700 font-medium mb-2">Tiện nghi</h4>
              <div className="max-h-40 overflow-y-auto">
                {services.map((s) => (
                  <label key={s} className="flex items-center space-x-2 cursor-pointer mb-1 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(s)}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          amenities: prev.amenities.includes(s)
                            ? prev.amenities.filter((a) => a !== s)
                            : [...prev.amenities, s],
                        }))
                      }
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="w-full mt-5 bg-[#003580] text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
            >
              Đặt lại bộ lọc
            </button>
          </aside>

          {/* RESULTS */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600 text-sm">
                {filteredHotels.length} chỗ nghỉ phù hợp
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 text-gray-600"
              >
                <option value="recommended">Đề xuất</option>
                <option value="priceLow">Giá thấp → cao</option>
                <option value="priceHigh">Giá cao → thấp</option>
                <option value="rating">Điểm đánh giá cao nhất</option>
              </select>
            </div>

            {loading ? (
              <Loader message="Đang tải kết quả..." />
            ) : filteredHotels.length === 0 ? (
              <p className="text-gray-500">Không tìm thấy khách sạn phù hợp.</p>
            ) : (
              filteredHotels.map((hotel) => (
                <div
                  key={hotel._id}
                  onClick={() => navigate(`/hotel/${hotel._id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col md:flex-row"
                >
                  <div className="md:w-1/3 h-56 overflow-hidden">
                    <img
                      src={hotel.imageurls?.[0] || "/images/default-hotel.jpg"}
                      alt={hotel.name}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </div>

                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-[#003580]">{hotel.name}</h3>
                      <p className="text-sm text-gray-600">{hotel.address}</p>

                      <div className="flex items-center mt-1">
                        {[...Array(hotel.starRating)].map((_, i) => (
                          <FaStar key={i} className="text-yellow-400 text-sm" />
                        ))}
                      </div>

                      <div className="flex items-center mt-2 text-sm">
                        {averageRatings[hotel._id]?.average ? (
                          <>
                            <span className="text-white bg-blue-600 px-2 py-1 rounded-md text-sm font-medium">
                              {averageRatings[hotel._id].average.toFixed(1)}
                            </span>
                            <span className="ml-2 text-gray-500">
                              ({averageRatings[hotel._id].totalReviews} đánh giá)
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">Chưa có đánh giá</span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {hotel.amenities?.slice(0, 4).map((a, idx) => (
                          <Badge key={idx} bg="light" text="dark">
                            {a}
                          </Badge>
                        ))}
                      </div>

                      {/* Dịch vụ khách sạn */}
                      {hotel.services?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          {hotel.services.slice(0, 3).map((srv, i) => (
                            <span
                              key={i}
                              className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200"
                            >
                              {srv.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Giá thấp nhất */}
                      {hotel.lowestPrice > 0 && (
                        <div className="mt-3 text-right">
                          <p className="text-sm text-gray-500">Giá từ</p>
                          <p className="text-xl font-semibold text-[#0071c2]">
                            {hotel.lowestPrice.toLocaleString()} ₫ / đêm
                          </p>
                        </div>
                      )}

                    </div>

                    <div className="flex justify-end mt-4">
                      <button className="bg-[#003580] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );

};


export default RoomResults;
