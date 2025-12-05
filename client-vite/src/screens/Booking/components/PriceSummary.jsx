// PriceSummary.jsx
import React from "react";
import { Ticket, Gift, Sparkles } from "lucide-react";

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
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
        Tóm tắt chi phí
      </h3>

      <div className="space-y-3">
        {/* Giá gốc */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Giá gốc:</span>
          <span className={festivalDiscountTotal > 0 ? "line-through text-gray-400" : "font-semibold text-gray-900"}>
            {basePrice?.toLocaleString()} VND
          </span>
        </div>

        {/* Ưu đãi Lễ hội */}
        {festivalDiscountTotal > 0 && (
          <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">
                {room?.discountApplied ? `Giảm giá ${room.discountApplied}` : 'Ưu đãi Lễ hội'}
              </span>
            </div>
            <span className="text-green-700 font-semibold">
              - {festivalDiscountTotal?.toLocaleString()} VND
            </span>
          </div>
        )}

        {/* Voucher discount */}
        {voucherDiscountTotal > 0 && (
          <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded border border-orange-200">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-orange-600" />
              <span className="text-orange-700 font-medium">Mã giảm giá</span>
            </div>
            <span className="text-orange-700 font-semibold">
              - {voucherDiscountTotal?.toLocaleString()} VND
            </span>
          </div>
        )}

        {/* Chi phí dịch vụ */}
        {serviceCost > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Chi phí dịch vụ:</span>
            <span className="text-gray-900 font-semibold">
              {serviceCost?.toLocaleString()} VND
            </span>
          </div>
        )}

        <hr className="my-3 border-gray-200" />

        {/* Tổng cộng */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
          <span className="text-xl font-bold text-blue-600">
            {total?.toLocaleString()} VND
          </span>
        </div>

        {/* Thông báo tiết kiệm */}
        {totalDiscount > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded px-3 py-2 mt-3">
            <p className="text-sm text-yellow-800 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" />
              Bạn tiết kiệm được <span className="font-bold ml-1">{totalDiscount?.toLocaleString()} VND</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}