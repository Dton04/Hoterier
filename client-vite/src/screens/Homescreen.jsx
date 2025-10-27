import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";

import AlertMessage from "../components/AlertMessage";
import VietnamDestinations from "../screens/VietnamDestinations"
import vnFlag from "../assets/images/vietnam-flag.png";

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

      {/* ƯU ĐÃI LỄ HỘI */}
      <section className=" py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 ">
          <div className="text-center mb-10 animate-pulse">
            <h2 className="uppercase tracking-widest text-blue-600 font-semibold flex justify-center items-center ">
              <span className="w-12 h-0.5 bg-blue-600 mx-3"></span> ƯU ĐÃI LỄ HỘI{" "}
              <span className="w-12 h-0.5 bg-blue-600 mx-3"></span>
            </h2>
            <h1 className="text-3xl font-playfair font-bold text-gray-800">
              Không khí lễ hội -{" "}
              <span className="text-pink-500">Ưu đãi tuyệt vời!</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto mt-3">
              Khám phá những ưu đãi độc quyền trong mùa lễ hội — tiết kiệm đến{" "}
              <strong>50%</strong> cho các điểm đến nổi bật!
            </p>
          </div>

          {/* Festival Cards */}
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

      {/* Điểm đến đang thịnh hành */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#262626] mb-3">
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
                .filter((r) => ["Hà Nội", "TP.HCM"].includes(r.name))
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
                .filter((r) => ["Đà Nẵng", "Nha Trang", "Đà Lạt"].includes(r.name))
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


      {/* Liên hệ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="uppercase tracking-widest text-amber-600 font-semibold flex items-center justify-center">
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span> LIÊN HỆ{" "}
            <span className="w-10 h-0.5 bg-amber-600 mx-3"></span>
          </h2>
          <h1 className="text-3xl font-playfair font-bold mt-2">
            Đặt phòng ngay
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { icon: "fa-phone", title: "Điện thoại", text: "+84 123 456 789" },
              { icon: "fa-envelope", title: "Email", text: "info@hotelier.com" },
              {
                icon: "fa-map-marker-alt",
                title: "Địa chỉ",
                text: "123 Đường ABC, TP XYZ",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md p-8 hover:-translate-y-2 transition"
              >
                <i
                  className={`fas ${item.icon} text-3xl text-amber-600 mb-4`}
                ></i>
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
