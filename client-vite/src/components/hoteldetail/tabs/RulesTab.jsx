import React from "react";
import { Clock, Info, CheckSquare, Users } from "lucide-react";

export default function RulesTab({ hotel }) {
  // hotel may contain rules text or structured data; fall back to defaults
  const rules = hotel?.rules || {};

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4">Quy tắc chung</h2>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <Clock size={20} />
          </div>
          <div>
            <div className="font-medium">Nhận phòng</div>
            <div className="text-sm text-gray-600">Từ 14:00</div>
            <div className="text-sm text-gray-500">{rules.checkIn || "Khách được yêu cầu xuất trình giấy tờ tùy thân có ảnh khi nhận phòng."}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <Clock size={20} />
          </div>
          <div>
            <div className="font-medium">Trả phòng</div>
            <div className="text-sm text-gray-600">Đến 12:00</div>
            <div className="text-sm text-gray-500">{rules.checkOut || "Khách vui lòng trả phòng trước thời gian quy định."}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <Info size={20} />
          </div>
          <div>
            <div className="font-medium">Hủy đặt phòng / Trả trước</div>
            <div className="text-sm text-gray-500">{rules.cancellation || "Các chính sách hủy và thanh toán trước có thể khác nhau tùy vào loại phòng. Vui lòng kiểm tra điều kiện của mỗi lựa chọn."}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="font-medium">Đặt cọc để phòng hư hại có thể hoàn lại</div>
            <div className="text-sm text-gray-500">{rules.deposit || "Khách sạn có thể yêu cầu tiền đặt cọc khi nhận phòng. Số tiền và hình thức hoàn trả tùy vào chính sách khách sạn."}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md">
            <Users size={20} />
          </div>
          <div>
            <div className="font-medium">Trẻ em và giường</div>
            <div className="text-sm text-gray-500">{rules.children || "Trẻ em được chào đón. Phụ thu hoặc quy định giường phụ có thể áp dụng."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
