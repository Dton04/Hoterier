import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export default function BookingHeader({ currentStep = 1, timeRemaining }) {
  const steps = [
    { id: 1, title: "Bạn chọn" },
    { id: 2, title: "Chi tiết về bạn" },
    { id: 3, title: "Hoàn tất đặt phòng" },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-center gap-10 md:gap-16">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;
            return (
              <div key={step.id} className="flex items-center gap-2 md:gap-3 relative">
                {/* Vòng tròn số bước */}
                <div
                  className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full font-semibold text-xs md:text-sm transition-all ${
                    isDone
                      ? "bg-[#0071c2] text-white"
                      : isActive
                      ? "bg-[#003580] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : step.id}
                </div>

                {/* Tiêu đề bước */}
                <span
                  className={`text-[13px] md:text-[14px] font-medium ${
                    isActive
                      ? "text-[#003580]"
                      : isDone
                      ? "text-[#0071c2]"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>

                {/* Đường nối giữa các bước */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-10 md:w-16 h-[2px] mx-1 md:mx-2 ${
                      isDone ? "bg-[#0071c2]" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thanh giữ giá */}
        {timeRemaining && (
          <div className="mt-3 bg-[#fff8e6] border border-yellow-300 rounded-md py-2 text-center text-xs md:text-sm">
            <div className="flex justify-center items-center gap-2 text-[#b45309] font-medium">
              <Clock size={14} />
              <span>
                Chúng tôi đang giữ giá cho quý khách trong{" "}
                <span className="font-semibold">{timeRemaining}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
