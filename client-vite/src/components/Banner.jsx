import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Banner() {
  const location = useLocation();
  const slides = [
    {
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80",
      subtitle: "Khám phá kỳ nghỉ tuyệt vời",
      title: "Tìm nơi dừng chân hoàn hảo của bạn",
    },
    {
      image:
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1920&q=80",
      subtitle: "Ưu đãi đặc biệt hôm nay",
      title: "Trải nghiệm sang trọng với giá tốt nhất",
    },
  ];

  const getPageContent = () => {
    switch (location.pathname) {
      case "/":
      case "/home":
        return { isHome: true, slides };
      default:
        return {
          isHome: false,
          title: "Trang khác",
          image:
            "https://primer.com.ph/blog/wp-content/uploads/sites/14/2018/01/1994765_17092711440056840893.jpg",
        };
    }
  };

  const { isHome, title, image } = getPageContent();

  // 👇 State + Auto slide logic
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isHome) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000); // 6s per slide
    return () => clearInterval(interval);
  }, [isHome]);

  return (
    <section className="relative w-full h-[50vh] mt-[60px] overflow-hidden">
      {isHome ? (
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70 flex flex-col justify-center items-center text-white text-center px-4">
                <h2 className="text-lg md:text-2xl font-light mb-2 drop-shadow-lg">
                  {slide.subtitle}
                </h2>
                <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow-xl">
                  {slide.title}
                </h1>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full ${
                  i === currentIndex ? "bg-white" : "bg-gray-400/70"
                }`}
              ></button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="relative w-full h-[60vh] bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{title}</h1>
          </div>
        </div>
      )}
    </section>
  );
}

export default Banner;
