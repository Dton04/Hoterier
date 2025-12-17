// BookingDetailModal.jsx
import React, { useState, useEffect } from "react";
import { X, Calendar, Users, Bed, DollarSign, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function BookingDetailModal({ booking, isOpen, onClose, onCancelSuccess }) {
   const [timeRemaining, setTimeRemaining] = useState(null);
   const [canCancel, setCanCancel] = useState(false);
   const [canceling, setCanceling] = useState(false);

   useEffect(() => {
      if (!booking || !isOpen) return;

      const calculateTimeRemaining = () => {
         const createdAt = new Date(booking.createdAt);
         const now = new Date();
         const minutesPassed = (now - createdAt) / (1000 * 60);
         const minutesLeft = Math.max(0, 15 - minutesPassed);

         if (minutesLeft > 0 && booking.paymentStatus === "pending") {
            setCanCancel(true);
            const mins = Math.floor(minutesLeft);
            const secs = Math.floor((minutesLeft - mins) * 60);
            setTimeRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
         } else {
            setCanCancel(false);
            setTimeRemaining(null);
         }
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
   }, [booking, isOpen]);

   const handleCancel = async () => {
      if (!booking) return;

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.email) {
         toast.error("Vui lòng đăng nhập để hủy đặt phòng");
         return;
      }

      const confirmed = window.confirm(
         "Bạn có chắc chắn muốn hủy đặt phòng này? Hành động này không thể hoàn tác."
      );

      if (!confirmed) return;

      setCanceling(true);

      try {
         const { data } = await axios.post(`/api/bookings/${booking._id}/user-cancel`, {
            email: userInfo.email,
            reason: "Khách hàng hủy trong vòng 15 phút"
         });

         toast.success("Hủy đặt phòng thành công!");
         onCancelSuccess && onCancelSuccess();
         onClose();
      } catch (error) {
         const message = error.response?.data?.message || "Lỗi khi hủy đặt phòng";
         toast.error(message);
      } finally {
         setCanceling(false);
      }
   };

   if (!isOpen || !booking) return null;

   const getStatusBadge = () => {
      const statusConfig = {
         confirmed: { icon: CheckCircle, text: "Đã xác nhận", color: "bg-green-100 text-green-700" },
         pending: { icon: Clock, text: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
         canceled: { icon: XCircle, text: "Đã hủy", color: "bg-red-100 text-red-700" }
      };

      const config = statusConfig[booking.status] || statusConfig.pending;
      const Icon = config.icon;

      return (
         <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}>
            <Icon className="w-4 h-4" />
            <span className="font-semibold text-sm">{config.text}</span>
         </div>
      );
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
         <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
               <h2 className="text-2xl font-bold">Chi tiết đặt phòng</h2>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition"
               >
                  <X className="w-6 h-6" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
               {/* Hotel Info */}
               <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                     {booking.hotelId?.name || "Khách sạn"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                     {booking.hotelId?.address || "Địa chỉ không có"}
                  </p>
               </div>

               {/* Status */}
               <div className="flex items-center justify-between">
                  {getStatusBadge()}
                  {canCancel && timeRemaining && (
                     <div className="flex items-center gap-2 text-orange-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold">Còn {timeRemaining} để hủy miễn phí</span>
                     </div>
                  )}
               </div>

               {/* Booking Details */}
               <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="font-semibold">{new Date(booking.checkin).toLocaleDateString("vi-VN")}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className="font-semibold">{new Date(booking.checkout).toLocaleDateString("vi-VN")}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Users className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-xs text-gray-500">Khách</p>
                        <p className="font-semibold">{booking.adults} người lớn, {booking.children} trẻ em</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Bed className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-xs text-gray-500">Loại phòng</p>
                        <p className="font-semibold">{booking.roomType || "Không xác định"}</p>
                     </div>
                  </div>
               </div>

               {/* Price */}
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        <span className="text-lg font-bold text-gray-900">Tổng tiền:</span>
                     </div>
                     <span className="text-2xl font-bold text-blue-600">
                        {booking.totalAmount?.toLocaleString()} VND
                     </span>
                  </div>
               </div>

               {/* Warning if can't cancel */}
               {!canCancel && booking.status !== "canceled" && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Không thể hủy đặt phòng</p>
                        <p>
                           {booking.paymentStatus !== "pending"
                              ? "Đặt phòng đã thanh toán. Vui lòng liên hệ bộ phận hỗ trợ."
                              : "Đã quá thời gian hủy miễn phí (15 phút). Vui lòng liên hệ bộ phận hỗ trợ."}
                        </p>
                     </div>
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex gap-3 justify-end border-t">
               <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition"
               >
                  Đóng
               </button>
               {canCancel && (
                  <button
                     onClick={handleCancel}
                     disabled={canceling}
                     className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {canceling ? "Đang hủy..." : "Hủy đặt phòng"}
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
