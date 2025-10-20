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

  const basePrice = room?.rentperday * days * roomsNeeded;
  const serviceCost = calculateServiceCost();
  const discount =
    discountResult?.appliedDiscounts?.reduce((sum, d) => sum + d.discount, 0) ||
    0;
  const total = Math.max(0, basePrice + serviceCost - discount);

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-blue-700 mb-3">
        Tóm tắt chi phí
      </h3>
      <div className="space-y-2 text-gray-700">
        <p>
          <span className="font-medium">Giá phòng:</span>{" "}
          {basePrice?.toLocaleString()} VND
        </p>
        <p>
          <span className="font-medium">Chi phí dịch vụ:</span>{" "}
          {serviceCost?.toLocaleString()} VND
        </p>
        <p>
          <span className="font-medium">Giảm giá:</span>{" "}
          {discount?.toLocaleString()} VND
        </p>
        <hr className="my-2" />
        <p className="text-xl font-bold text-blue-700">
          Tổng cộng: {total?.toLocaleString()} VND
        </p>
      </div>
    </div>
  );
}
