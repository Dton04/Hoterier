import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import CancelConfirmationModal from "../../components/CancelConfirmationModal";
import SuggestionCard from "../../components/SuggestionCard";
import AlertMessage from "../../components/AlertMessage";

// Custom hooks & components
import useBookingLogic from "./hooks/useBookingLogic";
import BookingHeader from "./components/BookingHeader";

import BookingForm from "./components/BookingForm";
import PriceSummary from "./components/PriceSummary";
import PaymentInfo from "./components/PaymentInfo";
import PointsEarned from "./components/PointsEarned";
import RoomPreview from "./components/RoomPreview";
import HotelInfoCard from "./components/HotelInfoCard";

export default function Bookingscreen() {
   const navigate = useNavigate();
   const { roomid } = useParams();
   const {
      // from hook
      room,
      loading,
      error,
      bookingStatus,
      paymentStatus,
      bankInfo,
      timeRemaining,
      paymentExpired,
      showCancelModal,
      newBookingId,
      bookingDetails,
      suggestions,
      loadingSuggestions,
      pointsEarned,
      discountCode,
      setDiscountCode,
      discountResult,
      availableServices,
      selectedServices,
      handleServiceChange,
      onSubmit,
      handleSubmit,
      register,
      errors,
      getValues,
      setRoomsNeeded,
      applyDiscountCode,
      handleSimulatePayment,
      handleCheckPaymentStatus,
      handleOpenCancelModal,
      handleConfirmSuccess,
      handleCloseAlert,
      calculateServiceCost,
      roomsNeeded,
   } = useBookingLogic({ roomid, navigate });

   const [hotel, setHotel] = useState(null);

   useEffect(() => {
      if (room?.hotelId) {
         axios.get(`/api/hotels/${room.hotelId}`)
            .then(res => setHotel(res.data))
            .catch(err => console.error("Lỗi khi lấy thông tin khách sạn:", err));
      }
   }, [room]);

   return (
      <div className="min-h-screen bg-gray-50 py-8">
         <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            {/* Header */}
            <BookingHeader />

            {/* Alert */}
            {bookingStatus && (
               <div className="mb-5">
                  <AlertMessage
                     type={bookingStatus?.type}
                     message={bookingStatus?.message}
                     onClose={handleCloseAlert}
                  />
               </div>
            )}

            {/* Points Earned */}
            <PointsEarned pointsEarned={pointsEarned} />

            {/* Loading & Error */}
            {loading ? (
               <Loader loading={loading} />
            ) : error ? (
               <div className="text-center text-red-600 font-medium">
                  Lỗi khi tải dữ liệu phòng.
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-[35%_65%] gap-8 items-start">
                  {/* Left: Room Gallery + Preview */}
                  <div>

                     <HotelInfoCard
                        hotel={{
                           name: hotel?.name,
                           address: hotel?.address,
                           city: hotel?.region?.name,
                           stars: 5, // có thể cập nhật thêm field sao trong DB nếu cần
                           rating: 9.5,
                           reviewScore: 8.8,
                           reviewText: "Tuyệt vời",
                           reviewCount: 3001,
                           image: hotel?.imageurls?.[0],
                           wifi: hotel?.amenities?.includes("wifi"),
                           parking: hotel?.amenities?.includes("parking"),
                        }}
                     />


                     <RoomPreview
                        room={room}
                        roomsNeeded={roomsNeeded}
                        getValues={getValues}
                     />
                     <PriceSummary
                        room={room}
                        roomsNeeded={roomsNeeded}
                        getValues={getValues}
                        discountResult={discountResult}
                        calculateServiceCost={calculateServiceCost}
                     />
                  </div>

                  {/* Right: Booking Form & Payment */}
                  <div className="space-y-6">
                     {paymentStatus && (
                        <div
                           className={`p-3 rounded-xl border ${paymentStatus === "paid"
                              ? "bg-green-50 border-green-200 text-green-700"
                              : paymentStatus === "pending"
                                 ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                                 : "bg-red-50 border-red-200 text-red-700"
                              }`}
                        >
                           {paymentStatus === "paid" && "✅ Đã thanh toán"}
                           {paymentStatus === "pending" && "⏳ Đang chờ thanh toán"}
                           {paymentStatus === "canceled" && "❌ Đã hủy giao dịch"}
                        </div>
                     )}

                     <PaymentInfo
                        bankInfo={bankInfo}
                        paymentStatus={paymentStatus}
                        timeRemaining={timeRemaining}
                        paymentExpired={paymentExpired}
                        handleSimulatePayment={handleSimulatePayment}
                        handleCheckPaymentStatus={handleCheckPaymentStatus}
                        loading={loading}
                     />

                     {!localStorage.getItem("userInfo") ? (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-700 text-center">
                           Vui lòng{" "}
                           <a
                              href="/login"
                              className="text-blue-600 font-semibold hover:underline"
                           >
                              đăng nhập
                           </a>{" "}
                           để đặt phòng.
                        </div>
                     ) : (
                        <BookingForm
                           register={register}
                           handleSubmit={handleSubmit}
                           errors={errors}
                           onSubmit={onSubmit}
                           loading={loading}
                           discountCode={discountCode}
                           setDiscountCode={setDiscountCode}
                           applyDiscountCode={applyDiscountCode}
                           discountResult={discountResult}
                           availableServices={availableServices}
                           selectedServices={selectedServices}
                           handleServiceChange={handleServiceChange}
                           bookingStatus={bookingStatus}
                           room={room}
                           getValues={getValues}
                           setRoomsNeeded={setRoomsNeeded}
                        />
                     )}
                  </div>
               </div>
            )}

            {/* Gợi ý phòng tương tự */}
            {room && room.availabilityStatus !== "available" && (
               <div className="mt-10">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                     Các phòng tương tự có sẵn
                  </h4>
                  {loadingSuggestions ? (
                     <Loader loading={loadingSuggestions} />
                  ) : suggestions.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {suggestions.map((sug) => (
                           <SuggestionCard key={sug._id} room={sug} />
                        ))}
                     </div>
                  ) : (
                     <p className="text-gray-500 text-sm">
                        Không có phòng tương tự khả dụng vào lúc này.
                     </p>
                  )}
               </div>
            )}

            {/* Cancel Modal */}
            <CancelConfirmationModal
               show={showCancelModal}
               onHide={() => handleOpenCancelModal(false)}
               bookingId={newBookingId}
               onConfirmSuccess={handleConfirmSuccess}
               bookingDetails={bookingDetails}
            />
         </div>
      </div>
   );
}
