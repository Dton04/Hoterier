import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, CheckCircle2, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CompactBookingBar from "../components/CompactBookingBar"
import RoomDetailModal from "../tabs/RoomDetailModal";

export default function RoomsTab({ rooms = [], onRoomSelected, hotel = {} }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [currentImage, setCurrentImage] = useState(0);
  const [availability, setAvailability] = useState({});
  const navigate = useNavigate();



  if (rooms.length === 0)
    return <p className="text-gray-600">Hiện khách sạn chưa có phòng nào.</p>;

  const handleQuantityChange = (roomId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [roomId]: Math.max(0, parseInt(value) || 0),
    }));
  };

  // Auto select phòng khi click "Đặt ngay" từ modal
  const handleSelectRoomFromModal = (room) => {
    setQuantities((prev) => ({
      ...prev,
      [room._id]: 1,
    }));
    setSelectedRoom(null);
    const targetRow = document.getElementById(`room-row-${room._id}`);
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    targetRow?.classList.add("bg-yellow-100");
    setTimeout(() => targetRow?.classList.remove("bg-yellow-100"), 1200);
  };


  // Xử lý đặt multi-room 
  const handleBookMultiRoom = () => {
    // Thu thập tất cả phòng được chọn (quantity > 0)
    const selectedRooms = rooms
      .filter((room) => quantities[room._id] > 0)
      .map((room) => ({
        roomid: room._id,
        roomType: room.type,
        name: room.name,
        roomsBooked: quantities[room._id],

        // GIÁ GỐC
        rentperday: room.rentperday,

        // GIÁ GIẢM TỪ FESTIVAL (nếu có)
        discountedPrice: room.discountedPrice ?? room.rentperday,

        // SỐ TIỀN GIẢM MỖI ĐÊM
        festivalDiscountPerDay:
          room.rentperday - (room.discountedPrice ?? room.rentperday),

        imageurls: room.imageurls,
        maxcount: room.maxcount,
        capacity: room.maxcount,
      }));


    if (selectedRooms.length === 0) {
      alert("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    // Nếu chỉ chọn 1 phòng -> chuyển đến booking single-room (backward compatible)
    if (selectedRooms.length === 1 && selectedRooms[0].roomsBooked === 1) {
      const room = rooms.find((r) => r._id === selectedRooms[0].roomid);

      // ✅ Include festival discount data
      const roomWithDiscount = {
        ...room,
        discountedPrice: room.discountedPrice ?? room.rentperday,
        festivalDiscountPerDay: room.rentperday - (room.discountedPrice ?? room.rentperday),
      };

      // ✅ Save hotelId for back navigation
      if (hotel?._id) {
        localStorage.setItem("hotelIdForBooking", hotel._id);
      }

      navigate(`/book/${room._id}`, {
        state: {
          room: roomWithDiscount,  // ✅ Now includes discount data
          checkin: localStorage.getItem("checkin"),
          checkout: localStorage.getItem("checkout"),
          adults: localStorage.getItem("adults"),
          children: localStorage.getItem("children"),
        },
      });
      return;
    }

    // Nếu chọn multiple rooms hoặc multiple quantity -> Multi-room flow
    // ✅ Save hotelId for back navigation
    if (hotel?._id) {
      localStorage.setItem("hotelIdForBooking", hotel._id);
    }

    navigate(`/book/multi-room`, {
      state: {
        isMultiRoom: true,
        selectedRooms: selectedRooms,
        hotel: hotel,
        checkin: localStorage.getItem("checkin"),
        checkout: localStorage.getItem("checkout"),
        adults: localStorage.getItem("adults"),
        children: localStorage.getItem("children"),
      },
    });
  };

  // ===== HÀM: Tính tổng phòng được chọn =====
  const getTotalSelectedRooms = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return rooms
      .filter((room) => quantities[room._id] > 0)
      .reduce((sum, room) => {
        const price = room.discountedPrice ?? room.rentperday;
        return sum + price * quantities[room._id];
      }, 0);
  };

  // ===== HÀM: Lấy số phòng trống tối thiểu trong khoảng thời gian =====
  const getMinAvailableRooms = (room) => {
    const checkinStr = localStorage.getItem("checkin");
    const checkoutStr = localStorage.getItem("checkout");

    if (!checkinStr || !checkoutStr) return room.quantity;

    const checkinDate = new Date(checkinStr);
    const checkoutDate = new Date(checkoutStr);

    if (isNaN(checkinDate) || isNaN(checkoutDate) || checkinDate >= checkoutDate) {
      return room.quantity;
    }

    const dailyInventory = room.dailyInventory || [];
    let minAvailable = room.quantity;

    for (let d = new Date(checkinDate); d < checkoutDate; d.setDate(d.getDate() + 1)) {

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dayStr = `${yyyy}-${mm}-${dd}`;

      const daily = dailyInventory.find(item => item.date === dayStr);
      let available = daily ? daily.quantity : room.quantity;

      (room.currentbookings || []).forEach(b => {
        const bCheckin = new Date(b.checkin);
        const bCheckout = new Date(b.checkout);
        if (d >= bCheckin && d < bCheckout) {
          available -= b.roomsBooked || 1;
        }
      });

      if (available < minAvailable) {
        minAvailable = available;
      }
    }

    return Math.max(0, minAvailable);
  };




  // NEW: Nhận số lượng phòng chính xác từ BookingRecommendation
  useEffect(() => {
    const qtyHandler = (e) => {
      const { roomId, qty } = e.detail;

      setQuantities(prev => ({
        ...prev,
        [roomId]: qty
      }));

      const row = document.getElementById(`room-row-${roomId}`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      row?.classList.add("bg-yellow-100");
      setTimeout(() => row?.classList.remove("bg-yellow-100"), 1200);
    };

    window.addEventListener("set-room-quantity", qtyHandler);

    return () => window.removeEventListener("set-room-quantity", qtyHandler);
  }, []);

  //checK phòng Trống - Re-run khi rooms HOẶC checkin/checkout thay đổi
  useEffect(() => {
    async function fetchAvailability() {
      const checkin = localStorage.getItem("checkin");
      const checkout = localStorage.getItem("checkout");

      // Nếu không có ngày tìm kiếm, dùng quantity mặc định
      if (!checkin || !checkout) {
        console.warn("⚠️ Không có checkin/checkout trong localStorage");
        const defaultAvailability = {};
        rooms.forEach(room => {
          defaultAvailability[room._id] = room.quantity;
        });
        setAvailability(defaultAvailability);
        return;
      }

      console.log("🔍 Checking availability với:", { checkin, checkout });

      const results = {};

      for (const room of rooms) {
        try {
          console.log(`📞 API call cho phòng ${room.name}:`, {
            roomid: room._id,
            checkin,
            checkout
          });

          const res = await axios.post("http://localhost:5000/api/rooms/check-availability", {
            roomid: room._id,
            checkin,
            checkout
          });

          console.log(`✅ API response cho ${room.name}:`, res.data);

          // API trả về availableRooms, không phải available
          results[room._id] = res.data.availableRooms;
        } catch (err) {
          console.error(`❌ Lỗi khi kiểm tra phòng ${room.name}:`, err);
          console.error("Error response:", err.response?.data);
          // Fallback: dùng getMinAvailableRooms nếu API fail
          results[room._id] = getMinAvailableRooms(room);
        }
      }

      console.log("📊 Final availability results:", results);
      setAvailability(results);
    }

    if (rooms.length > 0) fetchAvailability();

    // ✅ FIX: Lắng nghe thay đổi localStorage để re-fetch khi user search lại
    const handleStorageChange = () => {
      console.log("🔄 localStorage changed, re-fetching availability...");
      if (rooms.length > 0) fetchAvailability();
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event khi CompactBookingBar update localStorage
    window.addEventListener('booking-dates-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('booking-dates-updated', handleStorageChange);
    };
  }, [rooms]); // Dependency vẫn là rooms, nhưng có event listeners cho localStorage




  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Phòng trống</h2>
      <CompactBookingBar
        onSearch={(updatedInfo) => console.log("Tìm phòng với:", updatedInfo)}
      />




      <div className="overflow-x-auto border rounded-lg shadow-sm max-w-6xl mx-auto">
        <table className="w-auto border-collapse text-[13px] leading-tight">
          <thead>
            <tr className="bg-blue-50 text-sm font-semibold text-gray-700 border-b ">
              <th className="px-3 py-2 text-left w-[25%] bg-sky-600  text-white border-r border-blue-300">Loại chỗ nghỉ</th>
              <th className="px-2 py-2 text-center w-[10%] bg-sky-600 text-white border-r border-blue-300">Số lượng khách</th>
              <th className="px-2 py-2 text-center w-[15%] bg-sky-800 text-white border-r border-blue-300">Giá hôm nay</th>
              <th className="px-2 py-2 text-left w-[20%] bg-sky-600 text-white border-r border-blue-300" >Các lựa chọn</th>
              <th className="px-2 py-2 text-center w-[10%] bg-sky-600 text-white border-r border-blue-300">Chọn phòng</th>
              <th className="px-2 py-2 text-center w-[15%] bg-sky-600 text-white border-r border-blue-300">Đặt phòng</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => {

              console.log("ROOM:", room.name, "dailyInventory:", room.dailyInventory);
              return (
                <tr
                  id={`room-row-${room._id}`}
                  key={room._id}
                  className={`border-b transition text-[13px] ${room.availabilityStatus !== "available"
                    ? "bg-gray-100 opacity-70"
                    : "hover:bg-blue-50"
                    }`}
                >

                  {/* Loại chỗ nghỉ */}
                  <td className="py-3 px-3 align-top border-r border-blue-300 cursor-pointer" onClick={() => {
                    setSelectedRoom(room);
                    setCurrentImage(0);
                  }}>
                    <h3 className="font-semibold text-blue-700 hover:underline text-[14px] mb-1">
                      {room.name}
                    </h3>
                    <p className="text-gray-600 text-[13px] mb-1 line-clamp-2">
                      {room.description?.slice(0, 120) || ""}
                      {room.description?.length > 120 && "..."}
                    </p>
                    <p className="text-gray-700 text-[13px] mb-1">
                      {room.type} • {room.beds} giường • {room.baths} phòng tắm
                    </p>
                    {room.availabilityStatus !== "available" ? (
                      <p className="text-red-600 text-sm font-medium mt-1">
                        Phòng hiện không có sẵn để đặt
                      </p>
                    ) : (
                      <>
                        <ul className="list-disc ml-4 text-gray-700 text-[13px] leading-snug space-y-0.5">
                          {room.amenities?.slice(0, 5).map((a, i) => (
                            <li key={i}>{typeof a === "string" ? a : a?.name}</li>
                          ))}
                        </ul>
                        <div className="text-gray-500 text-[12px] mt-1 space-y-0.5">
                          <p>📐 Diện tích: {room.size || "—"} m²</p>
                          <p>🚭 Hút thuốc: Không</p>
                          <p>🏢 Tầng: {room.floor || "Tùy theo tình trạng"}</p>
                        </div>
                      </>
                    )}
                  </td>

                  {/* Số lượng khách */}
                  <td className="py-1.5 px-2 text-center align-middle border-r border-blue-300">
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: room.maxcount || 2 }).map((_, i) => (
                        <User key={i} className="text-gray-700" size={15} />
                      ))}
                    </div>
                  </td>

                  {/* Giá hôm nay */}
                  <td className="p-2 text-center align-middle border-r border-blue-300">
                    {room.rentperday ? (
                      <>
                        {/* Nếu có giá giảm */}
                        {room.discountedPrice && room.discountedPrice < room.rentperday ? (
                          <>
                            {/* Giá gốc */}
                            <p className="text-xs text-gray-400 line-through mb-0.5">
                              VND {room.rentperday.toLocaleString()}
                            </p>

                            {/* Giá giảm */}
                            <p className="text-lg font-bold text-red-600 mb-1">
                              VND {room.discountedPrice.toLocaleString()}
                            </p>

                            {/* Nhãn khuyến mãi */}
                            <div className="flex flex-col items-center space-y-1">
                              <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                                Tiết kiệm{" "}
                                {Math.round(
                                  100 - (room.discountedPrice / room.rentperday) * 100
                                )}
                                %
                              </span>
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-md">
                                Ưu Đãi Trong Thời Gian Có Hạn
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                              Đã bao gồm thuế và phí
                            </p>
                          </>
                        ) : (
                          /* Nếu không có giảm giá */
                          <>
                            <p className="text-lg font-bold text-blue-700">
                              VND {room.rentperday.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Đã bao gồm thuế và phí</p>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có giá</p>
                    )}
                  </td>


                  {/* Các lựa chọn */}
                  <td className="p-2 align-top text-sm leading-snug border-r border-blue-300">
                    {room.availabilityStatus === "available" ? (
                      <>
                        <ul className="space-y-1 text-gray-700 mb-2">
                          <li className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={14} /> Bao gồm nhận phòng sớm + trả phòng trễ
                          </li>
                          <li className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 size={14} /> Thanh toán tại khách sạn
                          </li>
                          <li className="flex items-center gap-1 text-red-500">
                            <XCircle size={14} /> Không hoàn tiền
                          </li>
                        </ul>


                        {/* Hiển thị số phòng còn lại - Booking.com style */}
                        {(() => {
                          const minAvailable = availability[room._id];

                          // Loading state
                          if (minAvailable === undefined) {
                            return (
                              <div className="mt-2 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                                <p className="text-gray-500 text-xs">Đang kiểm tra...</p>
                              </div>
                            );
                          }

                          // Sold out
                          if (minAvailable === 0) {
                            return (
                              <div className="mt-2 bg-red-50 border border-red-300 rounded px-2 py-1">
                                <p className="text-red-700 font-bold text-xs">Hết phòng</p>
                                <p className="text-red-600 text-[10px] mt-0.5">Không còn phòng trong ngày này</p>
                              </div>
                            );
                          }

                          // Low availability warning
                          if (minAvailable <= 3) {
                            return (
                              <div className="mt-2 bg-orange-50 border border-orange-300 rounded px-2 py-1">
                                <p className="text-orange-700 font-bold text-xs">Chỉ còn {minAvailable} phòng!</p>
                                <p className="text-orange-600 text-[10px] mt-0.5">Đặt ngay để không bỏ lỡ</p>
                              </div>
                            );
                          }

                          // Available
                          return (
                            <div className="mt-2 bg-green-50 border border-green-200 rounded px-2 py-1">
                              <p className="text-green-700 font-semibold text-xs">Còn {minAvailable} phòng</p>
                            </div>
                          );
                        })()}

                      </>
                    ) : (
                      <p className="text-red-600 text-sm italic">
                        Không thể chọn do phòng đang bận / bảo trì.
                      </p>
                    )}
                  </td>

                  {/* Chọn phòng */}
                  <td className="p-2 text-center align-middle border-r border-blue-300">
                    <select
                      value={quantities[room._id] || 0}
                      onChange={(e) => handleQuantityChange(room._id, e.target.value)}
                      className="border rounded-md px-2 py-1 text-sm"
                      disabled={availability[room._id] === 0}
                    >
                      <option value="0">0</option>

                      {availability[room._id] > 0 &&
                        Array.from({ length: availability[room._id] }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                    </select>

                  </td>

                  {/* Nút indicator (không click) */}
                  <td className="p-2 text-center align-middle">
                    {quantities[room._id] > 0 && (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1.5 rounded-md shadow">
                          Đã chọn
                        </div>
                        <p className="text-[12px] text-gray-600">
                          {quantities[room._id]} phòng
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ===== NÚT ĐẶT MULTI-ROOM BÊN DƯỚI BẢNG ===== */}
      {getTotalSelectedRooms() > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 max-w-6xl mx-auto">
          {/* Thông tin tóm tắt */}
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-gray-800">
              Bạn đã chọn <span className="text-blue-600">{getTotalSelectedRooms()} phòng</span>
            </p>
            <p className="text-sm text-gray-600">
              Tổng giá: <span className="font-bold text-green-600">VND {getTotalPrice().toLocaleString()}</span> / đêm
            </p>
          </div>

          {/* Nút đặt */}
          <button
            onClick={handleBookMultiRoom}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-8 py-3 rounded-lg shadow-lg transition transform hover:scale-105"
          >
            Tiếp tục đặt phòng
          </button>
        </div>
      )}



      {/* Modal chi tiết phòng kiểu Booking.com */}
      <AnimatePresence>
        {selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            onClose={() => {
              setSelectedRoom(null);
              setCurrentImage(0);
            }}
            onBook={handleSelectRoomFromModal}

          />
        )}
      </AnimatePresence>



    </div>
  );
}
