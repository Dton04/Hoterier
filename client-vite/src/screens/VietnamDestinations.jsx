import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function VietnamDestinations({ regions }) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();


  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount =
        direction === "left" ? -current.offsetWidth / 1.2 : current.offsetWidth / 1.2;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#262626]">
            Khám phá Việt Nam
          </h2>
          <p className="text-gray-500 text-[15px]">
            Các điểm đến phổ biến này có nhiều điều chờ đón bạn
          </p>
        </div>

        {/* Scroll Container */}
        <div className="relative">

          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-100"
          >
            <FaChevronLeft className="text-gray-700 text-sm" />
          </button>

          {/* Danh sách các region (scroll ngang) */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar scroll-smooth gap-4"
          >
            {regions.map((region, index) => (
              <div
                key={region._id}
                className="min-w-[180px] cursor-pointer group flex-shrink-0"
                onClick={() =>
                  navigate(`/room-results?destination=${region._id}`)
                }
              >
                <div className="relative rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={region.imageUrl || `/images/region-${index + 1}.jpg`}
                    alt={region.name}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="mt-2">
                  <h3 className="text-[15px] font-medium text-[#262626] group-hover:text-[#0071c2] transition">
                    {region.name}
                  </h3>
                  <p className="text-[13px] text-gray-500">
                    {region.hotelCount
                      ? `${region.hotelCount.toLocaleString()} chỗ nghỉ`
                      : "Đang cập nhật"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Nút phải */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-gray-100"
          >
            <FaChevronRight className="text-gray-700 text-sm" />
          </button>
        </div>
      </div>
    </section>
  );
}
