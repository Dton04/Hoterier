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
  const [childrenAges, setChildrenAges] = useState([]);
  const navigate = useNavigate();

  // LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("bookingInfo");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          destination: data.destination || "",
          checkin: data.checkin ? new Date(data.checkin) : "",
          checkout: data.checkout ? new Date(data.checkout) : "",
          adults: data.adults || 2,
          children: data.children || 0,
          rooms: data.rooms || 1,
        }));
        // restore children ages if present
        if (data.childrenAges && Array.isArray(data.childrenAges)) {
          setChildrenAges(data.childrenAges);
        }
      } catch (err) {
        console.error("Lỗi khi parse bookingInfo:", err);
      }
    }
  }, []);

  // 
  useEffect(() => {
    const saved = localStorage.getItem("bookingInfo");
    if (saved && regions.length > 0) {
      try {
        const data = JSON.parse(saved);
        if (data.destination) {
          const foundRegion = regions.find((r) => r._id === data.destination);
          if (foundRegion) {
            setFormData((prev) => ({
              ...prev,
              destinationName: foundRegion.name,
            }));
          }
        }
      } catch (err) {
        console.error("Lỗi khi khôi phục tên vùng:", err);
      }
    }
  }, [regions]);


  useEffect(() => {
    axios
      .get("/api/regions")
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
    setFormData((prev) => {
      const next = Math.max(field === 'adults' ? 1 : field === 'rooms' ? 1 : 0, prev[field] + delta);
      // enforce maximums
      const maxMap = { adults: 16, children: 8, rooms: 9 };
      const capped = Math.min(next, maxMap[field] || next);

      // if children decreased, trim childrenAges
      if (field === 'children') {
        setChildrenAges((prevAges) => {
          if (capped < prevAges.length) return prevAges.slice(0, capped);
          // if increased, append default age 2
          const newAges = [...prevAges];
          while (newAges.length < capped) newAges.push(2);
          return newAges;
        });
      }

      return {
        ...prev,
        [field]: capped,
      };
    });
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
      childrenAges: formData.children > 0 ? childrenAges : [],
    };
    localStorage.setItem("bookingInfo", JSON.stringify(submitData));
    navigate(`/hotel-results?${new URLSearchParams(submitData).toString()}`);
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
    <div className="flex justify-center w-full px-3 sm:px-0">
      <form
        onSubmit={handleSubmit}
        className="
          flex flex-col sm:flex-row flex-wrap items-center justify-between
          bg-white border-[4px] border-[#e0a200] rounded-lg
          shadow-[0_2px_6px_rgba(0,0,0,0.15)]
          w-full max-w-6xl
        "
      >
        {/* Destination */}
        <div className="relative flex-1 min-w-[220px] border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-[#e0a200]  sm:rounded-l-lg">
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
        <div className="relative flex-1 min-w-[180px] border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-[#e0a200]">
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
        <div className="relative flex-1 min-w-[180px] border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-[#e0a200]">
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
          className="relative flex-1 min-w-[180px] border-b-[4px] sm:border-b-0 sm:border-r-[4px] border-[#e0a200]"
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
            <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-md mt-1 p-4 min-w-[320px] z-50">
              <div className="text-sm text-gray-700 font-medium mb-3">Khách và Phòng</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Người lớn</div>
                    <div className="text-xs text-gray-500">Từ 13 tuổi trở lên</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCounter('adults', -1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="w-6 text-center">{formData.adults}</div>
                    <button
                      type="button"
                      onClick={() => handleCounter('adults', 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Trẻ em</div>
                    <div className="text-xs text-gray-500">0-12 tuổi</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCounter('children', -1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="w-6 text-center">{formData.children}</div>
                    <button
                      type="button"
                      onClick={() => handleCounter('children', 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.children > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: formData.children }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <label className="text-xs">Tuổi trẻ em {idx + 1}</label>
                        <select
                          value={childrenAges[idx] ?? 2}
                          onChange={(e) => {
                            const age = Number(e.target.value);
                            setChildrenAges((prev) => {
                              const copy = [...prev];
                              copy[idx] = age;
                              return copy;
                            });
                          }}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {Array.from({ length: 18 }).map((__, a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Phòng</div>
                    <div className="text-xs text-gray-500">Số lượng phòng</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCounter('rooms', -1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="w-6 text-center">{formData.rooms}</div>
                    <button
                      type="button"
                      onClick={() => handleCounter('rooms', 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      // reset to defaults
                      setFormData((prev) => ({ ...prev, adults: 2, children: 0, rooms: 1 }));
                      setChildrenAges([]);
                    }}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenGuestDropdown(false)}
                    className="px-3 py-1 bg-[#0071c2] text-white rounded text-sm"
                  >
                    Xong
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="w-full sm:w-auto -m-[2px]">
          <button
            type="submit"
            className="bg-[#0071c2] text-white font-semibold w-full sm:w-auto px-6 h-[54px] rounded-b-md sm:rounded-r-md hover:bg-blue-700 transition text-[17px]"
          >
            Tìm
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
