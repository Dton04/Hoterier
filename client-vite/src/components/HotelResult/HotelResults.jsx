import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { toast } from "react-toastify";
import BookingForm from "../BookingForm";
import Banner from "../Banner";



import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Breadcrumb from "./components/Breadcrumb";
import FilterSidebar from "./components/FilterSidebar";
import MapModal from "./components/MapModal";
import HotelList from "./components/HotelList";
import ResultsHeader from "./components/ResultsHeader";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});


const HotelResults = () => {
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

  // // --- Helpers for Booking.com-like UI ---
  // const getRatingLabel = (avg) => {
  //   if (avg >= 9) return "Tuyệt hảo";
  //   if (avg >= 8) return "Tuyệt vời";
  //   if (avg >= 7) return "Rất tốt";
  //   if (avg >= 6) return "Dễ chịu";
  //   return "Khá";
  // };

  // const getScoreBg = (avg) => {
  //   if (avg >= 9) return "bg-[#003580]";
  //   if (avg >= 8) return "bg-[#4CAF50]";
  //   if (avg >= 7) return "bg-[#8BC34A]";
  //   return "bg-gray-400";
  // };

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
    fetchFavorites();
  }, []);



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regionFromQuery = params.get("region");
    const districtFromQuery = params.get("district");

    // Nếu không có query thì không set
    if (!regionFromQuery) return;

    setFilters((prev) => {
      let newRegion = decodeURIComponent(regionFromQuery);
      const newCity = decodeURIComponent(districtFromQuery || "");

      // Nếu region là ID → convert sang tên
      const regionObj = regions.find((r) => r._id === newRegion);
      if (regionObj) {
        newRegion = regionObj.name;
      }

      return {
        ...prev,
        region: newRegion,
        city: newCity,
      };
    });
  }, [location.search, regions]);



  // Khu vực
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
      const names = Array.isArray(data)
        ? data.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean)
        : [];
      setAmenities(names);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách tiện nghi:", err);
    }
  };


  // 🏨 Lấy danh sách khách sạn
  const fetchHotels = async () => {
    const searchParams = new URLSearchParams(location.search);
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

        // Lấy full detail cho từng khách sạn (có áp dụng giảm giá)
        const fullHotels = await Promise.all(
          data.hotels.map(async (h) => {
            const detail = await axios.get(`/api/hotels/${h._id}`, {
              params: { festivalId: festival },
            });
            return detail.data;
          })
        );

        let filtered = fullHotels;

        // filter region + city nếu có
        if (regionParam) {
          filtered = filtered.filter(
            (h) =>
              h.region?.name?.toLowerCase() === regionParam.toLowerCase() ||
              h.region?._id === regionParam
          );
        }
        if (cityParam) {
          filtered = filtered.filter((h) =>
            h.district?.toLowerCase().includes(cityParam.toLowerCase())
          );
        }

        // Add lowestPrice giống khách sạn thường
        hotelsWithExtras = await Promise.all(
          filtered.map(async (hotel) => {
            const lowestPrice = Math.min(
              ...hotel.rooms.map((r) => r.discountedPrice || r.rentperday)
            );

            const servicesRes = await axios.get(
              `/api/services?hotelId=${hotel._id}&isAvailable=true`
            );
            const services = servicesRes.data || [];

            return { ...hotel, lowestPrice, services };
          })
        );
      } else {
        setFestivalInfo(null);

        // Gọi API khách sạn bình thường
        const { data } = await axios.get(`/api/hotels`, {
          params: {
            region: regionParam || undefined,
            city: cityParam || undefined,
          },
        });

        // Lấy service + lowestPrice giống festival
        hotelsWithExtras = await Promise.all(
          data.map(async (hotel) => {
            const servicesRes = await axios.get(
              `/api/services?hotelId=${hotel._id}&isAvailable=true`
            );
            const services = servicesRes.data || [];

            const lowestPrice = hotel.rooms?.length
              ? Math.min(...hotel.rooms.map((r) => r.rentperday))
              : 0;

            return { ...hotel, services, lowestPrice };
          })
        );
      }




      const adults = Number(searchParams.get("adults") || 1);
      const children = Number(searchParams.get("children") || 0);
      const totalGuests = adults + children;

      hotelsWithExtras = hotelsWithExtras.map((hotel) => {
        const alloc = autoAllocateRooms(hotel.rooms, totalGuests);
        return {
          ...hotel,
          autoAllocation: alloc.allocation,
          allocationSuccess: alloc.success,
          guestRemaining: alloc.remaining
        };
      });


      setHotels(hotelsWithExtras);
      await fetchAverageRatings(hotelsWithExtras);
    } catch (err) {
      console.error("Lỗi khi lấy khách sạn:", err);
    } finally {
      setLoading(false);
    }
  };

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



  //  Lấy điểm đánh giá trung bình từng khách sạn
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


  // Bộ lọc thực tế
  const filteredHotels = useMemo(() => {
    return hotels
      .filter((hotel) => {
        const avg = averageRatings[hotel._id]?.average || 0;
        const priceMin = Math.min(...hotel.rooms.map((r) => r.rentperday));
        const priceMax = Math.max(...hotel.rooms.map((r) => r.rentperday));

        const matchRegion = filters.region
          ? (
            hotel.region?._id?.toString() === filters.region ||
            hotel.region?.name?.toLowerCase() === filters.region.toLowerCase()
          )
          : true;



        const matchDistrict = filters.city
          ? hotel.district?.toLowerCase().includes(filters.city.toLowerCase())
          : true;



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
              r.amenities?.some((am) => {
                const amName = typeof am === "string" ? am : am?.name;
                return amName?.toLowerCase().includes(a.toLowerCase());
              })
            )
          );

        return (
          matchRegion &&
          matchDistrict &&
          matchRating &&
          matchPrice &&
          matchStars &&
          matchService &&
          matchAmenity
        );
      })
      .sort((a, b) => {
        if (sortBy === "priceLow") return a.lowestPrice - b.lowestPrice;
        if (sortBy === "priceHigh") return b.lowestPrice - a.lowestPrice;
        if (sortBy === "rating")
          return (averageRatings[b._id]?.average || 0) - (averageRatings[a._id]?.average || 0);
        return 0;
      });
  }, [hotels, filters, sortBy, averageRatings]);


  // Reset filters
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


  // 🔹 AUTO ALLOCATION giống Booking.com
  const autoAllocateRooms = (rooms, totalGuests) => {
    const sorted = [...rooms].sort((a, b) => b.maxcount - a.maxcount);

    let remain = totalGuests;
    const result = [];

    for (const room of sorted) {
      if (remain <= 0) break;

      const fit = room.maxcount;
      const needed = Math.ceil(remain / fit);

      const canBook = Math.min(needed, room.quantity);

      if (canBook > 0) {
        result.push({
          roomid: room._id,
          name: room.name,
          roomType: room.type,
          maxcount: room.maxcount,
          roomsBooked: canBook,
          rentperday: room.rentperday,
        });
        remain -= canBook * fit;
      }
    }

    return {
      success: remain <= 0,
      allocation: result,
      remaining: remain,
    };
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


      <Breadcrumb filters={filters} setFilters={setFilters} />




      {/*  Kết quả tìm kiếm */}
      <section className="bg-gray-50 sm:py-10 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-0">


          {/* SIDEBAR LỌC */}
          <FilterSidebar
            regions={regions}
            services={services}
            amenities={amenities}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            filteredHotels={filteredHotels}
            showAllRegions={showAllRegions}
            setShowAllRegions={setShowAllRegions}
            navigate={navigate}
            setShowMapModal={setShowMapModal}
          />


          {/* RESULTS */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header */}

            <ResultsHeader
              filteredHotels={filteredHotels}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />


            <HotelList
              loading={loading}
              filteredHotels={filteredHotels}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              averageRatings={averageRatings}
              festivalInfo={festivalInfo}
              navigate={navigate}
            />


          </div>
        </div>
      </section>

      {showMapModal && (
        <MapModal
          hotels={filteredHotels}
          onClose={() => setShowMapModal(false)}
          navigate={navigate}
        />
      )}

    </>
  );

};


export default HotelResults;