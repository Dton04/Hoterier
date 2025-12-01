import React, { useState, useEffect } from "react";
import { CalendarDays, Users, BedDouble } from "lucide-react";

export default function CompactBookingBar({ onSearch }) {
  const [bookingInfo, setBookingInfo] = useState({
    checkin: "",
    checkout: "",
    adults: 1,
    children: 0,
    rooms: 1,
  });

  useEffect(() => {
    const saved = localStorage.getItem("bookingInfo");
    if (saved) {
      const parsed = JSON.parse(saved);
      setBookingInfo(parsed);

      if (parsed.checkin) localStorage.setItem("checkin", parsed.checkin);
      if (parsed.checkout) localStorage.setItem("checkout", parsed.checkout);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...bookingInfo, [name]: value };
    setBookingInfo(updated);

    // Lưu cả object bookingInfo
    localStorage.setItem("bookingInfo", JSON.stringify(updated));

    if (name === "checkin") {
      localStorage.setItem("checkin", value);
    } else if (name === "checkout") {
      localStorage.setItem("checkout", value);
    }

    //Dispatch custom event để RoomsTab re-fetch availability
    window.dispatchEvent(new CustomEvent('booking-dates-updated', {
      detail: { checkin: updated.checkin, checkout: updated.checkout }
    }));
  };

  const handleSearch = () => {
    if (onSearch) onSearch(bookingInfo);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm px-3 py-2 max-w-4xl mx-auto mb-3">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-between text-sm">

        {/* Check-in / Check-out */}
        <div className="flex items-center border rounded-md overflow-hidden w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-r bg-gray-50">
            <CalendarDays size={17} className="text-blue-600" />
            <input
              type="date"
              name="checkin"
              value={bookingInfo.checkin?.split("T")[0] || ""}
              onChange={handleChange}
              className="outline-none bg-transparent text-xs w-24"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50">
            <CalendarDays size={17} className="text-blue-600" />
            <input
              type="date"
              name="checkout"
              value={bookingInfo.checkout?.split("T")[0] || ""}
              onChange={handleChange}
              className="outline-none bg-transparent text-xs w-24"
            />
          </div>
        </div>

        {/* Người lớn / Trẻ em / Phòng */}
        <div className="flex items-center border rounded-md bg-gray-50 px-2 py-1.5 gap-2 w-full md:w-auto">
          <Users size={17} className="text-blue-600" />
          <input
            type="number"
            name="adults"
            min="1"
            value={bookingInfo.adults}
            onChange={handleChange}
            className="w-9 text-center border rounded-sm text-xs"
          />
          <span className="text-gray-600 text-xs">Người lớn</span>

          <input
            type="number"
            name="children"
            min="0"
            value={bookingInfo.children}
            onChange={handleChange}
            className="w-9 text-center border rounded-sm text-xs"
          />
          <span className="text-gray-600 text-xs">Trẻ em</span>

          <BedDouble size={17} className="text-blue-600" />
          <input
            type="number"
            name="rooms"
            min="1"
            value={bookingInfo.rooms}
            onChange={handleChange}
            className="w-9 text-center border rounded-sm text-xs"
          />
          <span className="text-gray-600 text-xs">Phòng</span>
        </div>

        {/* Nút cập nhật */}
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md text-xs md:text-sm transition w-full md:w-auto"
        >
          Thay đổi tìm kiếm
        </button>
      </div>
    </div>
  );
}
