import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, XCircle, Loader } from "lucide-react";

const PaymentCallback = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const [status, setStatus] = useState("loading"); // loading, success, failed
   const [message, setMessage] = useState("Đang xác nhận thanh toán...");
   const [bookingId, setBookingId] = useState(null);

   useEffect(() => {
      const processPayment = async () => {
         try {
            // Get payment type from URL
            const paymentType = searchParams.get("type"); // vnpay or momo
            const bookingIdParam = searchParams.get("bookingId");

            setBookingId(bookingIdParam);

            if (paymentType === "vnpay") {
               // VNPay callback - check response code
               const responseCode = searchParams.get("vnp_ResponseCode");

               if (responseCode === "00") {
                  setStatus("success");
                  setMessage("Thanh toán VNPay thành công!");

                  // Redirect to home after 3 seconds
                  setTimeout(() => navigate("/"), 3000);
               } else {
                  setStatus("failed");
                  setMessage("Thanh toán VNPay thất bại. Vui lòng thử lại.");

                  // Redirect to booking page after 5 seconds
                  setTimeout(() => navigate("/"), 5000);
               }
            } else if (paymentType === "momo") {
               // MoMo callback - check result code
               const resultCode = searchParams.get("resultCode");

               if (resultCode === "0") {
                  setStatus("success");
                  setMessage("Thanh toán MoMo thành công!");

                  // Redirect to home after 3 seconds
                  setTimeout(() => navigate("/"), 3000);
               } else {
                  setStatus("failed");
                  setMessage("Thanh toán MoMo thất bại. Vui lòng thử lại.");

                  // Redirect to booking page after 5 seconds
                  setTimeout(() => navigate("/"), 5000);
               }
            } else {
               // Unknown payment type
               setStatus("failed");
               setMessage("Loại thanh toán không hợp lệ.");
               setTimeout(() => navigate("/"), 5000);
            }
         } catch (error) {
            console.error("Error processing payment:", error);
            setStatus("failed");
            setMessage("Có lỗi xảy ra khi xử lý thanh toán.");
            setTimeout(() => navigate("/"), 5000);
         }
      };

      processPayment();
   }, [searchParams, navigate]);

   return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
         <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
               {status === "loading" && (
                  <>
                     <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                     <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Đang xử lý...
                     </h2>
                     <p className="text-gray-600">{message}</p>
                  </>
               )}

               {status === "success" && (
                  <>
                     <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                     <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Thanh toán thành công!
                     </h2>
                     <p className="text-gray-600 mb-4">{message}</p>
                     {bookingId && (
                        <p className="text-sm text-gray-500">
                           Mã đặt phòng: {bookingId}
                        </p>
                     )}
                     <p className="text-sm text-gray-500 mt-4">
                        Đang chuyển hướng về trang chủ...
                     </p>
                  </>
               )}

               {status === "failed" && (
                  <>
                     <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                     <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Thanh toán thất bại
                     </h2>
                     <p className="text-gray-600 mb-4">{message}</p>
                     {bookingId && (
                        <p className="text-sm text-gray-500">
                           Mã đặt phòng: {bookingId}
                        </p>
                     )}
                     <button
                        onClick={() => navigate("/")}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                     >
                        Quay về trang chủ
                     </button>
                  </>
               )}
            </div>
         </div>
      </div>
   );
};

export default PaymentCallback;
