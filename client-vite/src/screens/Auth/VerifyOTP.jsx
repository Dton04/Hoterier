import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Vui lòng nhập đủ 6 số OTP");

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", {
        email,
        otp: code,
      });

      localStorage.setItem("userInfo", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.user.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Xác minh OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center transition hover:-translate-y-1">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 uppercase tracking-wide">
          Xác nhận mã OTP
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Mã OTP đã được gửi đến email:{" "}
          <span className="text-blue-600 font-semibold">{email}</span>
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 rounded-md p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Ô nhập OTP */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={loading}
              className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
            />
          ))}
        </div>

        {/* Nút xác nhận */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold text-sm transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-700 hover:opacity-90"
          }`}
        >
          {loading ? "Đang xác nhận..." : "Xác nhận"}
        </button>

        <p className="text-gray-600 text-sm mt-6">
          Không nhận được mã?{" "}
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 font-medium hover:underline"
          >
            Gửi lại
          </button>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
