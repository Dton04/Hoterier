import React from "react";
import { useNavigate } from "react-router-dom";

export default function Breadcrumb({ filters, setFilters }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 mt-10 text-sm text-gray-600 ">
      <nav className="flex flex-wrap items-center gap-1 ">
        <span
          onClick={() => navigate("/")}
          className="cursor-pointer hover:underline text-[#0071c2]"
        >
          Trang chủ
        </span>
        <span className="mx-1">›</span>

        <span
          onClick={() => navigate("/hotel-results")}
          className="cursor-pointer hover:underline text-[#0071c2]"
        >
          Việt Nam
        </span>

        {filters.region && (
          <>
            <span className="mx-1">›</span>
            <span
              onClick={() => {
                setFilters({ ...filters, city: "" });
                navigate(`/hotel-results?region=${encodeURIComponent(filters.region)}`);
              }}
              className="cursor-pointer hover:underline text-[#0071c2]"
            >
              {filters.region}
            </span>
          </>
        )}

        {filters.city && (
          <>
            <span className="mx-1">›</span>
            <span
              onClick={() =>
                navigate(
                  `/hotel-results?region=${encodeURIComponent(filters.region)}&district=${encodeURIComponent(filters.city)}`
                )
              }
              className="cursor-pointer hover:underline text-[#0071c2]"
            >
              {filters.city}
            </span>
          </>
        )}
      </nav>
    </div>
  );
}
