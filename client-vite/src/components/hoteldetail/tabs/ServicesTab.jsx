import React, { useState } from "react";
import { iconForAmenity } from "../../../utils/amenityIcons";
import { X } from "lucide-react";

export default function ServicesTab({ services = [], amenities = [] }) {
  const [open, setOpen] = useState(false);


  // Gộp tất cả dịch vụ + tiện nghi phòng
  const allFeatures = [
    ...services.map((s) => ({ name: s.name, description: s.description })),
    ...amenities.map((a) =>
      typeof a === "string" ? { name: a } : { name: a.name }
    ),
  ];

  const topServices = services.slice(0, 8);
  // Nhóm tiện nghi theo loại (Booking-style grouping)
  const grouped = allFeatures.reduce((acc, f) => {
    const group = f.name.match(/phòng|giường|máy lạnh|ban công|tủ|TV màn hình phẳng|View đẹp|Thang máy/i)
      ? "Phòng"
      : f.name.match(/tắm|vòi sen|máy sấy|vệ sinh/i)
        ? "Phòng tắm"
        : f.name.match(/wifi|internet/i)
          ? "Internet"
          : f.name.match(/xe|đỗ xe|bãi đỗ/i)
            ? "Chỗ đậu xe"
            : f.name.match(/trợ giúp|Lễ tân 24 giờ|check-in|check out/i)
              ? "Dịch vụ lễ tân"
              : f.name.match(/hồ bơi|gym|phòng tập|spa|xông hơi/i)
                ? "Chăm sóc sức khỏe"
                : f.name.match(/lau dọn|ủi|giặt|vệ sinh/i)
                  ? "Dịch vụ lau dọn"
                  : f.name.match(/an ninh|camera|báo cháy/i)
                    ? "An ninh"
                    : "Tổng quát";
    if (!acc[group]) acc[group] = [];
    acc[group].push(f);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">
        Các tiện nghi được ưa chuộng nhất
      </h3>

      {services.length === 0 ? (
        <p className="text-gray-600 text-sm">Chưa có dữ liệu dịch vụ.</p>
      ) : (
        <div className="flex flex-wrap gap-3 items-center">
          {topServices.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-gray-800 px-3 py-1.5 rounded-full text-sm shadow-sm hover:bg-green-100 transition"
            >
              <span className="w-4 h-4 flex items-center justify-center text-green-600">
                {iconForAmenity(s.name)}
              </span>
              <span>{s.name}</span>
            </div>
          ))}

          {services.length > 0 && (
            <button
              onClick={() => setOpen(true)}
              className="text-sm text-blue-600 hover:underline ml-2 font-medium"
            >
              + Xem tất cả {services.length} tiện nghi
            </button>
          )}
        </div>
      )}

      {/* ✅ Modal kiểu Booking.com */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay mờ */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          ></div>

          {/* Bảng bên phải */}
          <div className="relative bg-white w-full md:w-[55%] h-full overflow-y-auto shadow-2xl border-l border-gray-200 animate-slide-left">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b bg-gray-50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Các tiện nghi của khách sạn
                </h3>
                <p className="text-sm text-gray-500">
                  Tiện nghi tuyệt vời! Tổng cộng {services.length} dịch vụ
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Danh sách tiện nghi chi tiết */}
            <div className="p-6 space-y-8">
              {/* ✅ Hiển thị top ưa chuộng trước */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-base">
                  Các tiện nghi được ưa chuộng nhất
                </h4>
                <div className="flex flex-wrap gap-3">
                  {topServices.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-green-50 border border-green-200 text-gray-800 px-3 py-1.5 rounded-full text-sm"
                    >
                      <span className="text-green-600 w-4 h-4 flex items-center justify-center">
                        {iconForAmenity(s.name)}
                      </span>
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

             {/* ✅ Hiển thị theo nhóm 2 cột như Booking.com */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
  {/* Cột trái */}
  <div className="space-y-8">
    {Object.entries(grouped)
      .slice(0, Math.ceil(Object.keys(grouped).length / 2))
      .map(([category, items]) => (
        <div key={category}>
          <h4 className="font-semibold text-gray-900 mb-2 text-base border-b pb-1">
            {category}
          </h4>
          <ul className="space-y-1">
            {items.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="mt-1 text-green-600 flex items-center">
                  {iconForAmenity(s.name)}
                </div>
                <span className="text-gray-700 text-sm">{s.name}</span>
                {s.description && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({s.description})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
  </div>

  {/* Cột phải */}
  <div className="space-y-8">
    {Object.entries(grouped)
      .slice(Math.ceil(Object.keys(grouped).length / 2))
      .map(([category, items]) => (
        <div key={category}>
          <h4 className="font-semibold text-gray-900 mb-2 text-base border-b pb-1">
            {category}
          </h4>
          <ul className="space-y-1">
            {items.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <div className="mt-1 text-green-600 flex items-center">
                  {iconForAmenity(s.name)}
                </div>
                <span className="text-gray-700 text-sm">{s.name}</span>
                {s.description && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({s.description})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
  </div>
</div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ✅ Thêm animation mượt khi mở bảng */
const style = document.createElement("style");
style.innerHTML = `
@keyframes slide-left {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-left {
  animation: slide-left 0.3s ease forwards;
}
`;
document.head.appendChild(style);
