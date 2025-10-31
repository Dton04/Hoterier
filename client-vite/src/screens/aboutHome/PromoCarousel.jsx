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


  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  /** Auto-scroll nhẹ 4s/lần */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (!hovered) { // Tạm dừng auto-scroll khi hover
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: 400, behavior: "smooth" });
        }
        setTimeout(checkScroll, 400);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003580]">
            Chương trình ưu đãi
          </h2>
          <button
            onClick={() => navigate("/discounts")}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
          >
            Xem tất cả <FaChevronRight className="text-xs mt-[1px]" />
          </button>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* gradient fade 2 bên */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-[5]" />
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-[5]" />

          {/* Nút trái */}
          <button
            onClick={() => {
              scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
              setTimeout(checkScroll, 400);
            }}
            disabled={!showLeft}
            className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 flex items-center justify-center border transition-all duration-300 ${
              hovered
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            } ${
              showLeft
                ? "bg-white text-gray-800 hover:bg-gray-100 hover:shadow-lg border-gray-300 shadow-md"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            } z-20`}
          >
            <FaChevronLeft />
          </button>

          {/* Danh sách ưu đãi */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-3"
          >
            {festivalDiscounts.map((festival, index) => (
              <div
                key={festival._id || index}
                onClick={() => navigate(`/festival/${festival._id}`)}
                className="min-w-[300px] sm:min-w-[360px] lg:min-w-[420px] rounded-2xl overflow-hidden relative shadow-md hover:shadow-lg cursor-pointer transform hover:scale-[1.02] transition-all duration-300 snap-start"
              >
                <div className="relative">
                  <img
                    src={festival.image || "/default-festival.jpg"}
                    alt={festival.name}
                    className="w-full h-36 sm:h-40 object-cover rounded-2xl"
                  />
                  <div className="absolute top-3 left-3 bg-pink-600 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-full shadow">
                    Giảm {festival.discountValue || 30}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nút phải */}
          <button
            onClick={() => {
              scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
              setTimeout(checkScroll, 400);
            }}
            disabled={!showRight}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 flex items-center justify-center border transition-all duration-300 ${
              hovered
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            } ${
              showRight
                ? "bg-white text-gray-800 hover:bg-gray-100 hover:shadow-lg border-gray-300 shadow-md"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            } z-20`}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
