import React from "react";

export default function PaymentInfo({
  bankInfo,
  paymentStatus,
  timeRemaining,
  paymentExpired,
  handleSimulatePayment,
  handleCheckPaymentStatus,
  loading,
}) {
  if (!bankInfo) return null;

  return (
    <div className="mt-6 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold text-blue-700 mb-3">
        Thông tin thanh toán
      </h3>

      <div className="space-y-2 text-gray-700">
        <p>
          <strong>Ngân hàng:</strong> {bankInfo.bankName}
        </p>
        <p>
          <strong>Số tài khoản:</strong> {bankInfo.accountNumber}
        </p>
        <p>
          <strong>Chủ tài khoản:</strong> {bankInfo.accountHolder}
        </p>
        <p>
          <strong>Số tiền:</strong>{" "}
          {bankInfo.amount?.toLocaleString()} VND
        </p>
        <p>
          <strong>Nội dung chuyển khoản:</strong> {bankInfo.content}
        </p>

        {timeRemaining !== null && !paymentExpired && (
          <p className="text-sm text-blue-600">
            ⏱ Còn lại:{" "}
            <strong>
              {Math.floor(timeRemaining / 60)} phút {timeRemaining % 60} giây
            </strong>
          </p>
        )}

        <p className="text-yellow-600 text-sm mt-2">
          Vui lòng chuyển khoản đúng nội dung để hoàn tất thanh toán.
        </p>
      </div>

      {!paymentExpired && paymentStatus === "pending" && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Giả lập thanh toán thành công"}
          </button>

          <button
            onClick={handleCheckPaymentStatus}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Kiểm tra trạng thái"}
          </button>
        </div>
      )}
    </div>
  );
}
