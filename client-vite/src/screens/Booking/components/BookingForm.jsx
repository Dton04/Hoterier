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
}) {
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");

  useEffect(() => {
    try {
      const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
      if (!bookingInfo) return;

      const checkin = bookingInfo.checkin?.split("T")[0] || "";
      const checkout = bookingInfo.checkout?.split("T")[0] || "";

      setCheckinDate(checkin);
      setCheckoutDate(checkout);
      setValue?.("checkin", checkin);
      setValue?.("checkout", checkout);
      setValue?.("adults", bookingInfo.adults || 2);
      setValue?.("children", bookingInfo.children ?? 0);
      bookingInfo.rooms && setRoomsNeeded?.(Number(bookingInfo.rooms));
    } catch (error) {
      console.error("Lỗi đọc bookingInfo:", error);
    }
  }, [setValue, setRoomsNeeded]);

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

      {/* Ngày nhận/trả phòng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Nhận phòng (từ 14:00)
          </label>
          <input
            type="date"
            value={checkinDate}
            onChange={(e) => {
              setCheckinDate(e.target.value);
              setValue("checkin", e.target.value);
            }}
            {...register("checkin")}
            className={`w-full border ${errors.checkin ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580] focus:border-[#003580]`}
          />
          {errors.checkin && (
            <p className="text-red-500 text-xs mt-1">{errors.checkin.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Trả phòng (trước 12:00)
          </label>
          <input
            type="date"
            value={checkoutDate}
            onChange={(e) => {
              setCheckoutDate(e.target.value);
              setValue("checkout", e.target.value);
            }}
            {...register("checkout")}
            className={`w-full border ${errors.checkout ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580] focus:border-[#003580]`}
          />
          {errors.checkout && (
            <p className="text-red-500 text-xs mt-1">{errors.checkout.message}</p>
          )}
        </div>
      </div>

      {/* Số người & trẻ em */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người lớn
          </label>
          <select
            {...register("adults")}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580]"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n} người</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trẻ em
          </label>
          <select
            {...register("children")}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#003580]"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} trẻ</option>
            ))}
          </select>
        </div>
      </div>

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dịch vụ bổ sung
          </label>
          <div className="space-y-2">
            {availableServices.map((service) => (
              <label
                key={service._id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service._id)}
                    onChange={() => handleServiceChange(service._id)}
                    className="w-4 h-4 text-[#003580] rounded focus:ring-[#003580]"
                  />
                  <span className="text-gray-800">{service.name}</span>
                </div>
                <span className="font-medium text-gray-700">
                  {service.price.toLocaleString()} VND
                </span>
              </label>
            ))}
          </div>
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
        disabled={loading}
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