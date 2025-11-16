import React from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { X, Check } from "lucide-react";

// ========================
// DỮ LIỆU TIỆN NGHI DEMO GIỐNG BOOKING.COM
// ========================
const fakeBathroom = [
   "Đồ vệ sinh cá nhân miễn phí",
   "Vòi sen",
   "Nhà vệ sinh",
   "Dép",
   "Máy sấy tóc",
   "Giấy vệ sinh",
];

const fakeView = ["Nhìn ra thành phố"];

const fakeRoomAmenities = [
   "Bàn làm việc",
   "Thiết bị báo carbon monoxide",
   "Không gây dị ứng",
   "Ra trải giường",
   "Sàn lát gỗ",
   "TV màn hình phẳng",
   "Ấm đun nước điện",
   "Điều hòa không khí",
   "Máy pha trà/coffee",
   "Tủ hoặc phòng để quần áo",
   "Sản phẩm lau rửa",
   "Nước rửa tay",
];

// ==============================================================
// Modal giống y Booking.com (GẦN NHƯ FULL UI)
// ==============================================================
export default function RoomDetailModal({
   room,
   currentImage,
   setCurrentImage,
   onClose,
   onBook,
}) {
   if (!room) return null;

   const handleNext = () => {
      setCurrentImage((prev) => (prev + 1) % room.imageurls.length);
   };

   const handlePrev = () => {
      setCurrentImage(
         (prev) => (prev - 1 + room.imageurls.length) % room.imageurls.length
      );
   };

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      >
         <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row relative overflow-hidden"
         >
            {/* Close button */}
            <button
               onClick={onClose}
               className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"
            >
               <X size={20} />
            </button>

            {/* LEFT: MAIN IMAGE */}
            <div className="md:w-[60%] w-full relative">
               <img
                  src={room.imageurls[currentImage]}
                  className="w-full h-[480px] object-cover"
               />

               {/* Nút chuyển ảnh */}
               {room.imageurls.length > 1 && (
                  <>
                     <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow"
                     >
                        <FaChevronLeft />
                     </button>

                     <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow"
                     >
                        <FaChevronRight />
                     </button>
                  </>
               )}

               {/* Thumbnail */}
               <div className="bg-white py-3 flex justify-center gap-2 border-t">
                  {room.imageurls.slice(0, 12).map((img, i) => (
                     <img
                        key={i}
                        src={img}
                        onClick={() => setCurrentImage(i)}
                        className={`w-20 h-16 rounded-md object-cover cursor-pointer border ${currentImage === i ? "border-blue-600" : "border-gray-300"
                           }`}
                     />
                  ))}
               </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="md:w-1/2 w-full p-7 overflow-y-auto max-h-[90vh]">

               {/* Title */}
               <h2 className="text-2xl font-bold mb-1">{room.name}</h2>
               <p className="text-gray-600 mb-3">
                  {room.type} &nbsp;•&nbsp; {room.beds} giường &nbsp;•&nbsp;{" "}
                  {room.baths} phòng tắm
               </p>

               {/* PRICE  */}
               <div className="mb-5">
                  <p className="text-gray-500 text-sm mb-1">Giá cho 1 đêm</p>

                  {room.discountedPrice && room.discountedPrice < room.rentperday ? (
                     <>
                        {/* Giá gốc */}
                        <p className="text-sm text-gray-400 line-through mb-1">
                           VND {room.rentperday.toLocaleString()}
                        </p>

                        {/* Giá giảm */}
                        <p className="text-3xl font-bold text-red-600 mb-2">
                           VND {room.discountedPrice.toLocaleString()}
                        </p>

                        {/* Badge ưu đãi */}
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
                              Tiết kiệm {Math.round(100 - (room.discountedPrice / room.rentperday) * 100)}%
                           </span>
                           <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-md">
                              Ưu Đãi Trong Thời Gian Có Hạn
                           </span>
                        </div>

                        <p className="text-xs text-gray-500">Đã bao gồm thuế và phí</p>
                     </>
                  ) : (
                     <>
                        {/* Không có giảm giá */}
                        <p className="text-3xl font-bold text-blue-700 mb-1">
                           VND {room.rentperday.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Đã bao gồm thuế và phí</p>
                     </>
                  )}
               </div>


               {/* Description */}
               <p className="text-gray-700 mb-6 leading-relaxed text-[15px]">
                  Phòng rộng rãi, trang bị đầy đủ tiện nghi, TV màn hình phẳng,
                  điều hòa, minibar và phòng tắm riêng với vòi sen.
               </p>

               {/* ===================== */}
               {/* Booking.com: Bathroom */}
               {/* ===================== */}
               <div className="mb-7">
                  <h3 className="font-semibold text-lg mb-3">
                     Trong phòng tắm riêng của bạn
                  </h3>

                  <ul className="grid grid-cols-2 gap-y-2 text-[15px]">
                     {fakeBathroom.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                           <Check size={18} className="text-black" /> {item}
                        </li>
                     ))}
                  </ul>
               </div>

               {/* ===================== */}
               {/* Booking.com: View */}
               {/* ===================== */}
               <div className="mb-7">
                  <h3 className="font-semibold text-lg mb-3"> Hướng tầm nhìn</h3>

                  {fakeView.map((item, index) => (
                     <p key={index} className="flex items-center gap-2 text-[15px]">
                        <Check size={18} className="text-black" /> {item}
                     </p>
                  ))}
               </div>

               {/* ===================== */}
               {/* Booking.com: Room Amenities */}
               {/* ===================== */}
               <div className="mb-7">
                  <h3 className="font-semibold text-lg mb-3">🛏 Tiện nghi phòng</h3>

                  <ul className="grid grid-cols-2 gap-y-2 text-[15px]">
                     {fakeRoomAmenities.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                           <Check size={18} className="text-black" /> {item}
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Smoking */}
               <p className="text-[15px] mb-8">
                  <strong>Hút thuốc:</strong> Không được hút thuốc
               </p>

               {/* FOOTER */}
               <div className="flex justify-between items-center border-t pt-4">
                  <p className="text-gray-600 text-sm">
                     Kích thước phòng: {room.size || 20} m²
                  </p>

                  <button
                     onClick={() => onBook(room)}
                     className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[15px] font-medium hover:bg-blue-700"
                  >
                     Đặt ngay
                  </button>
               </div>
            </div>
         </motion.div>
      </motion.div>
   );
}
