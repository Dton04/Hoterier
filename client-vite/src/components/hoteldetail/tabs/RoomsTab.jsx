import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle2, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CompactBookingBar from "../components/CompactBookingBar"

export default function RoomsTab({ rooms = [], onRoomSelected, hotel = {} }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();


  if (rooms.length === 0)
    return <p className="text-gray-600">Hiện khách sạn chưa có phòng nào.</p>;

  const handleQuantityChange = (roomId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [roomId]: Math.max(0, parseInt(value) || 0),
    }));
  };

  const handleNextImage = () => {
    if (!selectedRoom?.imageurls) return;
    setCurrentImage((prev) => (prev + 1) % selectedRoom.imageurls.length);
  };

  const handlePrevImage = () => {
    if (!selectedRoom?.imageurls) return;
    setCurrentImage(
      (prev) =>
        (prev - 1 + selectedRoom.imageurls.length) %
        selectedRoom.imageurls.length
    );
  };

  // ===== HÀM MỚI: Xử lý đặt multi-room =====
  const handleBookMultiRoom = () => {
    // Thu thập tất cả phòng được chọn (quantity > 0)
    const selectedRooms = rooms
      .filter((room) => quantities[room._id] > 0)
      .map((room) => ({
        roomid: room._id,
        roomType: room.type,
        name: room.name,
        roomsBooked: quantities[room._id],
        rentperday: room.rentperday,
        imageurls: room.imageurls,
      }));

    if (selectedRooms.length === 0) {
      alert("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    // Nếu chỉ chọn 1 phòng -> chuyển đến booking single-room (backward compatible)
    if (selectedRooms.length === 1 && selectedRooms[0].roomsBooked === 1) {
      const room = rooms.find((r) => r._id === selectedRooms[0].roomid);
      navigate(`/book/${room._id}`, {
        state: {
          room,
          checkin: localStorage.getItem("checkin"),
          checkout: localStorage.getItem("checkout"),
          adults: localStorage.getItem("adults"),
          children: localStorage.getItem("children"),
        },
      });
      return;
    }

    // Nếu chọn multiple rooms hoặc multiple quantity -> Multi-room flow
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
      .reduce((sum, room) => sum + (room.rentperday * quantities[room._id]), 0);
  };

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
            {rooms.map((room) => (
              <tr
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
                      ⚠️ Phòng hiện không có sẵn để đặt
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
                    <ul className="space-y-1 text-gray-700">
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
                    disabled={room.availabilityStatus !== "available"}
                  >
                    <option value="0">0</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Nút indicator (không click) */}
                <td className="p-2 text-center align-middle">
                  {quantities[room._id] > 0 && (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1.5 rounded-md shadow">
                        ✓ Đã chọn
                      </div>
                      <p className="text-[12px] text-gray-600">
                        {quantities[room._id]} phòng
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ))}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row relative overflow-hidden"
            >
              {/* Nút đóng */}
              <button
                className="absolute top-3 right-3 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
                onClick={() => setSelectedRoom(null)}
              >
                <X size={18} className="text-gray-700" />
              </button>

              {/* Ảnh phòng bên trái */}
              <div className="md:w-[60%] w-full relative ">
                {/* Ảnh chính */}
                <img
                  src={selectedRoom.imageurls?.[currentImage]}
                  alt={selectedRoom.name}
                  className="w-full h-[450px] md:h-[500px] object-cover rounded-none"
                />

                {/* Nút điều hướng ảnh */}
                {selectedRoom.imageurls?.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white shadow-md transition"
                    >
                      <FaChevronLeft className="text-gray-800" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white shadow-md transition"
                    >
                      <FaChevronRight className="text-gray-800" />
                    </button>
                  </>
                )}

                {/* Thumbnail ảnh nhỏ */}
                <div className="bg-white py-3 flex justify-center items-center gap-2 border-t">
                  {selectedRoom.imageurls?.slice(0, 8).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      onClick={() => setCurrentImage(i)}
                      alt=""
                      className={`w-20 h-16 object-cover rounded-md cursor-pointer border transition ${i === currentImage
                        ? "border-blue-600 shadow-sm"
                        : "border-gray-300 opacity-80 hover:opacity-100"
                        }`}
                    />
                  ))}
                </div>
              </div>


              {/* Thông tin phòng bên phải */}
              <div className="md:w-1/2 w-full p-6 overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-semibold mb-1">{selectedRoom.name}</h2>
                <p className="text-gray-600 text-sm mb-3">
                  {selectedRoom.type} • {selectedRoom.beds} giường • {selectedRoom.baths} phòng tắm
                </p>

                {/* Giá */}
                <div className="mb-4">
                  <p className="text-gray-500 text-sm">Giá cho 1 đêm</p>
                  <p className="text-2xl font-bold text-green-600">
                    VND {selectedRoom.rentperday?.toLocaleString()}
                  </p>
                </div>

                {/* Mô tả */}
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                  {selectedRoom.description ||
                    "Phòng rộng rãi với máy điều hòa, minibar, và phòng tắm riêng có vòi sen."}
                </p>

                {/* Thông tin tiện nghi */}
                <div className="space-y-4 text-sm text-gray-700 border-t pt-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🛁 Trong phòng tắm riêng của bạn</h3>
                    <ul className="grid grid-cols-2 gap-x-4 list-disc ml-4">
                      {(selectedRoom.bathroomAmenities || [
                        "Đồ vệ sinh cá nhân miễn phí",
                        "Vòi sen",
                        "Áo choàng tắm",
                        "Nhà vệ sinh",
                        "Khăn tắm",
                      ]).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🛏 Tiện nghi</h3>
                    <ul className="grid grid-cols-2 gap-x-4 list-disc ml-4">
                      {selectedRoom.amenities?.map((a, i) => {
                        const name = typeof a === "string" ? a : a?.name;
                        return <li key={i}>{name}</li>;
                      })}
                    </ul>
                  </div>

                  <div>
                    <ul>
                      <strong>Hút thuốc:</strong> <span>Không được hút thuốc</span>
                    </ul>
                  </div>


                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-6 border-t pt-4">
                  <p className="text-gray-500 text-sm">
                    Kích thước phòng: {selectedRoom.size || "20"} m²
                  </p>
                  <button
                    onClick={() => {
                      onRoomSelected && onRoomSelected(selectedRoom);
                      setSelectedRoom(null);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
