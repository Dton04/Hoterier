import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function PromoCarousel({ festivalDiscounts = [] }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [hovered, setHovered] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 10;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
    setShowLeft(!atStart);
    setShowRight(!atEnd);
  };

  // Fix mất nút khi load
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 0);
    return () => clearTimeout(timer);
  }, [festivalDiscounts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <section className="py-14 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1a1a1a]">
            Chương trình khuyến mãi chỗ ở
          </h2>
          <button
            onClick={() => navigate("/discounts")}
            className="text-blue-600 hover:underline text-sm font-semibold flex items-center gap-1"
          >
            Xem tất cả <FaChevronRight className="text-xs" />
          </button>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >

          {/* Nút trái */}
          {showLeft && (
            <button
              onClick={() => scrollRef.current.scrollBy({ left: -400, behavior: "smooth" })}
              className={`absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                          w-[44px] h-[44px] rounded-[14px] flex items-center justify-center z-20
                          hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-300
                          ${hovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <FaChevronLeft className="text-[16px] text-gray-700" />
            </button>
          )}

          {/* Danh sách ưu đãi */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar pb-3"
          >
            {festivalDiscounts.map((festival, index) => (
              <div
                key={festival._id || index}
                onClick={() => navigate(`/festival/${festival._id}`)}
                className="min-w-[260px] sm:min-w-[300px] lg:min-w-[340px] rounded-[20px] overflow-hidden 
                           relative shadow-md hover:shadow-lg cursor-pointer transform hover:scale-[1.02] 
                           transition-all duration-300 snap-start"
              >
                <div className="relative">
                  <img
                    src={festival.image || "/default-festival.jpg"}
                    alt={festival.name}
                    className="w-full h-28 sm:h-32 lg:h-36 object-cover rounded-[20px]"
                  />

                  <div className="absolute top-2 left-2 bg-pink-600 text-white text-[11px] sm:text-xs font-semibold px-3 py-0.5 rounded-full shadow">
                    Giảm {festival.discountValue || 30}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nút phải */}
          {showRight && (
            <button
              onClick={() => scrollRef.current.scrollBy({ left: 400, behavior: "smooth" })}
              className={`absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                          w-[44px] h-[44px] rounded-[14px] flex items-center justify-center z-20
                          hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-300
                          ${hovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <FaChevronRight className="text-[16px] text-gray-700" />
            </button>
          )}

        </div>
      </div>
    </section>
  );
}
