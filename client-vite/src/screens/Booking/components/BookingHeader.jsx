import React from "react";
import { CheckCircle, Clock } from "lucide-react";

export default function BookingHeader({ currentStep = 1, timeRemaining }) {
  const steps = [
    { id: 1, title: "Bạn chọn" },
    { id: 2, title: "Chi tiết về bạn" },
    { id: 3, title: "Đã xác nhận đặt chỗ!" },
  ];

  return (
    <div className=" p-4 mb-10">
      <div className="flex items-center justify-center gap-10 md:gap-16">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : isDone
                  ? "text-blue-500"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : isDone
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {isDone ? <CheckCircle size={16} /> : step.id}
              </div>
              <span className="text-sm md:text-base">{step.title}</span>

              {index < steps.length - 1 && (
                <div className="hidden md:block w-20 h-[2px] bg-gray-300 mx-2"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Thanh thông báo giữ chỗ và đếm ngược */}
      {timeRemaining && (
        <div className="mt-5 bg-orange-50 border border-orange-200 text-center py-3 rounded-md text-sm text-gray-700">
          <div className="flex justify-center items-center gap-2 text-red-600 font-medium">
            <Clock size={16} />
            <span>
              Chúng tôi đang giữ giá cho quý khách...{" "}
              <span className="font-semibold text-red-600">
                {timeRemaining}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
