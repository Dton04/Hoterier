import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { FaHeart, FaRegHeart } from "react-icons/fa";

import { Badge, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import BookingForm from "./BookingForm";
import Banner from "./Banner";
import Loader from "../components/Loader";

import HotelCard from "../components/HotelResult/components/HotelCard";


import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});


const RoomResults = ({ rooms = [] }) => {
  const [hotels, setHotels] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const [regions, setRegions] = useState([]);
  const [services, setServices] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [averageRatings, setAverageRatings] = useState({});

  const [festivalInfo, setFestivalInfo] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showAllRegions, setShowAllRegions] = useState(false);

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
  const [showMapModal, setShowMapModal] = useState(false);

  const navigate = useNavigate();

  // --- Helpers for Booking.com-like UI ---
  const getRatingLabel = (avg) => {
    if (avg >= 9) return "Tuyệt hảo";
    if (avg >= 8) return "Tuyệt vời";
    if (avg >= 7) return "Rất tốt";
    if (avg >= 6) return "Dễ chịu";
    return "Khá";
  };

  const getScoreBg = (avg) => {
    if (avg >= 9) return "bg-[#003580]";
    if (avg >= 8) return "bg-[#4CAF50]";
    if (avg >= 7) return "bg-[#8BC34A]";
    return "bg-gray-400";
  };

  // Kéo lên dầu trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.search]);
  // 📦 Lấy dữ liệu ban đầu
  useEffect(() => {
    fetchRegions();
    fetchServices();
    fetchAmenities();
    fetchHotels();
  }, [location.search]);


  useEffect(() => {
    if (userInfo) {
      fetchFavorites();
    }
  }, [userInfo]);

  // 🧭 Nhận region và district từ URL query (ví dụ: /hotel-results?region=Hồ%20Chí%20Minh&district=Quận%201)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regionFromQuery = params.get("region");
    const districtFromQuery = params.get("district");

<<<<<<< HEAD
    if (regionFromQuery) {
      setFilters((prev) => ({
        ...prev,
        region: regionFromQuery,
        city: districtFromQuery || "",
      }));
=======
    if (destination) {
      setFilters((prev) => ({ ...prev, region: destination }));
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
    }
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
<<<<<<< HEAD
    const festival = searchParams.get("festival");

    // ✅ Lấy region + city từ filters (separate selects)
    const regionParam = filters.region || ""; // region id or name
    const cityParam = filters.city || "";

    setLoading(true);
    try {
      let hotelsWithExtras = [];

      if (festival) {
        const { data } = await axios.get(`/api/discounts/${festival}/festival-hotels`);
        setFestivalInfo(data.festival);

        let filtered = data.hotels;
        if (regionParam) {
          const isIdLike = /^[0-9a-fA-F]{24}$/.test(regionParam);
          if (isIdLike) {
            filtered = filtered.filter(
              (h) =>
                h.region &&
                (h.region._id?.toString() === regionParam || h.region === regionParam)
            );
          } else {
            filtered = filtered.filter(
              (h) =>
                h.regionName === regionParam || h.region?.name === regionParam
            );
          }
        }
        if (cityParam) filtered = filtered.filter((h) => h.city === cityParam);

        hotelsWithExtras = filtered.map((hotel) => {
          const lowestPrice = Math.min(...hotel.rooms.map((r) => r.discountedPrice || r.rentperday));
          return { ...hotel, lowestPrice };
        });
      } else {
        setFestivalInfo(null);
        // ✅ Gọi API BE có query region + city (region may be id or name)
        const { data } = await axios.get(`/api/hotels`, {
          params: { region: regionParam || undefined, district: cityParam || undefined },
        });

        hotelsWithExtras = await Promise.all(
          data.map(async (hotel) => {
            const servicesRes = await axios.get(`/api/services?hotelId=${hotel._id}&isAvailable=true`);
=======
    const destination = searchParams.get("destination");
    const festival = searchParams.get("festival");

    setLoading(true);
    try {
      let hotelsWithExtras = [];

      if (festival) {
        // Nếu có ưu đãi lễ hội
        const { data } = await axios.get(`/api/discounts/${festival}/festival-hotels`);
        let filtered = data.hotels;

        if (destination) {
          filtered = filtered.filter(
            (hotel) => hotel.region?._id === destination
          );
        }

        hotelsWithExtras = filtered.map((hotel) => {
          const lowestPrice = Math.min(
            ...hotel.rooms.map((r) => r.discountedPrice)
          );
          return { ...hotel, lowestPrice };
        });
      } else {
        // Nếu không có festival
        const { data } = await axios.get("/api/hotels");
        const filtered = destination
          ? data.filter((hotel) => hotel.region?._id === destination)
          : data;

        hotelsWithExtras = await Promise.all(
          filtered.map(async (hotel) => {
            const servicesRes = await axios.get(
              `/api/services?hotelId=${hotel._id}&isAvailable=true`
            );
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
            const services = servicesRes.data || [];
            const lowestPrice = hotel.rooms?.length
              ? Math.min(...hotel.rooms.map((r) => r.rentperday))
              : 0;
            return { ...hotel, services, lowestPrice };
          })
        );
      }

<<<<<<< HEAD
=======

>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
      setHotels(hotelsWithExtras);
      await fetchAverageRatings(hotelsWithExtras);
    } catch (err) {
      console.error("Lỗi khi lấy khách sạn:", err);
    } finally {
      setLoading(false);
    }
  };
<<<<<<< HEAD




=======
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1

  //Lưu khách sạn
  const fetchFavorites = async () => {
    if (!userInfo) return;
    try {
      const { data } = await axios.get("/api/favorites", {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setFavorites(data.map((f) => f._id));
    } catch (err) {
      console.error("Lỗi khi lấy danh sách yêu thích:", err);
    }
  };

  const toggleFavorite = async (hotelId) => {
    if (!userInfo) {
      toast.info("Vui lòng đăng nhập để lưu khách sạn yêu thích");
      return;
    }

    const isFav = favorites.includes(hotelId);
    try {
      if (isFav) {
        await axios.delete(`/api/favorites/${hotelId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setFavorites(favorites.filter((id) => id !== hotelId));
        toast.info("Đã xóa khỏi yêu thích");
      } else {
        await axios.post(
          "/api/favorites",
          { hotelId },
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        setFavorites([...favorites, hotelId]);
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (err) {
      console.error("Lỗi khi thêm yêu thích:", err);
    }
  };



  // ⭐ Lấy điểm đánh giá trung bình từng khách sạn
  const fetchAverageRatings = async (hotelList) => {
    if (!hotelList || hotelList.length === 0) return;
    try {
      const ratings = {};
      await Promise.all(
        hotelList.map(async (hotel) => {
          const { data } = await axios.get("/api/reviews/average", {
            params: { hotelId: hotel._id },
          });
          ratings[hotel._id] = {
            average: data.average || 0,
            totalReviews: data.totalReviews || 0,
          };
        })
      );
      setAverageRatings(ratings);
    } catch (err) {
      console.error("❌ Lỗi khi lấy điểm đánh giá:", err);
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
      {/* ==== BANNER + BOOKING FORM ==== */}
      <div className="relative w-full -mt-[260px] sm:-mt-[330px]">
        <Banner />

        {/* BookingForm nổi ở desktop */}
        <div
          className="
          hidden sm:block
          absolute left-1/2 -translate-x-1/2 bottom-[-30px]
          w-full max-w-6xl px-4 z-30
        "
        >
          <BookingForm />
        </div>
      </div>

      {/* BookingForm riêng cho mobile */}
      <div className="block sm:hidden px-4 relative z-20 ">
        <BookingForm />
      </div>



      {/* 🧭 Breadcrumb giống Booking.com */}
      <div className="max-w-6xl mx-auto px-4 mt-10 text-sm text-gray-600 ">
        <nav className="flex flex-wrap items-center gap-1 ">
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer hover:underline text-[#0071c2]"
          >
            Trang chủ
          </span>
          <span className="mx-1">›</span>

          <span
            onClick={() => navigate("/hotel-results")}
            className="cursor-pointer hover:underline text-[#0071c2]"
          >
            Việt Nam
          </span>

          {filters.region && (
            <>
              <span className="mx-1">›</span>
              <span
                onClick={() =>
                  navigate(`/hotel-results?region=${encodeURIComponent(filters.region)}`)
                }
                className="cursor-pointer hover:underline text-[#0071c2]"
              >
                {filters.region}
              </span>
            </>
          )}

          {filters.city && (
            <>
              <span className="mx-1">›</span>
              <span
                onClick={() =>
                  navigate(
                    `/hotel-results?region=${encodeURIComponent(filters.region)}&district=${encodeURIComponent(filters.city)}`
                  )
                }
                className="cursor-pointer hover:underline text-[#0071c2]"
              >
                {filters.city}
              </span>
            </>
          )}
        </nav>

        {/* Tiêu đề trang kết quả
        <h2 className="text-2xl font-semibold text-[#003580] mt-2">
          {filters.city
            ? `Khách sạn tại ${filters.city}, ${filters.region}`
            : filters.region
              ? `Khách sạn khu vực ${filters.region}`
              : "Tất cả khách sạn tại Việt Nam"}
        </h2> */}
      </div>






      {/* 🏨 Kết quả tìm kiếm */}
      <section className="bg-gray-50 sm:py-10 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">

          {/* SIDEBAR */}
<<<<<<< HEAD
          <aside className="hidden lg:block bg-white rounded-xl shadow-md sticky top-24 h-fit p-4 col-span-1 mr-4 w-[105%]">
            <h3 className="text-xl font-semibold text-[#003580] mb-4">
              Bộ lọc tìm kiếm
            </h3>
=======
          <aside className="hidden lg:block bg-white rounded-xl shadow-md h-fit p-4 col-span-1 mr-4 w-full">
          <h3 className="text-xl font-semibold text-[#003580] mb-4">
            Bộ lọc tìm kiếm
          </h3>
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1

            {/* 🗺️ Bản đồ khu vực */}
            <div className="border-b pb-4 mb-4">

              <div className="h-60 w-full rounded-lg overflow-hidden relative border">
                <MapContainer
                  center={[10.7769, 106.7009]}
                  zoom={12}
                  scrollWheelZoom={false}
                  className="h-full w-full z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  />
                  {filteredHotels
                    .filter((h) => h.latitude && h.longitude)
                    .map((h, i) => (
                      <Marker key={i} position={[h.latitude, h.longitude]}>
                        <Popup>
                          <strong>{h.name}</strong>
                          <br />
                          {h.address}
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>

                <button
                  onClick={() => setShowMapModal(true)}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-[#0071c2] hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-md transition mb-5"
                >
                  Hiển thị trên bản đồ
                </button>
              </div>
            </div>

            {/* 🌍 Điểm đến hàng đầu ở Việt Nam */}
            <div className="border-b pb-4 mb-5">
              <h4 className="text-gray-700 font-semibold mb-3 text-[15px]">
                Điểm đến hàng đầu ở Việt Nam
              </h4>

<<<<<<< HEAD
              {regions.length === 0 ? (
                <p className="text-gray-500 text-sm">Đang tải...</p>
              ) : (
                <>
                  {/* Hiển thị tối đa 13 vùng, có thể mở rộng */}
                  {regions
                    .slice(0, showAllRegions ? regions.length : 13)
                    .map((region) => (
                      <label
                        key={region._id}
                        onClick={() =>
                          navigate(`/hotel-results?region=${encodeURIComponent(region.name)}`)
                        }
                        className="flex items-center space-x-2 cursor-pointer text-sm mb-1 hover:text-[#003580] transition"
                      >
                        <input
                          type="checkbox"
                          checked={filters.region === region.name}
                          onChange={() =>
                            setFilters({
                              ...filters,
                              region: region.name,
                              city: "",
                            })
                          }
                          className="accent-blue-600"
                        />
                        <span>{region.name}</span>
                      </label>
                    ))}

                  {/* Nút mở rộng / thu gọn */}
                  {regions.length > 13 && (
                    <button
                      onClick={() => setShowAllRegions((prev) => !prev)}
                      className="text-[#0071c2] text-sm mt-1 hover:underline"
                    >
                      {showAllRegions ? "Ẩn bớt" : `Hiển thị tất cả ${regions.length} loại`}
                    </button>
                  )}
                </>
              )}
=======


            {/* Region */}
            <div className="border-b pb-4 mb-4 ">
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
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
            </div>



            {/* 🏙️ Thành phố / Quận theo khu vực đã chọn */}
            {filters.region && (() => {
              const selected = regions.find((r) => r.name === filters.region);
              if (!selected?.cities?.length) return null;

              return (
                <div className="border-b pb-5 mb-5">
                  <h4 className="text-gray-700 font-semibold mb-3 text-[15px]">
                    Thành phố / Quận tại {selected.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.cities.map((c, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setFilters({ ...filters, city: c.name })
                        }
                        className={`text-xs sm:text-sm rounded-lg border p-2 transition-all duration-200 ${filters.city === c.name
                          ? "bg-[#0071c2] text-white border-[#0071c2]"
                          : "bg-gray-50 hover:bg-blue-50 border-gray-200 text-gray-700"
                          }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}



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



            <button
              onClick={resetFilters}
              className="w-full mt-5 bg-[#003580] text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition"
            >
              Đặt lại bộ lọc
            </button>
          </aside>

          {/* RESULTS */}
<<<<<<< HEAD
          <div className="lg:col-span-3 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
              <p className="text-gray-600 text-sm text-center sm:text-left">
                {filteredHotels.length} chỗ nghỉ phù hợp
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 text-gray-600 w-full sm:w-auto"
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
              <p className="text-gray-500 text-center py-8">Không tìm thấy khách sạn phù hợp.</p>
            ) : (
              filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel._id}
                  hotel={hotel}
                  isFavorite={favorites.includes(hotel._id)}
                  toggleFavorite={toggleFavorite}
                  ratingInfo={averageRatings[hotel._id] || { average: 0, totalReviews: 0 }}
                  discountInfo={
                    festivalInfo
                      ? {
                        discountType: festivalInfo.discountType,
                        discountValue: festivalInfo.discountValue,
                        type: festivalInfo.type,
                      }
                      : null
                  }
                  onSelect={(id) => navigate(`/hotel/${id}`)}
                />


              ))
            )}

          </div>
        </div>
      </section>

      {/* 🌍 Modal bản đồ toàn màn hình */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[95%] h-[90vh] relative shadow-2xl overflow-hidden">
            <button
              onClick={() => setShowMapModal(false)}
              className="absolute top-3 right-3 bg-white text-gray-600 hover:text-red-600 font-bold text-lg px-3 py-1 rounded-full shadow-md z-50"
            >
              ✕
            </button>

            <MapContainer
              center={[10.7769, 106.7009]}
              zoom={12}
              scrollWheelZoom
              className="h-full w-full z-40"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              />
              {filteredHotels
                .filter((h) => h.latitude && h.longitude)
                .map((h, i) => (
                  <Marker key={i} position={[h.latitude, h.longitude]}>
                    <Popup>
                      <strong>{h.name}</strong>
                      <br />
                      {h.address}
                      <br />
                      <span
                        className="text-[#0071c2] cursor-pointer"
                        onClick={() => navigate(`/hotel/${h._id}`)}
                      >
                        Xem chi tiết →
                      </span>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
=======
        <div className="lg:col-span-3 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
            <p className="text-gray-600 text-sm text-center sm:text-left">
              {filteredHotels.length} chỗ nghỉ phù hợp
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 text-gray-600 w-full sm:w-auto"
            >
              <option value="recommended">Đề xuất</option>
              <option value="priceLow">Giá thấp → cao</option>
              <option value="priceHigh">Giá cao → thấp</option>
              <option value="rating">Điểm đánh giá cao nhất</option>
            </select>
          </div>

          {/* Hiển thị kết quả */}
          {loading ? (
            <Loader message="Đang tải kết quả..." />
          ) : filteredHotels.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Không tìm thấy khách sạn phù hợp.
            </p>
          ) : (
            filteredHotels.map((hotel) => {
              const avg = averageRatings[hotel._id]?.average || 0;
              const label = avg ? getRatingLabel(avg) : null;

              return (
                <div
                  key={hotel._id}
                  onClick={() => navigate(`/hotel/${hotel._id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer flex flex-col md:flex-row"
                >
                  {/* Image + badges */}
                  <div className="relative md:w-1/3 h-52 sm:h-56 m-3 sm:m-4 overflow-hidden rounded-md">
                    <img
                      src={hotel.imageurls?.[0] || "/images/default-hotel.jpg"}
                      alt={hotel.name}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(hotel._id);
                      }}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                    >
                      {favorites.includes(hotel._id) ? (
                        <FaHeart className="text-red-500 text-lg scale-110" />
                      ) : (
                        <FaRegHeart className="text-gray-400 text-lg" />
                      )}
                    </button>
                  </div>

                  {/* Middle content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] sm:text-2xl font-semibold text-[#003580]">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center mt-0.5">
                        {[...Array(hotel.starRating)].map((_, i) => (
                          <FaStar key={i} className="text-yellow-400 text-xs sm:text-sm" />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-[#0071c2]">
                      {hotel.region?.name || "Việt Nam"} · <span className="underline">Xem trên bản đồ</span>
                    </div>
                    <p className="text-gray-600 text-sm">{hotel.address}</p>

                    {/* Room snippet */}
                    {hotel.rooms?.length > 0 && (
                      <div className="mt-2 text-[13px]">
                        {hotel.rooms.slice(0, 1).map((room, idx) => (
                          <div key={idx}>
                            <p className="font-semibold text-[#003580]">{room.name}</p>
                            <p className="text-gray-600 mt-1">
                              {room.beds ? `${room.beds} giường • ` : ""}
                              {room.baths ? `${room.baths} phòng tắm` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Perks like Booking.com */}
                    <ul className="mt-2 text-xs sm:text-sm text-green-700 space-y-1">
                      <li>✔ Miễn phí hủy</li>
                      <li>✔ Không cần thanh toán trước – thanh toán tại chỗ nghỉ</li>
                    </ul>
                  </div>

                  {/* Right column: score + price + CTA */}
                  <div className="flex flex-col justify-between items-end text-right min-w-[190px] sm:min-w-[240px] p-4 sm:p-5">
                    <div className="flex flex-col items-end">
                      {avg ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`${getScoreBg(avg)} text-white px-2 py-1 rounded-md font-semibold text-xs sm:text-sm`}>
                              {avg.toFixed(1)}
                            </span>
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">{label}</span>
                          </div>
                          <span className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                            {averageRatings[hotel._id]?.totalReviews || 0} đánh giá
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">Chưa có đánh giá</span>
                      )}
                    </div>

                    {hotel.lowestPrice > 0 && (
                      <div className="mt-2 text-right leading-tight">
                        <p className="text-[12px] text-gray-600">1 đêm · 2 người lớn</p>
                        <span className="block text-[#0071c2] text-2xl sm:text-[26px] font-bold tracking-tight">
                          {hotel.lowestPrice.toLocaleString()} ₫
                        </span>
                        <p className="text-[11px] sm:text-[11px] text-gray-500">+thuế và phí</p>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/hotel/${hotel._id}`)}
                      className="mt-3 bg-[#0071c2] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-blue-800 transition text-xs sm:text-sm"
                    >
                      Xem chỗ trống
                    </button>
                  </div>
                </div>
              );
            })
          )}
>>>>>>> 15a35d7cee00ef752fb9000ecd2fa3d5266bd1a1
        </div>
      )}
    </>
  );

};


export default RoomResults;