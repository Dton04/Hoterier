// RoomPreview.jsx
import React from "react";

export default function RoomPreview({ room, roomsNeeded, getValues }) {
  if (!room) return null;

  const checkin = new Date(getValues("checkin"));
  const checkout = new Date(getValues("checkout"));
  const days =
    Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)) > 0
      ? Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24))
      : 1;

  // Lấy giá gốc
  const originalDailyRate = room.originalRentperday || room.rentperday;
  const festivalDiscountPerDay = room.festivalDiscountPerDay || 0;
  
  // Tính giá sau giảm (cho mục đích hiển thị tổng tạm thời)
  const priceAfterFestival = Math.max(0, originalDailyRate - festivalDiscountPerDay);
  const total = priceAfterFestival * days * roomsNeeded; // Tổng tiền sau festival (chưa voucher)

  return (
    <div className="mt-6 p-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row gap-5">
        <img
          src={room.imageurls?.[0]}
          alt={room.name}
          className="w-full md:w-1/3 rounded-xl object-cover h-48 md:h-56"
        />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            {room.name}
          </h3>
          <p className="text-gray-600 mb-1">Loại phòng: {room.type}</p>
          <p className="text-gray-600 mb-1">
            Số phòng đặt: {roomsNeeded}
          </p>

          <p className="text-gray-600 mb-1">
            Giá mỗi ngày:{" "}
            <span className="font-semibold text-blue-600">
              {priceAfterFestival.toLocaleString()} VND
            </span>
            {festivalDiscountPerDay > 0 && (
                <span className="text-sm text-gray-500 line-through ml-2">
                    {originalDailyRate.toLocaleString()} VND
                </span>
            )}
          </p>

          {room.discountApplied && (
            <p className="text-sm text-green-600">
              (Ưu đãi Festival: Giảm {room.discountApplied})
            </p>
          )}

          <hr className="my-2" />
          <p className="font-semibold text-gray-800">
            Tổng (sau Festival, chưa Voucher/Dịch vụ):{" "}
            <span className="text-blue-700">
              {total.toLocaleString()} VND
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}