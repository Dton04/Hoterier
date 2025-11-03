import React from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

export default function LegalTab({ hotel }) {
  const navigate = useNavigate();
  if (!hotel) return null;

  const regionName = hotel.region?.name || "Việt Nam";
  const district = hotel.district || "Quận 1";
  const hotelName = hotel.name;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-5 mb-2">
      {/* === Breadcrumb === */}
      <nav className="text-[13.5px] text-[#6b6b6b] flex flex-wrap items-center gap-1 mb-4 leading-relaxed">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[#006ce4] hover:underline font-medium"
        >
          <Home size={13} strokeWidth={1.6} /> Trang chủ
        </button>
        <span className="mx-0.5 text-gray-400">›</span>

        <button
          onClick={() => navigate("/hotel-results")}
          className="text-[#006ce4] hover:underline font-medium"
        >
          Khách sạn
        </button>
        <span className="mx-0.5 text-gray-400">›</span>

        <button
          onClick={() =>
            navigate(`/hotel-results?region=${encodeURIComponent(regionName)}`)
          }
          className="text-[#006ce4] hover:underline font-medium"
        >
          {regionName}
        </button>
        <span className="mx-0.5 text-gray-400">›</span>

        <button
          onClick={() =>
            navigate(
              `/hotel-results?region=${encodeURIComponent(
                regionName
              )}&district=${encodeURIComponent(district)}`
            )
          }
          className="text-[#006ce4] hover:underline font-medium"
        >
          {district}
        </button>
        <span className="mx-0.5 text-gray-400">›</span>

        <span className="text-[#262626] font-semibold">{hotelName}</span>
      </nav>
    </div>
  );
}
