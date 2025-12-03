import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { Ticket, Calendar, Tag, CheckCircle, XCircle } from "lucide-react";

export default function MyVouchers({ profile }) {
   const [vouchers, setVouchers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const API_BASE_URL = "http://localhost:5000";
   const userInfo = JSON.parse(localStorage.getItem("userInfo"));

   useEffect(() => {
      fetchMyVouchers();
   }, []);

   const fetchMyVouchers = async () => {
      try {
         setLoading(true);
         const headers = { Authorization: `Bearer ${userInfo.token}` };
         const response = await axios.get(`${API_BASE_URL}/api/discounts/my-vouchers`, { headers });
         setVouchers(response.data);
      } catch (err) {
         setError("Không thể tải danh sách voucher của bạn.");
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("vi-VN", {
         day: "2-digit",
         month: "2-digit",
         year: "numeric"
      });
   };

   const getDiscountText = (discount) => {
      if (!discount) return "";
      if (discount.discountType === "percentage") {
         return `Giảm ${discount.discountValue}%`;
      } else {
         return `Giảm ${discount.discountValue.toLocaleString()} VND`;
      }
   };

   const isExpired = (expiryDate) => {
      return new Date(expiryDate) < new Date();
   };

   if (loading) {
      return (
         <div className="flex justify-center items-center h-64">
            <Spinner animation="border" variant="primary" />
         </div>
      );
   }

   return (
      <div>
         <div className="flex justify-between items-start mb-6">
            <div>
               <h2 className="text-2xl font-bold text-gray-900">Voucher của tôi</h2>
               <p className="text-gray-600 mt-1">
                  Quản lý các voucher và mã giảm giá bạn đã thu thập.
               </p>
            </div>
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
               {error}
            </div>
         )}

         {vouchers.length === 0 ? (
            <div className="border rounded-lg p-8 text-center bg-gray-50">
               <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-gray-600 text-lg font-medium mb-2">Chưa có voucher nào</p>
               <p className="text-gray-500 text-sm">
                  Bạn chưa thu thập voucher nào. Hãy khám phá các ưu đãi và thu thập voucher để tiết kiệm chi phí!
               </p>
            </div>
         ) : (
            <div className="space-y-4">
               {vouchers.map((voucher) => {
                  const discount = voucher.discountId;
                  const expired = isExpired(voucher.expiryDate);

                  return (
                     <div
                        key={voucher._id}
                        className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${expired ? "opacity-60" : ""
                           }`}
                     >
                        <div className="flex flex-col md:flex-row">
                           {/* Left side - Voucher Code */}
                           <div className={`md:w-1/3 p-6 flex flex-col justify-center items-center ${expired ? "bg-gray-100" : "bg-gradient-to-br from-blue-50 to-blue-100"
                              }`}>
                              <Ticket className={`w-12 h-12 mb-3 ${expired ? "text-gray-400" : "text-blue-600"}`} />
                              <div className="text-center">
                                 <p className="text-xs text-gray-500 uppercase mb-1">Mã voucher</p>
                                 <p className={`text-xl font-bold ${expired ? "text-gray-600" : "text-blue-600"} font-mono tracking-wider`}>
                                    {voucher.voucherCode}
                                 </p>
                              </div>
                              {expired && (
                                 <div className="mt-3 flex items-center gap-1 text-red-600">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Đã hết hạn</span>
                                 </div>
                              )}
                           </div>

                           {/* Right side - Voucher Details */}
                           <div className="md:w-2/3 p-6">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                       {discount?.name || "Voucher"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                       {discount?.description || "Không có mô tả"}
                                    </p>
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-sm font-semibold ${expired
                                       ? "bg-gray-200 text-gray-600"
                                       : "bg-green-100 text-green-700"
                                    }`}>
                                    {getDiscountText(discount)}
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                 <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">
                                       Hết hạn: <span className="font-medium text-gray-900">{formatDate(voucher.expiryDate)}</span>
                                    </span>
                                 </div>

                                 {discount?.minBookingAmount && discount.minBookingAmount > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                       <Tag className="w-4 h-4 text-gray-400" />
                                       <span className="text-gray-600">
                                          Đơn tối thiểu: <span className="font-medium text-gray-900">{discount.minBookingAmount.toLocaleString()} VND</span>
                                       </span>
                                    </div>
                                 )}

                                 {discount?.maxDiscount && discount.maxDiscount > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                       <Tag className="w-4 h-4 text-gray-400" />
                                       <span className="text-gray-600">
                                          Giảm tối đa: <span className="font-medium text-gray-900">{discount.maxDiscount.toLocaleString()} VND</span>
                                       </span>
                                    </div>
                                 )}

                                 <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">
                                       Trạng thái: <span className={`font-medium ${voucher.isUsed ? "text-red-600" : "text-green-600"}`}>
                                          {voucher.isUsed ? "Đã sử dụng" : "Chưa sử dụng"}
                                       </span>
                                    </span>
                                 </div>
                              </div>

                              {discount?.applicableHotels && discount.applicableHotels.length > 0 && (
                                 <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-2">Áp dụng cho:</p>
                                    <div className="flex flex-wrap gap-2">
                                       {discount.applicableHotels.slice(0, 3).map((hotel, idx) => (
                                          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                             {hotel.name}
                                          </span>
                                       ))}
                                       {discount.applicableHotels.length > 3 && (
                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                             +{discount.applicableHotels.length - 3} khác
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
}
