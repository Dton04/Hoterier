// PriceSummary.jsx
import React from "react";

export default function PriceSummary({
  room,
  roomsNeeded,
  getValues,
  discountResult,
  calculateServiceCost,
}) {
  const checkin = new Date(getValues("checkin"));
  const checkout = new Date(getValues("checkout"));
  const days =
    Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)) > 0
      ? Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
      : 1;

  const roomsBookedCount = roomsNeeded || 1; 

  // 1. Lấy giá gốc
  // Sử dụng originalRentperday được set trong hook, fallback về rentperday (vốn là giá gốc nếu không có festival)
  const originalDailyRate = room?.originalRentperday || room?.rentperday || 0;
  
  // 2. Tính giá cơ bản (luôn dùng giá gốc * số ngày * số phòng)
  const basePrice = originalDailyRate * days * roomsBookedCount; 
  
  // 3. Tính tổng giảm giá Festival
  const festivalDiscountTotal = (room?.festivalDiscountPerDay || 0) * days * roomsBookedCount;

  // 4. Tính tổng giảm giá Voucher
  const voucherDiscountTotal =
    discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) || 0;
    
  // 5. Tổng tất cả giảm giá
  const totalDiscount = festivalDiscountTotal + voucherDiscountTotal;
  
  // 6. Chi phí dịch vụ
  const serviceCost = calculateServiceCost();

  // 7. Tổng cuối cùng
  const total = Math.max(0, basePrice + serviceCost - totalDiscount);

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-blue-700 mb-3">
        Tóm tắt chi phí
      </h3>
      <div className="space-y-2 text-gray-700">
        <p>
          <span className="font-medium">Giá phòng:</span>{" "}
          {basePrice?.toLocaleString()} VND {/* 👈 HIỂN THỊ GIÁ GỐC */}
        </p>
        <p>
          <span className="font-medium">Chi phí dịch vụ:</span>{" "}
          {serviceCost?.toLocaleString()} VND
        </p>
        <p className={`font-medium ${totalDiscount > 0 ? 'text-red-500' : ''}`}>
          <span className="font-medium">Giảm giá:</span>{" "}
          {totalDiscount?.toLocaleString()} VND {/* 👈 TỔNG GIẢM GIÁ (Festival + Voucher) */}
        </p>
        <hr className="my-2" />
        <p className="text-xl font-bold text-blue-700">
          Tổng cộng: {total?.toLocaleString()} VND
        </p>
      </div>
    </div>
  );
}