// RoomPreview.jsx - Booking.com style with multi-room support
import { Calendar, Moon, Users, Tag, TrendingDown, DollarSign } from "lucide-react";

export default function RoomPreview({ room, roomsNeeded, getValues, isMultiRoom, selectedRooms }) {

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

  // Tính giá sau giảm
  const priceAfterFestival = Math.max(0, originalDailyRate - festivalDiscountPerDay);
  const totalBeforeVoucher = priceAfterFestival * days * roomsNeeded;

  const hasDiscount = festivalDiscountPerDay > 0;

  // Nếu multi-room, tính tổng tiền từ tất cả phòng
  let multiRoomTotal = 0;
  if (isMultiRoom && selectedRooms && selectedRooms.length > 0) {
    multiRoomTotal = selectedRooms.reduce((sum, selectedRoom) => {
      const price = Math.max(0, (selectedRoom.rentperday || 0) - (selectedRoom.festivalDiscountPerDay || 0));
      return sum + (price * days * (selectedRoom.roomsBooked || 1));
    }, 0);
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Content Section */}
      <div className="p-5">
        {/* Booking Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-gray-600 text-xs font-semibold mb-1">
                <Calendar className="w-4 h-4" />
                <span>CHECKIN</span>
              </div>
              <p className="font-bold text-gray-900">{checkin.toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-gray-600 text-xs font-semibold mb-1">
                <Calendar className="w-4 h-4" />
                <span>CHECKOUT</span>
              </div>
              <p className="font-bold text-gray-900">{checkout.toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-gray-600 text-xs font-semibold mb-1">
                <Moon className="w-4 h-4" />
                <span>SỐ ĐÊM</span>
              </div>
              <p className="font-bold text-gray-900">{days} đêm</p>
            </div>
          </div>
        </div>

        {/* Single or Multi Room Display */}
        {isMultiRoom && selectedRooms && selectedRooms.length > 0 ? (
          // Multi-room view
          <div className="space-y-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Các phòng đã chọn ({selectedRooms.length})
            </h3>
            {selectedRooms.map((selectedRoom, index) => {
              const roomPrice = Math.max(0, (selectedRoom.rentperday || 0) - (selectedRoom.festivalDiscountPerDay || 0));
              const roomTotal = roomPrice * days * (selectedRoom.roomsBooked || 1);
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedRoom.roomType || "Phòng"}</p>
                      <p className="text-sm text-gray-600">
                        {selectedRoom.roomsBooked || 1} phòng × {roomPrice.toLocaleString()} VND/đêm
                      </p>
                    </div>
                    <div className="text-right">
                      {selectedRoom.festivalDiscountPerDay > 0 ? (
                        <>
                          <p className="text-sm text-gray-500 line-through">
                            {(selectedRoom.rentperday || 0).toLocaleString()} VND
                          </p>
                          <p className="font-semibold text-green-600">
                            {roomPrice.toLocaleString()} VND
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-gray-900">
                          {roomPrice.toLocaleString()} VND
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600 pt-2 border-t border-gray-200">
                    Subtotal: <span className="font-bold text-blue-600">{roomTotal.toLocaleString()} VND</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single room view
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{room.name}</h2>
              <p className="text-gray-600 text-sm">Loại phòng: <span className="font-semibold text-gray-700">{room.type}</span></p>
            </div>

            {/* Quantity Info */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-gray-700">
                  <span className="font-semibold">Số phòng đặt:</span>{" "}
                  <span className="text-blue-600 font-bold text-lg">{roomsNeeded} phòng</span>
                </p>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Giá mỗi đêm:</span>
                </div>
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <span className="text-sm text-gray-500 line-through block">
                        {originalDailyRate.toLocaleString()} VND
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {priceAfterFestival.toLocaleString()} VND
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">
                      {priceAfterFestival.toLocaleString()} VND
                    </span>
                  )}
                </div>
              </div>

              {hasDiscount && (
                <div className="flex items-center gap-1 text-sm text-green-600 font-semibold justify-end">
                  <TrendingDown className="w-4 h-4" />
                  <span>Tiết kiệm {festivalDiscountPerDay.toLocaleString()} VND/đêm</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Total Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 text-sm flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {isMultiRoom && selectedRooms ? (
                "Tổng cộng tất cả phòng"
              ) : (
                `${priceAfterFestival.toLocaleString()} VND × ${days} đêm × ${roomsNeeded} phòng`
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Tổng (chưa voucher/dịch vụ):</span>
            <span className="text-2xl font-bold text-blue-600">
              {isMultiRoom ? multiRoomTotal.toLocaleString() : totalBeforeVoucher.toLocaleString()} VND
            </span>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          ℹ️ Giá này chưa bao gồm voucher và dịch vụ thêm. Sẽ được cập nhật ở bước thanh toán.
        </div>
      </div>
    </div>
  );
}