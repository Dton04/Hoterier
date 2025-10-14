import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", { email, password });

      if (response.data.redirect) {
        navigate(response.data.redirect);
      } else if (response.data.user) {
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        window.dispatchEvent(new Event("storage"));
        setSuccess("Đăng nhập thành công!");
        navigate("/home");
      } else {
        setError("Không nhận được phản hồi hợp lệ từ server.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/users/google";
  };

  const handleFacebookLogin = () => {
    window.location.href = "http://localhost:5000/api/users/facebook";
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md transition hover:-translate-y-1">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 uppercase tracking-wide">
          Đăng Nhập
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 rounded-md p-3 mb-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 border border-green-400 rounded-md p-3 mb-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
            />
          </div>

          <div className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Đăng nhập bằng Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-4 bg-[#4285F4] hover:bg-[#357ae8] text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Đăng nhập bằng Google
        </button>

        {/* Đăng nhập bằng Facebook */}
        <button
          onClick={handleFacebookLogin}
          disabled={loading}
          className="w-full mt-2 bg-[#1877F2] hover:bg-[#145dbf] text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Đăng nhập bằng Facebook
        </button>

        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Đăng ký tại đây
            </Link>
          </p>
          <p className="mt-2">
            <Link to="/" className="text-blue-600 hover:underline">
              Quay lại trang chủ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
