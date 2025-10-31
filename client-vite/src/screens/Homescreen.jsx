import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";

import AlertMessage from "../components/AlertMessage";
import VietnamDestinations from "./aboutHome/VietnamDestinations"
import vnFlag from "../assets/images/vietnam-flag.png";
import PromoCarousel from "./aboutHome/PromoCarousel";
import PopularDestinations from "./aboutHome/PopularDestinations";

function Homescreen() {
  const [user, setUser] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [regions, setRegions] = useState([]);
  const [festivalDiscounts, setFestivalDiscounts] = useState([]);


  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      const userData = userInfo.user || userInfo;
      setUser(userData);
    }
  }, []);

  // Fetch lễ hội
  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const res = await fetch("/api/discounts/festival");
        const data = await res.json();
        setFestivalDiscounts(data);
      } catch (err) {
        console.error("Error loading festival discounts:", err);
      }
    };
    fetchFestivals();
  }, []);

  // Fetch khu vực
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch("/api/regions");
        const data = await res.json();
        setRegions(data);
      } catch (err) {
        console.error("Error loading regions:", err);
      }
    };
    fetchRegions();
  }, []);

  const handleBookingStatus = (status) => setBookingStatus(status);
  const handleCloseAlert = () => setBookingStatus(null);

  return (
    <div className="font-outfit bg-gray-50 text-gray-800">
      {/* Alert */}
      <AlertMessage
        type={bookingStatus?.type}
        message={bookingStatus?.message}
        onClose={handleCloseAlert}
      />

      <div className="-mt-[70px]">
        <Banner />
      </div>

      {/* Booking Section */}
      <section className="relative z-30 flex justify-center -mt-4 mb-16">
        <div
          className="
            bg-white w-full max-w-6xl 
            rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.15)]
            flex justify-center
          "
        >
          <BookingForm onBookingStatus={handleBookingStatus} />
        </div>
      </section>

    <PromoCarousel festivalDiscounts={festivalDiscounts}/>


      {/* Điểm đến đang thịnh hành */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#003580] mb-3">
            Điểm đến đang thịnh hành
          </h2>
          <p className="text-gray-500 text-[15px] mb-8">
            Du khách tìm kiếm về Việt Nam cũng đặt chỗ ở những nơi này
          </p>

          {/* Grid: 2 ảnh to hàng đầu + 3 ảnh nhỏ hàng dưới */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* --- Hàng 1: 2 ảnh to --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
              {regions
                .filter((r) => ["Hà Nội", "Hồ Chí Minh"].includes(r.name))
                .slice(0, 2)
                .map((region, index) => (
                  <div
                    key={region._id}
                    className="relative overflow-hidden cursor-pointer group rounded-lg shadow-md hover:shadow-lg transition"
                    onClick={() => navigate(`/room-results?destination=${region._id}`)}
                  >
                    <img
                      src={region.imageUrl || `/images/region-${index + 1}.jpg`}
                      alt={region.name}
                      className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 flex items-center">
                      <h3 className="text-white text-lg font-semibold mr-2">
                        {region.name}
                      </h3>
                      <img
                        src={vnFlag}
                        alt="VN flag"
                        className="w-5 h-4 rounded-sm shadow-sm"
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* --- Hàng 2: 3 ảnh nhỏ --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-2 mt-4">
              {regions
                .filter((r) => ["Đà Nẵng", "Đồng Nai", "Lâm Đồng"].includes(r.name))
                .slice(0, 3)
                .map((region, index) => (
                  <div
                    key={region._id}
                    className="relative overflow-hidden cursor-pointer group rounded-lg shadow-md hover:shadow-lg transition"
                    onClick={() => navigate(`/room-results?destination=${region._id}`)}
                  >
                    <img
                      src={region.imageUrl || `/images/region-${index + 3}.jpg`}
                      alt={region.name}
                      className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 flex items-center">
                      <h3 className="text-white text-lg font-semibold mr-2">
                        {region.name}
                      </h3>
                      <img
                        src={vnFlag}
                        alt="VN flag"
                        className="w-5 h-4 rounded-sm shadow-sm"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>




      {/* Khám phá Việt Nam*/}
      <VietnamDestinations regions={regions} />


      {/* Vì sao chọn Hotelier */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003580] text-center mb-10">
            Vì sao lại chọn <span className="text-[#0071c2]">Hotelier?</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
            {[
              {
                image: "./src/assets/icons/book.png",
                title: "Đặt ngay, thanh toán sau",
                desc: "Miễn phí hủy với hầu hết các phòng — linh hoạt như ý bạn.",
                color: "bg-blue-50",
              },
              {
                image: "./src/assets/icons/like.png",
                title: "Hơn 500 nghìn đánh giá thật",
                desc: "Đọc những nhận xét đáng tin cậy từ khách du lịch khác.",
                color: "bg-yellow-50",
              },
              {
                image: "./src/assets/icons/world.png",
                title: "Hơn 2 triệu chỗ nghỉ toàn cầu",
                desc: "Khách sạn, villa, homestay và nhiều loại hình khác.",
                color: "bg-rose-50",
              },
              {
                image: "./src/assets/icons/profile.png",
                title: "Hỗ trợ khách hàng 24/7",
                desc: "Đội ngũ thân thiện, luôn sẵn sàng giúp bạn mọi lúc.",
                color: "bg-green-50",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`${item.color} rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition`}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-white rounded-full shadow mb-4  overflow-hidden ">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div class="text-left">
                <h3 className="text-lg font-semibold text-center text-[#003580] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 text-center">{item.desc}</p>
              </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Lời chào cá nhân hóa */}
      {user?.name && (
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 bg-[#0071c2] text-white rounded-2xl flex flex-col md:flex-row items-center justify-between p-8 gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {user.name} ơi, bạn muốn tận hưởng kỳ nghỉ tiếp theo ở đâu?
              </h3>
              <p className="text-blue-100">
                Khám phá hàng ngàn lựa chọn chỗ nghỉ phù hợp với bạn.
              </p>
            </div>
            <button
              onClick={() => navigate("/room-results")}
              className="bg-white text-[#0071c2] font-semibold px-6 py-2.5 rounded-full hover:bg-blue-50 transition"
            >
              Khám phá ngay
            </button>
          </div>
        </section>
      )}


      <PopularDestinations />



      
    </div>
  );
}

export default Homescreen;
