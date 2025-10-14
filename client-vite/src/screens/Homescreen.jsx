import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import RoomsContent from "../components/RoomsContent";
import AlertMessage from "../components/AlertMessage";

function Homescreen() {
  const [bookingStatus, setBookingStatus] = useState(null);
  const [regions, setRegions] = useState([]);
  const [stats, setStats] = useState({
    rooms: 150,
    customers: 1200,
    rating: 4.8,
    awards: 12,
  });
  const [festivalDiscounts, setFestivalDiscounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/discounts/festival")
      .then((res) => res.json())
      .then((data) => setFestivalDiscounts(data))
      .catch((err) => console.error("Error loading festival discounts:", err));
  }, []);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch((err) => console.error("Error loading regions:", err));
  }, []);

  const handleBookingStatus = (status) => setBookingStatus(status);
  const handleCloseAlert = () => setBookingStatus(null);

  return (

    <div className="font-outfit bg-gray-50 text-gray-800">
      <AlertMessage
        type={bookingStatus?.type}
        message={bookingStatus?.message}
        onClose={handleCloseAlert}
      />

      <Banner />


      {/* Booking Section - Chuẩn Booking.com */}
      <section className="relative z-30 flex justify-center -mt-4 mb-16">
        <div
          className="
      bg-white w-full max-w-6xl 
       rounded-lg
      shadow-[0_2px_6px_rgba(0,0,0,0.15)]
      
      flex justify-center
    "
        >
          <BookingForm onBookingStatus={handleBookingStatus} />
        </div>
      </section>


      {/* Festival Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="uppercase tracking-widest text-blue-600 font-semibold flex justify-center items-center">
              <span className="w-12 h-0.5 bg-blue-600 mx-3"></span> ƯU ĐÃI LỄ HỘI{" "}
              <span className="w-12 h-0.5 bg-blue-600 mx-3"></span>
            </h2>
            <h1 className="text-3xl font-playfair font-bold text-gray-800">
              Không khí lễ hội - <span className="text-pink-500">Ưu đãi tuyệt vời!</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mt-3">
              Khám phá những ưu đãi độc quyền trong mùa lễ hội — tiết kiệm đến{" "}
              <strong>50%</strong> cho các điểm đến nổi bật!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {festivalDiscounts.map((festival) => (
              <div
                key={festival._id}
                onClick={() => navigate(`/festival/${festival._id}`)}
                className="cursor-pointer bg-white rounded-2xl shadow-md overflow-hidden transform hover:scale-[1.03] transition"
              >
                <div className="relative">
                  <img
                    src={festival.image || "/default-festival.jpg"}
                    alt={festival.name}
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-pink-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                    Giảm {festival.discountValue}%
                  </div>
                </div>
                <div className="text-center p-5">
                  <h5 className="text-lg font-semibold">{festival.name}</h5>
                  <p className="text-gray-500 text-sm mt-2 mb-3">
                    {festival.description?.slice(0, 60) ||
                      "Khám phá các ưu đãi độc quyền mùa lễ hội."}
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition">
                    Khám phá ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="uppercase tracking-widest text-amber-600 font-semibold flex items-center justify-center">
              <span className="w-10 h-0.5 bg-amber-600 mx-3"></span>
              ĐỊA ĐIỂM ĐẸP
              <span className="w-10 h-0.5 bg-amber-600 mx-3"></span>
            </h2>
            <h1 className="text-4xl font-playfair font-bold">
              Khám phá <span className="text-amber-600">VIỆT NAM</span>
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regions.map((region, index) => (
              <div
                key={region._id}
                className="rounded-2xl overflow-hidden shadow-lg transform hover:-translate-y-2 transition"
              >
                <div className="relative">
                  <img
                    src={region.imageUrl || `/images/region-${index + 1}.jpg`}
                    alt={region.name}
                    className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end pb-6 text-white">
                    <h3 className="text-lg font-semibold">{region.name}</h3>
                    <Link
                      to={`/room-results?destination=${region._id}`}
                      className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-full transition"
                    >
                      Khám phá
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Stats Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white shadow-md rounded-xl p-6 hover:-translate-y-2 transition">
            <div className="text-3xl font-bold text-amber-600">{stats.rooms}+</div>
            <div className="text-gray-500 mt-2">Luxury Rooms</div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 hover:-translate-y-2 transition">
            <div className="text-3xl font-bold text-amber-600">{stats.customers}+</div>
            <div className="text-gray-500 mt-2">Happy Customers</div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 hover:-translate-y-2 transition">
            <div className="text-3xl font-bold text-amber-600">{stats.rating}</div>
            <div className="text-gray-500 mt-2">Average Rating</div>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 hover:-translate-y-2 transition">
            <div className="text-3xl font-bold text-amber-600">{stats.awards}</div>
            <div className="text-gray-500 mt-2">Awards Won</div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20 bg-white">
        <div className="text-center mb-10">
          <h2 className="uppercase tracking-widest text-amber-600 font-semibold flex items-center justify-center">
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span> PHÒNG NỔI BẬT{" "}
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span>
          </h2>
          <h1 className="text-4xl font-playfair font-bold">
            Trải nghiệm <span className="text-amber-600">ĐẲNG CẤP</span>
          </h1>
        </div>
        <RoomsContent />
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="uppercase tracking-widest text-amber-600 font-semibold flex items-center justify-center">
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span> LIÊN HỆ{" "}
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span>
          </h2>
          <h1 className="text-3xl font-playfair font-bold mt-2">Đặt phòng ngay</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { icon: "fa-phone", title: "Điện thoại", text: "+84 123 456 789" },
              { icon: "fa-envelope", title: "Email", text: "info@hotelier.com" },
              { icon: "fa-map-marker-alt", title: "Địa chỉ", text: "123 Đường ABC, TP XYZ" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md p-8 hover:-translate-y-2 transition"
              >
                <i className={`fas ${item.icon} text-3xl text-amber-600 mb-4`}></i>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/contact"
              className="inline-block bg-transparent border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white px-8 py-3 rounded-full transition"
            >
              Liên hệ ngay
            </Link>
          </div>
        </div>
      </section>
    </div>

  );
}

export default Homescreen;
