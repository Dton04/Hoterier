import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, CheckCircle2, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CompactBookingBar from "../components/CompactBookingBar"

export default function RoomsTab({ rooms = [], onRoomSelected }) {
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

   return (
      <div>
         <h2 className="text-2xl font-semibold mb-4">Phòng trống</h2>
         <CompactBookingBar
            onSearch={(updatedInfo) => console.log("Tìm phòng với:", updatedInfo)}
         />



         <div className="overflow-x-auto border rounded-lg shadow-sm max-w-6xl mx-auto">
            <table className="w-auto border-collapse text-[13px] leading-tight">

               <thead>
                  <tr className="bg-blue-50 text-sm font-semibold text-gray-700 border-b">
                     <th className="px-3 py-2 text-left w-[20%]">Loại chỗ nghỉ</th>
                     <th className="px-2 py-2 text-center w-[1%]">Số lượng khách</th>
                     <th className="px-2 py-2 text-center w-[15%]">Giá hôm nay</th>
                     <th className="px-2 py-2 text-left w-[20%]">Các lựa chọn</th>
                     <th className="px-2 py-2 text-center w-[10%]">Chọn phòng</th>
                  </tr>
               </thead>

               <tbody>
                  {rooms.map((room) => (
                     <tr
                        key={room._id}
                        className="border-b hover:bg-blue-50 transition text-[13px] leading-tight"
                     >
                        {/* Loại chỗ nghỉ */}
                        <td
                           className="py-1.5 px-2 align-top cursor-pointer"
                           onClick={() => {
                              setSelectedRoom(room);
                              setCurrentImage(0);
                           }}
                        >
                           <h3 className="font-semibold text-blue-700 hover:underline text-[14px] mb-0.5">
                              {room.name}
                           </h3>
                           <p className="text-gray-600 text-[13px] leading-snug mb-0.5">
                              {room.type} • {room.beds} giường • {room.baths} phòng tắm
                           </p>
                           <ul className="list-disc ml-4 text-gray-700 text-[13px] leading-snug space-y-0">
                              {room.amenities?.slice(0, 3).map((a, i) => (
                                 <li key={i}>{a}</li>
                              ))}
                           </ul>
                           <p className="text-gray-500 text-[12px] mt-0.5">
                              Diện tích: {room.size || "—"} m²
                           </p>
                        </td>

                        {/* Số lượng khách */}
                        <td className="py-1.5 px-2 text-center align-middle">
                           <div className="flex justify-center gap-0.5">
                              {Array.from({ length: room.maxPeople || 2 }).map((_, i) => (
                                 <User key={i} className="text-gray-700" size={15} />
                              ))}
                           </div>
                        </td>

                        {/* Giá hôm nay */}
                        <td className="p-2 text-center align-middle">
                           {room.oldPrice && (
                              <p className="text-xs text-gray-400 line-through">
                                 VND {room.oldPrice.toLocaleString()}
                              </p>
                           )}
                           <p className="text-lg font-bold text-blue-600">
                              VND {room.rentperday.toLocaleString()}
                           </p>
                           <p className="text-xs text-gray-500">Đã bao gồm thuế và phí</p>
                           {room.oldPrice && (
                              <p className="text-green-600 text-xs font-semibold">
                                 Tiết kiệm {Math.round(100 - (room.rentperday / room.oldPrice) * 100)}%
                              </p>
                           )}
                        </td>

                        {/* Các lựa chọn */}
                        <td className="p-2 align-top text-sm leading-snug">
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
                              <li className="flex items-center gap-1 text-black">
                                 • Thanh toán cho chỗ nghĩ trước khi đến
                              </li>
                              <li className="flex items-center gap-1 text-green-600">
                                 <CheckCircle2 size={14} /> Không cần thẻ tín dụng
                              </li>

                           </ul>
                        </td>

                        {/* Chọn phòng */}
                        <td className="p-2 text-center align-middle">
                           <select
                              value={quantities[room._id] || 0}
                              onChange={(e) => handleQuantityChange(room._id, e.target.value)}
                              className="border rounded-md px-2 py-1 text-sm"
                           >
                              <option value="0">0</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                 <option key={n} value={n}>
                                    {n}
                                 </option>
                              ))}
                           </select>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Nút đặt duy nhất */}
         {Object.values(quantities).some((q) => q > 0) && (
            <div className="flex justify-end mt-4">
               <button
                  onClick={() => {
                     const selected = rooms.filter((r) => (quantities[r._id] || 0) > 0);
                     if (selected.length === 0) return;
                     const selectedRoom = selected[0];

                     // Điều hướng sang trang Bookingscreen
                     navigate(`/book/${selectedRoom._id}`, {
                        state: {
                           room: selectedRoom,
                           checkin: localStorage.getItem("checkin") || null,
                           checkout: localStorage.getItem("checkout") || null,
                           adults: localStorage.getItem("adults") || 2,
                           children: localStorage.getItem("children") || 0,
                        },
                     });
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
               >
                  Tôi sẽ đặt
               </button>
            </div>
         )}


         {/* Modal chi tiết */}
         <AnimatePresence>
            {selectedRoom && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
               >
                  <motion.div
                     initial={{ scale: 0.9 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.9 }}
                     className="bg-white rounded-xl shadow-lg max-w-5xl w-full p-6 relative overflow-y-auto max-h-[90vh]"
                  >
                     <button
                        className="absolute top-4 right-4 text-gray-600 hover:text-black"
                        onClick={() => setSelectedRoom(null)}
                     >
                        <X size={24} />
                     </button>

                     {/* Image slider */}
                     <div className="relative">
                        <img
                           src={selectedRoom.imageurls?.[currentImage]}
                           alt={selectedRoom.name}
                           className="w-full h-96 object-cover rounded-lg"
                        />
                        <button
                           onClick={handlePrevImage}
                           className="absolute top-1/2 left-3 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                        >
                           <FaChevronLeft />
                        </button>
                        <button
                           onClick={handleNextImage}
                           className="absolute top-1/2 right-3 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
                        >
                           <FaChevronRight />
                        </button>

                        <div className="flex justify-center mt-3 gap-2">
                           {selectedRoom.imageurls?.map((img, i) => (
                              <img
                                 key={i}
                                 src={img}
                                 alt=""
                                 onClick={() => setCurrentImage(i)}
                                 className={`w-20 h-14 object-cover rounded-md cursor-pointer border ${i === currentImage ? "border-blue-500" : "border-gray-200"
                                    }`}
                              />
                           ))}
                        </div>
                     </div>

                     <div className="mt-6 space-y-3">
                        <h2 className="text-2xl font-bold">{selectedRoom.name}</h2>
                        <p className="text-gray-600 text-sm">
                           {selectedRoom.type} • {selectedRoom.beds} giường • {selectedRoom.baths} phòng tắm
                        </p>
                        <p className="text-gray-700 mt-2">{selectedRoom.description}</p>
                        <h3 className="font-semibold mt-4">Tiện nghi:</h3>
                        <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-700 mt-1">
                           {selectedRoom.amenities?.map((a, i) => (
                              <li key={i}>✓ {a}</li>
                           ))}
                        </ul>
                     </div>

                     <div className="flex justify-between items-center mt-6 border-t pt-4">
                        <div>
                           <p className="text-gray-500 text-sm">Giá cho 1 đêm</p>
                           <p className="text-2xl font-bold text-green-600">
                              VND {selectedRoom.rentperday.toLocaleString()}
                           </p>
                        </div>
                        <button
                           onClick={() => {
                              onRoomSelected && onRoomSelected(selectedRoom);
                              setSelectedRoom(null);
                           }}
                           className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                           Đặt ngay
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}
