import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { MapPin, Star, Image } from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import RoomsTab from "./tabs/RoomsTab";
import AmenitiesTab from "./tabs/AmenitiesTab";
import ReviewsTab from "./tabs/ReviewsTab";
import DiscountTab from "./tabs/DiscountTab";
import RulesTab from "./tabs/RulesTab";
import Banner from "../Banner";
import BookingForm from "../BookingForm";
import ServicesTab from "./tabs/ServicesTab";
import HeaderTab from "./tabs/HeaderTab"
import HotelHighlights from "./tabs/HotelHighlights";
import { getSuggestedRoomCombos } from "./components/SuggestedRoomCombos";
import BookingRecommendation from "./tabs/BookingRecommendation";

import Loader from "../Loader";


export default function HotelDetail() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [discounts, setDiscounts] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showMoreDesc, setShowMoreDesc] = useState(false);

  const roomsRef = useRef(null);
  const reviewsRef = useRef(null);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("overview");

  const [searchParams] = useSearchParams();
  const festivalId = searchParams.get("festivalId");



  const autoAllocateRooms = (rooms, totalGuests) => {
    if (!rooms?.length) return null;

    const available = rooms.filter(r => r.availabilityStatus === "available");
    if (!available.length) return null;

    // Sort giảm dần theo sức chứa
    const sorted = [...available].sort((a, b) => b.maxcount - a.maxcount);

    let remaining = totalGuests;
    const allocation = [];

    for (const room of sorted) {
      if (remaining <= 0) break;

      const cap = room.maxcount;

      // số phòng loại này cần
      const need = Math.ceil(remaining / cap);
      const canUse = Math.min(need, room.quantity);

      if (canUse > 0) {
        allocation.push({
          ...room,
          count: canUse
        });

        remaining -= cap * canUse;
      }
    }

    return {
      success: remaining <= 0,
      allocation,
      remaining
    };
  };


  const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo")) || {};
  const storedAdults = Number(bookingInfo.adults) || 1;
  const storedChildren = Number(bookingInfo.children) || 0;
  const roomsNeeded = Number(bookingInfo.rooms) || 1;
  const totalGuests = storedAdults + storedChildren;
  const allocationResult = autoAllocateRooms(rooms, totalGuests);







  const handleSelectSuggestedCombo = (combo) => {
    // reset bảng phòng
    window.dispatchEvent(new Event("reset-room-selection"));

    combo.forEach(room => {
      window.dispatchEvent(new CustomEvent("auto-select-room", {
        detail: { roomId: room._id }
      }));
    });

    document.getElementById("rooms-table")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };










  useEffect(() => {
    const sections = ["overview", "rooms", "amenities", "rules", "reviews"];
    const handleScroll = () => {
      const scrollY = window.scrollY + 100;
      for (let id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY && el.offsetTop + el.offsetHeight > scrollY) {
          setActiveTab(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    async function fetchData() {
      try {
        const [
          hotelRes,
          amenityRes,
          serviceRes,
          reviewRes,
          avgRes,
          discountRes,
        ] = await Promise.all([
          axios.get(`/api/hotels/${id}`, {
            params: { festivalId },
          }),

          axios.get(`/api/amenities`),
          axios.get(`/api/services/hotel/${id}`),
          axios.get(`/api/reviews?hotelId=${id}`),
          axios.get(`/api/reviews/average?hotelId=${id}`),
          axios.get(`/api/discounts`),
        ]);

        setHotel(hotelRes.data.hotel || hotelRes.data);
        setRooms(hotelRes.data.rooms || []);
        const amenityNames = Array.isArray(amenityRes.data)
          ? amenityRes.data.map((a) => (typeof a === "string" ? a : a?.name)).filter(Boolean)
          : [];
        setAmenities(amenityNames);
        setServices(serviceRes.data);
        setReviews(reviewRes.data.reviews);
        setAverage(avgRes.data.average);
        setDiscounts(discountRes.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);

      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader message="Đang tải dữ liệu.." />
  }

  return (
    <>


      {/* ======= PANEL HIỂN THỊ REVIEW CHI TIẾT ======= */}
      {showReviews && (
        <div className="fixed inset-0 z-[1000] flex">
          {/* Lớp phủ mờ bên trái */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReviews(false)}
          ></div>

          {/* Panel nửa màn hình bên phải */}
          <div className="w-full sm:w-[55%] md:w-[50%] lg:w-[55%] bg-white shadow-2xl h-full overflow-y-auto animate-slide-left relative">
            <button
              onClick={() => setShowReviews(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl"
            >
              ✕
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#003580] mb-4">
                Đánh giá từ khách hàng
              </h2>
              <ReviewsTab hotel={hotel} reviews={reviews} average={average} />
            </div>
          </div>
        </div>
      )}


      {/* ==== BANNER & BOOKING FORM ==== */}

      <div className="relative w-full -mt-[280px] sm:-mt-[330px]">
        <Banner />


        {/* BookingForm (Desktop & Tablet) */}
        <div
          className="
  hidden sm:block
  absolute left-1/2 -translate-x-1/2 bottom-[-30px] 
  w-full max-w-6xl px-4 sm:px-6
  z-[60]
"
        >
          <BookingForm />
        </div>

      </div>
      <div className="p-5">
        <HeaderTab hotel={hotel} />
      </div>


      {/* BookingForm (Mobile Only) */}
      <div className="block sm:hidden mt-4 px-4 relative z-20">
        <BookingForm />
      </div>

      <div className="max-w-6xl mx-auto  space-y-10 ">

        {/* ======= THANH MỤC LỤC ======= */}

        <nav className="relative top-0 z-40 border-b shadow-sm w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex overflow-x-auto no-scrollbar gap-12 text-[17px] font-medium text-gray-700 whitespace-nowrap justify-start sm:justify-center">
              {[
                { id: "overview", label: "Tổng quan" },
                { id: "rooms", label: "Thông tin & Giá" },
                { id: "amenities", label: "Tiện nghi" },
                { id: "rules", label: "Quy tắc chung" },
                { id: "reviews", label: "Đánh giá" },
              ].map((tab) => (
                <li key={tab.id} className="relative py-3 group px-4">
                  <button
                    onClick={() => {
                      setActiveTab(tab.id);
                      document
                        .getElementById(tab.id)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`transition-colors ${activeTab === tab.id
                      ? "text-[#003580] font-semibold"
                      : "text-gray-700 hover:text-[#003580]"
                      }`}
                  >
                    {tab.label}
                  </button>

                  {activeTab === tab.id && (
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[120%] h-[4px] bg-[#0071c2] rounded-md transition-all duration-300" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>




        {/* ======= TỔNG QUAN ======= */}
        <section id="overview" className="grid lg:grid-cols-3 gap-6">
          {/* BÊN TRÁI: ảnh + mô tả */}

          <div className="lg:col-span-2 space-y-4 relative">
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            <p className="text-gray-600 flex items-center gap-2 mb-2">
              <MapPin size={18} /> {hotel.address}
            </p>

            {/* Ảnh khách sạn */}
            <div className="grid grid-cols-3 gap-3 relative">
              <img
                src={hotel.imageurls?.[0]}
                alt={hotel.name}
                className="col-span-3 rounded-xl w-full h-80 object-cover"
              />
              {hotel.imageurls?.slice(1, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="rounded-lg h-28 object-cover w-full"
                />
              ))}

              {/* Nút mở toàn bộ ảnh */}
              {hotel.imageurls?.length > 4 && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="absolute bottom-3 right-3 bg-black/60 text-white px-4 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-black/80"
                >
                  <Image size={16} /> +{hotel.imageurls.length - 4} ảnh
                </button>
              )}
            </div>



            {/* Giới thiệu */}
            <div>

              {/* Description with show more */}
              <div className="text-gray-700 leading-relaxed max-w-full">
                {hotel.description && hotel.description.length > 400 ? (
                  <>
                    <p>
                      {showMoreDesc
                        ? hotel.description
                        : `${hotel.description.slice(0, 400).trim()}...`}
                    </p>
                    <button
                      onClick={() => setShowMoreDesc((s) => !s)}
                      className="mt-2 text-blue-600 hover:underline text-sm"
                    >
                      {showMoreDesc ? "Thu gọn" : "Xem thêm"}
                    </button>
                  </>
                ) : (
                  <p>{hotel.description}</p>
                )}
              </div>
              {/* ======= TIỆN NGHI ======= */}
              <section id="amenities">
                <ServicesTab services={services} amenities={amenities} />

              </section>
            </div>
          </div>

          {/* BÊN PHẢI: Fánh giá + bản đồ */}
          <div className="lg:col-span-1">
            <OverviewTab
              hotel={hotel}
              average={average}
              reviews={reviews}
              onShowReviews={() => setShowReviews(true)}
            />

            <div className="mt-6">
              <HotelHighlights hotel={hotel} />
            </div>


          </div>

        </section>

        {/* ===== GỢI Ý PHÒNG THEO SỐ KHÁCH ===== */}
        {allocationResult && allocationResult.success && (
          <BookingRecommendation
            combo={allocationResult.allocation}
            totalGuests={totalGuests}
            onSelect={(combo) => handleSelectSuggestedCombo(combo)}
          />
        )}

        {allocationResult && !allocationResult.success && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg my-4">
            <p className="text-red-600 font-semibold">
              ❌ Khách sạn không đủ phòng cho {totalGuests} khách.
            </p>
            <p className="text-sm text-gray-600">
              Còn thiếu <b>{allocationResult.remaining}</b> khách.
            </p>
          </div>
        )}




        {/* ======= THÔNG TIN & GIÁ ======= */}
        <section id="rooms" ref={roomsRef}>
          <RoomsTab
            rooms={rooms}
            hotel={hotel}
            amenities={amenities}
            onRoomSelected={() => {
              setShowReviews(true);
              reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>



        {/* ======= QUY TẮC ======= */}
        <section id="rules">
          {/* use RulesTab component for nicer layout */}
          <RulesTab hotel={hotel} />
        </section>

        {/* ======= ƯU ĐÃI ======= */}
        <DiscountTab discounts={discounts} />

        {/* ======= ĐÁNH GIÁ ======= */}
        <section id="reviews" ref={reviewsRef}>
          <ReviewsTab hotel={hotel} reviews={reviews} average={average} />
        </section>


        {/* ======= MODAL ẢNH ======= */}
        {showAllImages && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-lg p-4 max-w-5xl w-full overflow-y-auto max-h-[90vh] relative">
              <button
                onClick={() => setShowAllImages(false)}
                className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded"
              >
                Đóng
              </button>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
                {hotel.imageurls.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="rounded-md object-cover w-full h-48"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
