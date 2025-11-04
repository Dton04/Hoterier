import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function VietnamDestinations() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [regions, setRegions] = useState([]);
  const [hovered, setHovered] = useState(false);

  const API_BASE_URL = "/api/regions";

  const preferredRegions = [
    "Hà Nội",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Khánh Hòa",
    "Lâm Đồng",
    "Vũng Tàu",
    "Đồng Nai",
    "Hội An",
    "Huế",
    "Sapa",
  ];

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get(API_BASE_URL);
        
        // ✅ Xử lý data từ API (có thể là object hoặc array)
        let regionsList = [];
        if (res.data.regions && Array.isArray(res.data.regions)) {
          // Nếu có pagination: {regions: [...], totalPages: ..., totalRegions: ...}
          regionsList = res.data.regions;
        } else if (Array.isArray(res.data)) {
          // Nếu trả về array trực tiếp
          regionsList = res.data;
        }

        // Filter và sort theo preferredRegions
        const filtered = regionsList.filter((r) =>
          preferredRegions.some(
            (name) => r.name.toLowerCase().trim() === name.toLowerCase().trim()
          )
        );
        
        const sorted = preferredRegions
          .map((name) =>
            filtered.find(
              (r) => r.name.toLowerCase().trim() === name.toLowerCase().trim()
            )
          )
          .filter(Boolean);
        
        setRegions(sorted);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách khu vực:", err);
        setRegions([]);
      }
    };
    fetchRegions();
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollValue =
      dir === "left" ? -el.offsetWidth / 1.5 : el.offsetWidth / 1.5;
    el.scrollBy({ left: scrollValue, behavior: "smooth" });
  };

  return (
    <section className="py-14 bg-white">
      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Header */}
        <div className="mb-7">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1a1a1a]">
            Khám phá Việt Nam
          </h2>
          <p className="text-gray-600 text-[15px]">
            Các điểm đến phổ biến này có nhiều điều chờ đón bạn
          </p>
        </div>

        {/* Container */}
        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Nút trái kiểu Booking */}
          <button
            onClick={() => scroll("left")}
            className={`absolute left-[-22px] top-1/3 -translate-y-1/2 w-[48px] h-[48px] 
                       rounded-full bg-white border border-gray-200 shadow-[0_3px_8px_rgba(0,0,0,0.15)]
                       flex items-center justify-center transition-all duration-300
                       hover:shadow-[0_5px_14px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95
                       z-10 ${
                         hovered
                           ? "opacity-100 pointer-events-auto"
                           : "opacity-0 pointer-events-none"
                       }`}
          >
            <FaChevronLeft className="text-[17px] text-gray-800" />
          </button>

          {/* Danh sách khu vực */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scroll-smooth no-scrollbar gap-5"
          >
            {regions.length > 0 ? (
              regions.map((region, index) => (
                <div
                  key={region._id}
                  className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 cursor-pointer group relative"
                  onClick={() =>
                    navigate(
                      `/hotel-results?region=${encodeURIComponent(region.name)}`
                    )
                  }
                >
                  <div className="relative rounded-[12px] overflow-hidden">
                    <img
                      src={region.imageUrl || `/images/region-${index + 1}.jpg`}
                      alt={region.name}
                      className="w-full h-[120px] sm:h-[130px] object-cover rounded-[12px]
                                 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-[15px] font-semibold text-[#262626] group-hover:text-[#0071c2] transition">
                      {region.name}
                    </h3>
                    <p className="text-[13px] text-gray-500">
                      {region.hotels?.length
                        ? `${region.hotels.length.toLocaleString()} chỗ nghỉ`
                        : "Đang cập nhật"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                Đang tải danh sách khu vực...
              </div>
            )}
          </div>

          {/* Nút phải kiểu Booking */}
          <button
            onClick={() => scroll("right")}
            className={`absolute right-[-22px] top-1/3 -translate-y-1/2 w-[48px] h-[48px]
                       rounded-full bg-white border border-gray-200 shadow-[0_3px_8px_rgba(0,0,0,0.15)]
                       flex items-center justify-center transition-all duration-300
                       hover:shadow-[0_5px_14px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95
                       z-10 ${
                         hovered
                           ? "opacity-100 pointer-events-auto"
                           : "opacity-0 pointer-events-none"
                       }`}
          >
            <FaChevronRight className="text-[17px] text-gray-800" />
          </button>
        </div>
      </div>
    </section>
  );
}