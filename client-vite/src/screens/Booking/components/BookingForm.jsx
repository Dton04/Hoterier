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
  room,
  setRoomsNeeded,
  setValue,
}) {
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");


  useEffect(() => {
  try {
    const bookingInfo = JSON.parse(localStorage.getItem("bookingInfo"));
    if (bookingInfo?.checkin && bookingInfo?.checkout) {
      const checkin = bookingInfo.checkin.split("T")[0];
      const checkout = bookingInfo.checkout.split("T")[0];

      setCheckinDate(checkin);
      setCheckoutDate(checkout);

      // ✅ Đồng bộ với react-hook-form để Yup validation nhận được
      if (typeof setValue === "function") {
        setValue("checkin", checkin);
        setValue("checkout", checkout);
      }
    }
  } catch (error) {
    console.error("Không thể đọc bookingInfo từ localStorage:", error);
  }
}, [setValue]);





  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100"
    >
      {/* Thông tin cá nhân */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Họ và tên"
            {...register("name")}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.name ? "border-red-500" : "border-gray-300"
              }`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.email ? "border-red-500" : "border-gray-300"
              }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="tel"
            placeholder="Số điện thoại"
            {...register("phone")}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.phone ? "border-red-500" : "border-gray-300"
              }`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <select
            {...register("roomType")}
            className={`w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.roomType ? "border-red-500" : "border-gray-300"
              }`}
          >
            <option value="">Chọn loại phòng</option>
            <option value={room?.type}>{room?.type}</option>
          </select>
          {errors.roomType && (
            <p className="text-red-500 text-sm mt-1">
              {errors.roomType.message}
            </p>
          )}
        </div>
      </div>

      {/* Ngày nhận & trả phòng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Nhận phòng (từ 14:00)
          </label>
          <input
            type="date"
            id="checkin"
            value={checkinDate}
            onChange={(e) => {
              setCheckinDate(e.target.value);
              setValue("checkin", e.target.value); //cập nhật cho react-hook-form
            }}
            {...register("checkin", { required: "Vui lòng chọn ngày nhận phòng" })}
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.checkin ? "border-red-500" : "border-gray-300"
              }`}
          />

          {errors.checkin && (
            <p className="text-red-500 text-sm mt-1">
              {errors.checkin.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">
            Trả phòng (trước 12:00)
          </label>
          <input
            type="date"
            id="checkout"
            value={checkoutDate}
            onChange={(e) => {
              setCheckoutDate(e.target.value);
              setValue("checkout", e.target.value);
            }}
            {...register("checkout", { required: "Vui lòng chọn ngày trả phòng" })}
            required
            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.checkout ? "border-red-500" : "border-gray-300"
              }`}
          />
          {errors.checkout && (
            <p className="text-red-500 text-sm mt-1">
              {errors.checkout.message}
            </p>
          )}
        </div>
      </div>

      {/* Số lượng người và phòng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <select
            {...register("adults")}
            className={`w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${errors.adults ? "border-red-500" : "border-gray-300"
              }`}
          >
            <option value="">Người lớn</option>
            {[...Array(10).keys()].map((n) => (
              <option key={n + 1} value={n + 1}>
                {n + 1} người
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            {...register("children")}
            className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          >
            {[...Array(10).keys()].map((n) => (
              <option key={n} value={n}>
                {n} trẻ em
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            {...register("roomsBooked")}
            onChange={(e) => setRoomsNeeded(Number(e.target.value))}
            className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          >
            <option value="">Số phòng</option>
            {[...Array(room?.quantity || 1).keys()].map((n) => (
              <option key={n + 1} value={n + 1}>
                {n + 1} phòng
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Phương thức thanh toán */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Phương thức thanh toán
        </label>
        <select
          {...register("paymentMethod")}
          className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
        >
          <option value="cash">Tiền mặt</option>
          <option value="credit_card">Thẻ tín dụng</option>
          <option value="bank_transfer">Chuyển khoản</option>
          <option value="mobile_payment">MoMo</option>
          <option value="vnpay">VNPay</option>
        </select>
      </div>

      {/* Mã giảm giá */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Mã giảm giá</label>
        <div className="flex">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Nhập mã"
            className="flex-1 border rounded-l-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          />
          <button
            type="button"
            onClick={applyDiscountCode}
            disabled={!discountCode || loading}
            className="px-4 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Áp dụng"}
          </button>
        </div>
        {discountResult && (
          <p className="text-green-600 text-sm mt-2">
            Mã giảm giá hợp lệ: Giảm{" "}
            {discountResult?.appliedDiscounts
              ?.reduce((sum, d) => sum + d.discount, 0)
              .toLocaleString()}{" "}
            VND
          </p>
        )}
      </div>

      {/* Dịch vụ */}
      <div>
        <label className="block text-sm text-gray-600 mb-2">
          Dịch vụ bổ sung
        </label>
        {availableServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {availableServices.map((service) => (
              <label
                key={service._id}
                className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg hover:bg-blue-50 transition"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service._id)}
                  onChange={() => handleServiceChange(service._id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  {service.name} (
                  {service.price?.toLocaleString() || 0} VND)
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Không có dịch vụ khả dụng</p>
        )}
      </div>

      {/* Ghi chú */}
      <textarea
        {...register("specialRequest")}
        placeholder="Yêu cầu đặc biệt (nếu có)"
        rows="3"
        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
      ></textarea>

      {/* Nút đặt phòng */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "ĐẶT PHÒNG NGAY"}
      </button>

      {bookingStatus?.type === "success" && (
        <p className="text-green-600 text-center text-sm mt-2">
          {bookingStatus.message}
        </p>
      )}
    </form>
  );
}
