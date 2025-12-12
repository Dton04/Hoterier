import React, { useState, useEffect } from "react";

import { useNavigate, useParams, useLocation } from "react-router-dom";
import Loader from "../../components/Loader";
import CancelConfirmationModal from "../../components/CancelConfirmationModal";
import SuggestionCard from "../../components/SuggestionCard";
import AlertMessage from "../../components/AlertMessage";

// Custom hooks & components
import useBookingLogic from "./hooks/useBookingLogic.js";
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
   const location = useLocation();

   // *** Lấy query parameters từ URL (Dữ liệu từ Chatbot) ***
   const queryParams = new URLSearchParams(location.search);

   // *** Lấy multi-room data từ location.state (từ RoomsTab) ***
   const isMultiRoom = location.state?.isMultiRoom === true;
   const selectedRooms = location.state?.selectedRooms || [];
   const hotelFromState = location.state?.hotel || null;

   // *** Merge initialData từ cả URL query params và location.state ***
   const initialData = {
      checkin: location.state?.checkin || queryParams.get('checkin'),
      checkout: location.state?.checkout || queryParams.get('checkout'),
      people: location.state?.people || queryParams.get("people"),
      hotelId: queryParams.get('hotelId'),
      isMultiRoom: isMultiRoom,
      selectedRooms: selectedRooms,
      room: location.state?.room || null,  // ✅ Include room data from navigation state
      hotel: hotelFromState,  // ✅ Include hotel data for multi-room service fetching
   };

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
      setValue,
      watch,
      checkAvailability,
      collectedVouchers,
   } = useBookingLogic({ roomid, navigate, initialData });

   const [hotel, setHotel] = useState(null);
   const [currentStep, setCurrentStep] = useState(1);

   useEffect(() => {
      if (paymentStatus === "paid") setCurrentStep(3);
      else if (room && !paymentStatus) setCurrentStep(2);
   }, [paymentStatus, room]);


   useEffect(() => {
      if (room?.hotel) {
         setHotel(room.hotel);
      }
   }, [room]);


   return (
      <div className="min-h-screen bg-gray-50 py-8">
         <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            {/* Header */}
            <BookingHeader currentStep={currentStep} timeRemaining={timeRemaining} />


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
               <div className="grid grid-cols-1 md:grid-cols-[35%_65%] gap-8 items-start mt-5">
                  {/* Left: Room Gallery + Preview */}
                  <div>

                     <HotelInfoCard
                        hotel={{
                           name: hotel?.name,
                           address: hotel?.address,
                           city: hotel?.region?.name,
                           stars: hotel?.starRating || 5,
                           rating: hotel?.rating,
                           reviewScore: hotel?.reviewScore,
                           reviewText: hotel?.reviewText,
                           reviewCount: hotel?.reviewCount,
                           imageurls: hotel?.imageurls,
                           wifi: hotel?.amenities?.includes("wifi"),
                           parking: hotel?.amenities?.includes("parking"),
                        }}
                     />


                     <RoomPreview
                        room={room}
                        roomsNeeded={roomsNeeded}
                        getValues={getValues}
                        isMultiRoom={isMultiRoom}
                        selectedRooms={selectedRooms}
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
                           {paymentStatus === "paid" && " Đã thanh toán"}
                           {paymentStatus === "pending" && "Đang chờ thanh toán"}
                           {paymentStatus === "canceled" && " Đã hủy giao dịch"}
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
                           setRoomsNeeded={setRoomsNeeded}
                           setValue={setValue}
                           isMultiRoom={isMultiRoom}
                           selectedRooms={selectedRooms}
                           watch={watch}
                           initialData={initialData}
                           checkAvailability={checkAvailability}
                           collectedVouchers={collectedVouchers}
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
