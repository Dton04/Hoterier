// 📁 ./components/HotelResult/components/ResultsHeader.jsx
import React from "react";

export default function ResultsHeader({ filteredHotels, sortBy, setSortBy }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
      <p className="text-gray-600 text-sm text-center sm:text-left">
        {filteredHotels.length} chỗ nghỉ phù hợp
      </p>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="border border-gray-300 rounded-lg p-2 text-gray-600 w-full sm:w-auto"
      >
        <option value="recommended">Đề xuất</option>
        <option value="priceLow">Giá thấp → cao</option>
        <option value="priceHigh">Giá cao → thấp</option>
        <option value="rating">Điểm đánh giá cao nhất</option>
      </select>
    </div>
  );
}
