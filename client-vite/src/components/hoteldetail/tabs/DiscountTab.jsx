import React from "react";

export default function DiscountTab({ discounts = [] }) {
  const activeDiscounts = discounts.filter((d) => d.isActive);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Ưu đãi & Voucher</h2>

      {activeDiscounts.length === 0 ? (
        <p className="text-gray-600">Hiện chưa có ưu đãi nào được áp dụng.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDiscounts.map((d) => (
            <div
              key={d._id}
              className="p-5 border rounded-xl shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
                  Mã: {d.code}
                </span>
                <span className="text-xs text-gray-600">
                  Hạn: {new Date(d.endDate).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-blue-700 mt-3">{d.name || "Ưu đãi đặc biệt"}</h3>
              <p className="text-gray-700 mt-1">{d.description}</p>

              <div className="mt-3">
                {d.discountPercent ? (
                  <p className="text-green-600 font-bold text-xl">
                    Giảm {d.discountPercent}% 🎉
                  </p>
                ) : (
                  <p className="text-green-600 font-bold text-xl">
                    Giảm {d.discountAmount?.toLocaleString()}₫ 🎉
                  </p>
                )}
              </div>

              {d.minBookingAmount && (
                <p className="text-sm text-gray-600 mt-1">
                  Áp dụng cho đơn từ {d.minBookingAmount.toLocaleString()}₫
                </p>
              )}

              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                onClick={() => navigator.clipboard.writeText(d.code)}
              >
                Sao chép mã
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
