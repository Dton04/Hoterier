import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaUserFriends } from "react-icons/fa";

function BookingForm() {
  const [formData, setFormData] = useState({
    destination: "",
    destinationName: "",
    checkin: "",
    checkout: "",
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const [regions, setRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [openGuestDropdown, setOpenGuestDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/regions")
      .then((response) => setRegions(response.data))
      .catch((err) => console.error("Lỗi lấy regions:", err));
  }, []);



  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "destinationName" ? { destination: "" } : {}),
    }));

    if (name === "destinationName") {
      setFilteredRegions(
        value.trim()
          ? regions.filter((region) =>
              region.name.toLowerCase().includes(value.toLowerCase())
            )
          : []
      );
    }
  };

  

  const handleSelectRegion = (region) => {
    setFormData((prev) => ({
      ...prev,
      destination: region._id,
      destinationName: region.name,
    }));
    setFilteredRegions([]);
  };

  const handleCounter = (field, delta) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const checkinDate = formData.checkin ? new Date(formData.checkin) : "";
    const checkoutDate = formData.checkout ? new Date(formData.checkout) : "";
    if (checkinDate) checkinDate.setHours(14, 0, 0, 0);
    if (checkoutDate) checkoutDate.setHours(12, 0, 0, 0);

    const submitData = {
      destination: formData.destination,
      checkin: checkinDate
        ? new Date(checkinDate.getTime() - checkinDate.getTimezoneOffset() * 60000).toISOString()
        : "",
      checkout: checkoutDate
        ? new Date(checkoutDate.getTime() - checkoutDate.getTimezoneOffset() * 60000).toISOString()
        : "",
      adults: formData.adults,
      children: formData.children,
      rooms: formData.rooms,
    };
    localStorage.setItem("bookingInfo", JSON.stringify(submitData));
    navigate(`/room-results?${new URLSearchParams(submitData).toString()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenGuestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
  <div className="flex justify-center w-full">
    <form
      onSubmit={handleSubmit}
      className="
         flex flex-wrap lg:flex-nowrap items-center justify-between
      bg-white border-[4px] border-[#e0a200] rounded-lg
      shadow-[0_2px_6px_rgba(0,0,0,0.15)]
      w-full max-w-6xl
      "
    >
      {/* Destination */}
      <div className="relative flex-1 min-w-[200px] border-r border-gray-200">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071c2] text-lg" />
        <input
          type="text"
          name="destinationName"
          placeholder="Bạn muốn đến đâu?"
          value={formData.destinationName}
          onChange={handleChange}
          required
          className="w-full pl-10 pr-3 h-[54px] text-[15px] border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
        />
        {filteredRegions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md z-50 mt-1 max-h-52 overflow-y-auto">
            {filteredRegions.map((region) => (
              <li
                key={region._id}
                onClick={() => handleSelectRegion(region)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              >
                <FaMapMarkerAlt className="text-blue-600" />
                {region.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Check-in */}
      <div className="relative flex-1 min-w-[160px] border-r border-gray-200">
        <FaRegCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071c2] text-lg" />
        <DatePicker
          selected={formData.checkin}
          onChange={(date) => setFormData({ ...formData, checkin: date })}
          selectsStart
          startDate={formData.checkin}
          endDate={formData.checkout}
          minDate={new Date()}
          placeholderText="Nhận phòng"
          className="w-full pl-10 pr-3 h-[54px] text-[15px] border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
          dateFormat="dd/MM/yyyy"
        />
      </div>

      {/* Check-out */}
      <div className="relative flex-1 min-w-[160px] border-r border-gray-200">
        <FaRegCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071c2] text-lg" />
        <DatePicker
          selected={formData.checkout}
          onChange={(date) => setFormData({ ...formData, checkout: date })}
          selectsEnd
          startDate={formData.checkin}
          endDate={formData.checkout}
          minDate={formData.checkin}
          placeholderText="Trả phòng"
          className="w-full pl-10 pr-3 h-[54px] text-[15px] border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
          dateFormat="dd/MM/yyyy"
        />
      </div>

      {/* Guests & Rooms */}
      <div
        className="relative flex-1 min-w-[180px] border-r border-gray-200"
        ref={dropdownRef}
      >
        <FaUserFriends className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071c2] text-lg" />
        <div
          onClick={() => setOpenGuestDropdown(!openGuestDropdown)}
          className="w-full pl-10 pr-3 h-[54px] text-[15px] flex items-center cursor-pointer hover:bg-gray-50"
        >
          {formData.adults} người lớn · {formData.rooms} phòng
        </div>

        {openGuestDropdown && (
          <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-md mt-1 p-3 min-w-[250px] z-50">
            {["adults", "children", "rooms"].map((field) => (
              <div key={field} className="flex justify-between items-center mb-3 last:mb-0">
                <span className="capitalize text-sm">
                  {field === "adults"
                    ? "Người lớn"
                    : field === "children"
                    ? "Trẻ em"
                    : "Phòng"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCounter(field, -1)}
                    className="border border-[#0071c2] rounded-full text-[#0071c2] w-6 h-6 flex items-center justify-center hover:bg-[#0071c2] hover:text-white"
                  >
                    -
                  </button>
                  <span className="text-sm">{formData[field]}</span>
                  <button
                    type="button"
                    onClick={() => handleCounter(field, 1)}
                    className="border border-[#0071c2] rounded-full text-[#0071c2] w-6 h-6 flex items-center justify-center hover:bg-[#0071c2] hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setOpenGuestDropdown(false)}
                className="bg-[#0071c2] text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
              >
                Xong
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-[#0071c2] text-white font-semibold px-6 h-[54px] rounded-md hover:bg-blue-700 transition text-[17px]"
      >
        Tìm
      </button>
    </form>
  </div>
);

}

export default BookingForm;
