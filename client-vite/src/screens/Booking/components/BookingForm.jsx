// BookingForm.jsx
import React, { useEffect, useState } from "react";

export default function BookingForm({
  register,
  handleSubmit,
  errors,
  onSubmit,
  loading,
  discountCode,
  setDiscountCode,
  applyDiscountCode,
  discountResult,
  availableServices,
  selectedServices,
  handleServiceChange,
  bookingStatus,
  setRoomsNeeded,
  setValue,
  isMultiRoom,
  selectedRooms,
  watch,
  checkAvailability,
  collectedVouchers,
}) {

  const [roomWarning, setRoomWarning] = useState(null);

  useEffect(() => {
    try {
      const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
      if (!bookingInfo) return;

      const checkin = bookingInfo.checkin?.split("T")[0] || "";
      const checkout = bookingInfo.checkout?.split("T")[0] || "";


      setValue?.("checkin", checkin);
      setValue?.("checkout", checkout);
      setValue?.("adults", bookingInfo.adults || 2);
      setValue?.("children", bookingInfo.children ?? 0);
      bookingInfo.rooms && setRoomsNeeded?.(Number(bookingInfo.rooms));
    } catch (error) {
      console.error("Lỗi đọc bookingInfo:", error);
    }
  }, [setValue, setRoomsNeeded]);

  //REALTIME CHECK AVAILABILITY
  useEffect(() => {
    if (!watch || !checkAvailability) return;

    const ci = watch("checkin");
    const co = watch("checkout");

    if (ci && co) {
      checkAvailability().then((res) => {
        if (!res?.available) {
          setRoomWarning(res.message);
        } else {
          setRoomWarning(null);
        }
      });
    }
  }, [watch("checkin"), watch("checkout"), watch("roomsBooked")]);


  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, isMultiRoom, selectedRooms))}
      className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-6"
    >
      {/* Tiêu đề giống Booking.com */}
      <h3 className="text-xl font-bold text-[#003580] mb-1">
        Nhập thông tin chi tiết của bạn
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Gần xong rồi! Chỉ cần điền thông tin của bạn
      </p>

      {/* Họ và tên */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="Ví dụ: Nguyễn Văn A"
          className={`w-full border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-[#003580] focus:border-[#003580] transition`}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          {...register("email")}
          placeholder="email@domain.com"
          className={`w-full border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-[#003580] focus:border-[#003580] transition`}
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Số điện thoại */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-4 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm">
            VN +84
          </span>
          <input
            type="tel"
            {...register("phone")}
            placeholder="912345678"
            className={`flex-1 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-r-lg px-4 py-3 text-base focus:ring-2 focus:ring-[#003580] focus:border-[#003580] transition`}
          />
        </div>
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>



      {/* Số người & trẻ em */}
      {/* Số khách (hiển thị, không cho chỉnh) */}
      {watch && (
        <>
          {/* Hidden input để vẫn submit lên BE */}
          <input type="hidden" {...register("adults")} />
          <input type="hidden" {...register("children")} />

          <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Số khách
              </span>
              <span className="text-sm text-gray-800 font-semibold">
                {watch("adults") || 2} người lớn
                {` · `}
                {watch("children") || 0} trẻ em
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Muốn thay đổi số khách?{" "}
              <button
                type="button"
                className="font-semibold text-blue-600 underline"
                onClick={() => {
                  const hotelId = localStorage.getItem("hotelIdForBooking");
                  if (hotelId) {
                    window.location.href = `/hotel/${hotelId}`;
                  } else {
                    window.history.back();
                  }
                }}
              >
                Quay lại bước chọn phòng
              </button>
              .
            </p>

          </div>
        </>
      )}


      {/* Phương thức thanh toán */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phương thức thanh toán <span className="text-red-500">*</span>
        </label>
        <select
          {...register("paymentMethod")}
          className={`w-full border ${errors.paymentMethod ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-[#003580] focus:border-[#003580] transition`}
        >
          <option value="cash">Tiền mặt</option>
          <option value="credit_card">Thẻ tín dụng</option>
          <option value="bank_transfer">Chuyển khoản ngân hàng</option>
          <option value="mobile_payment">MoMo</option>
          <option value="vnpay">VNPay</option>
        </select>
        {errors.paymentMethod && (
          <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>
        )}
      </div>

      {/* Mã giảm giá */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mã giảm giá
        </label>

        {/* Dropdown chọn voucher đã thu thập */}
        {collectedVouchers && collectedVouchers.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">
              Voucher của bạn
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#003580]"
              onChange={(e) => {
                if (e.target.value) {
                  setDiscountCode(e.target.value);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Chọn voucher của bạn --</option>
              {collectedVouchers.map((v) => {
                const discountName = v.discountId?.name || v.voucherCode || 'Voucher';
                const discountType = v.discountId?.discountType;
                const discountValue = v.discountId?.discountValue;

                let discountDisplay = '';
                if (discountType === 'percentage' && discountValue) {
                  discountDisplay = `Giảm ${discountValue}%`;
                } else if (discountType === 'fixed' && discountValue) {
                  discountDisplay = `Giảm ${discountValue.toLocaleString()} VND`;
                } else {
                  discountDisplay = 'Mã giảm giá';
                }

                return (
                  <option key={v._id} value={v.voucherCode}>
                    {discountName} - {discountDisplay}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <label className="block text-xs text-gray-600 mb-1">
          Hoặc nhập mã giảm giá
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Nhập mã"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580]"
          />
          <button
            type="button"
            onClick={applyDiscountCode}
            disabled={!discountCode || loading}
            className="px-5 bg-[#003580] text-white font-semibold rounded-lg hover:bg-[#002752] transition disabled:opacity-50"
          >
            {loading ? "..." : "Áp dụng"}
          </button>
        </div>
        {discountResult && (
          <p className="text-green-600 text-sm mt-2">
            Giảm {discountResult.appliedDiscounts?.reduce((s, d) => s + d.discount, 0).toLocaleString()} VND
          </p>
        )}
      </div>

      {/* Dịch vụ */}

      {availableServices.length > 0 && (
        <div className="mt-6">

          {/* Danh sách dịch vụ muốn hiển thị giống Booking.com */}
          {(() => {
            const featuredNames = [
              "Đưa đón sân bay",
              "Thuê xe",
              "Bữa sáng"
            ];

            // Lọc theo tên dịch vụ trong DB
            const filteredServices = availableServices.filter((s) =>
              featuredNames.includes(s.name)
            );

            return (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Thêm vào kỳ nghỉ của bạn
                </h3>

                <div className="space-y-3">
                  {filteredServices.map((service) => (
                    <label
                      key={service._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service._id)}
                          onChange={() => handleServiceChange(service._id)}
                          className="w-5 h-5 text-[#003580] rounded focus:ring-[#003580]"
                        />
                        <div>
                          <p className="text-gray-800 font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">
                            Dịch vụ thêm tùy chọn
                          </p>
                        </div>
                      </div>

                      <span className="text-gray-800 font-semibold">
                        {service.price.toLocaleString()} VND
                      </span>
                    </label>
                  ))}

                  {filteredServices.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      Khách sạn không có dịch vụ tùy chọn phù hợp.
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}




      {/* Yêu cầu đặc biệt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Yêu cầu đặc biệt (không bắt buộc)
        </label>
        <textarea
          {...register("specialRequest")}
          rows={3}
          placeholder="Ví dụ: Phòng yên tĩnh, tầng cao..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580]"
        />
      </div>

      {/* Nút đặt phòng */}
      <button
        type="submit"
        disabled={loading || roomWarning}
        className="w-full bg-[#feba02] hover:bg-[#e5a800] text-[#003580] font-bold text-lg py-4 rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "HOÀN TẤT ĐẶT PHÒNG"}
      </button>

      {bookingStatus?.type === "success" && (
        <p className="text-center text-green-600 font-medium">
          {bookingStatus.message}
        </p>
      )}
    </form>
  );
}