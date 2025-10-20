import React from "react";

export default function PointsEarned({ pointsEarned }) {
  if (!pointsEarned) return null;

  return (
    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 shadow-sm">
      <h4 className="font-semibold text-lg">🎉 Chúc mừng!</h4>
      <p className="mt-1">
        Bạn đã nhận được{" "}
        <span className="font-bold text-green-800">{pointsEarned}</span> điểm thưởng
        cho lần đặt phòng này.
      </p>
    </div>
  );
}
