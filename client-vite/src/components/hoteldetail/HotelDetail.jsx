import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { MapPin, Star, Image } from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import RoomsTab from "./tabs/RoomsTab";
import AmenitiesTab from "./tabs/AmenitiesTab";
import ReviewsTab from "./tabs/ReviewsTab";
import DiscountTab from "./tabs/DiscountTab";
import Banner from "../Banner";
import BookingForm from "../BookingForm";
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

  const roomsRef = useRef(null);
  const reviewsRef = useRef(null);

  const [loading, setLoading] = useState(true);
  

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
          axios.get(`/api/hotels/${id}/rooms`),
          axios.get(`/api/amenities`),
          axios.get(`/api/services/hotel/${id}`),
          axios.get(`/api/reviews?hotelId=${id}`),
          axios.get(`/api/reviews/average?hotelId=${id}`),
          axios.get(`/api/discounts`),
        ]);

        setHotel(hotelRes.data.hotel);
        setRooms(hotelRes.data.rooms);
        setAmenities(amenityRes.data);
        setServices(serviceRes.data);
        setReviews(reviewRes.data.reviews);
        setAverage(avgRes.data.average);
        setDiscounts(discountRes.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        
      }finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader message="Đang tải dữ liệu.."/>
  }

  return (
<>
    
     {/* ==== BANNER & BOOKING FORM ==== */}
    <div className="relative w-full -mt-[280px] sm:-mt-[290px]">
      <Banner />

      {/* BookingForm (Desktop & Tablet) */}
      <div
        className="
          hidden sm:block
          absolute left-1/2 -translate-x-1/2 bottom-[-50px] 
          w-full max-w-5xl px-4 sm:px-6
          z-30
        "
      >
        <BookingForm />
      </div>
    </div>

    {/* BookingForm (Mobile Only) */}
    <div className="block sm:hidden mt-4 px-4 relative z-20">
      <BookingForm />
    </div>



    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 mt-10">
      
      {/* ======= THANH MỤC LỤC ======= */}
      <nav className="sticky top-0 z-40 bg-white shadow-sm border-t mt-10  ">
        <ul className="flex  gap-8 text-sm font-medium text-gray-700 py-3">
          <li>
            <button
              onClick={() =>
                document
                  .getElementById("overview")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600"
            >
              Tổng quan
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                document
                  .getElementById("rooms")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600"
            >
              Thông tin & Giá
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                document
                  .getElementById("amenities")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600"
            >
              Tiện nghi
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                document
                  .getElementById("rules")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600"
            >
              Quy tắc chung
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                document
                  .getElementById("reviews")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600"
            >
              Đánh giá
            </button>
          </li>
        </ul>
      </nav>

      {/* ======= TỔNG QUAN ======= */}
      <section id="overview" className="grid lg:grid-cols-3 gap-6">
        {/* BÊN TRÁI: ảnh + mô tả */}
        <div className="lg:col-span-2 space-y-4 relative">
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
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            <p className="text-gray-600 flex items-center gap-2 mb-2">
              <MapPin size={18} /> {hotel.address}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-yellow-500" />
              <span className="font-medium">
                {average.toFixed(1)} / 5 ({reviews.length} đánh giá)
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed max-w-[90%]">
              {hotel.description}
            </p>
          </div>
        </div>

        {/* BÊN PHẢI: đánh giá + bản đồ */}
        <div className="lg:col-span-1">
          <OverviewTab hotel={hotel} average={average} reviews={reviews} />
        </div>
      </section>
       {/* ======= TIỆN NGHI ======= */}
      <section id="amenities">
        <AmenitiesTab amenities={amenities} services={services} />
      </section>

      {/* ======= THÔNG TIN & GIÁ ======= */}
      <section id="rooms" ref={roomsRef}>
        <RoomsTab
          rooms={rooms}
          onRoomSelected={() => {
            setShowReviews(true);
            reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

     

      {/* ======= QUY TẮC ======= */}
      <section id="rules">
        <h2 className="text-2xl font-semibold mb-3">Quy tắc chung</h2>
        <p className="text-gray-700">
          {hotel.rules || "Khách sạn chưa cập nhật quy tắc chung."}
        </p>
      </section>

      {/* ======= ƯU ĐÃI ======= */}
      <DiscountTab discounts={discounts} />

      {/* ======= ĐÁNH GIÁ ======= */}
      <section id="reviews" ref={reviewsRef}>
  <ReviewsTab reviews={reviews} average={average} />
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
