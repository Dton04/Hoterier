import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);



  // 🟢 Kiểm tra đăng nhập
  const checkLoginStatus = async () => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (!storedUserInfo) return;
    const userInfo = JSON.parse(storedUserInfo);
    const userData = userInfo.user || userInfo;

    if (userData?.name && userData?.token) {
      setIsLoggedIn(true);
      setUser(userData);
      try {
        const config = { headers: { Authorization: `Bearer ${userData.token}` } };
        const res = await axios.get("/api/users/points", config);
        setPoints(res.data.points);
      } catch (err) {
        console.error("Lỗi lấy điểm:", err);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setPoints(0);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, [location]);







  const closeNav = () => {
    setNavOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setIsLoggedIn(false);
    setUser(null);
    setPoints(0);
    navigate("/home");
  };

  const handlePointsClick = () => {
    closeNav();
    navigate("/points");
  };

  return (
    <header
      className={`relative top-0 left-0 w-full text-white z-50 backdrop-blur-md
    bg-[#003580] `}
      style={{
        opacity: showNavbar ? 1 : 0,
      }}
    >

      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        {/* 🏨 Logo */}
        <Link
          to="/home"
          className="text-2xl font-bold flex items-center gap-2 -ml-4 hover:opacity-90 transition"
          onClick={closeNav}
        >
          <i className="fas fa-hotel text-white"></i> HOTELIER
        </Link>

        {/* 🧭 Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link
            to="/home"
            className={`pb-2 hover:text-[#febb02] ${["/home", "/"].includes(location.pathname)
                ? "border-b-2 border-[#febb02]"
                : ""
              }`}
          >
            Trang chủ
          </Link>
          <Link
            to="/room-results"
            className={`pb-2 hover:text-[#febb02] ${location.pathname === "/room-results" ? "border-b-2 border-[#febb02]" : ""
              }`}
          >
            Khách sạn & Phòng
          </Link>
          <Link
            to="/discounts"
            className={`pb-2 hover:text-[#febb02] ${location.pathname === "/discounts"
                ? "border-b-2 border-[#febb02]"
                : ""
              }`}
          >
            Ưu đãi
          </Link>
          <Link
            to="/contact"
            className={`pb-2 hover:text-[#febb02] ${location.pathname === "/contact"
                ? "border-b-2 border-[#febb02]"
                : ""
              }`}
          >
            Liên hệ
          </Link>
        </nav>

        {/* 👤 User menu */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 bg-[#003580] hover:bg-[#004080] hover:text-[#febb02] font-medium"
                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
              >
                <img
                  src={
                    user?.avatar
                      ? `http://localhost:5000/${user.avatar.replace(/^\/+/, "")}`
                      : "https://cf.bstatic.com/static/img/avatar/booking_avatar_40x40/99e8e7b26f5de94b82e8be93d93cf5b5b7b33eea.png"
                  }
                  alt="avatar"
                  className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                />

                <span className="text-sm font-semibold">{user.name}</span>
                <i className="fas fa-chevron-down text-xs mt-0.5"></i>
              </button>

              {isUserDropdownOpen && (
                <ul className="absolute right-0 mt-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-md w-56 z-50">
                  {user.role === "admin" && (
                    <li>
                      <Link
                        to="/admin/dashboard"
                        onClick={closeNav}
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        <i className="fas fa-tachometer-alt mr-2 text-green-500"></i>
                        Bảng điều khiển
                      </Link>
                    </li>
                  )}

                  {user.role === "user" && (
                    <>
                      <li>
                        <Link
                          to="/bookings"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-bed mr-2 text-blue-500"></i>Đặt phòng
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/favorites"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-heart mr-2 text-red-500"></i>Yêu thích
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handlePointsClick}
                          className="w-full text-left block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-coins mr-2 text-yellow-500"></i>
                          Điểm thưởng ({points})
                        </button>
                      </li>
                    </>
                  )}

                  <li>
                    <Link
                      to="/profile"
                      onClick={closeNav}
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      <i className="fas fa-user mr-2"></i>Hồ sơ
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-white text-[#003580] font-semibold px-4 py-1.5 rounded-md hover:bg-gray-100 transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-[#0071c2] text-white px-4 py-1.5 rounded-md font-semibold hover:bg-[#005fa3] transition"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* 📱 Mobile */}
         <button
  onClick={() => setNavOpen(!isNavOpen)}
  className="md:hidden ml-3 p-2.5 border border-white text-white rounded-full hover:bg-white hover:text-[#003580] transition-all duration-300"
>
  <i className="fas fa-bars text-lg"></i>
</button>


        </div>
      </div>

      {/* 📱 Mobile Nav */}
      {isNavOpen && (
        <div className="md:hidden bg-[#003580] border-t border-[#febb02] py-3 px-6 text-white">
          <nav className="flex flex-col gap-3">
            <Link to="/home" onClick={closeNav}>Trang chủ</Link>
            <Link to="/room-results" onClick={closeNav}>Khách sạn & Phòng</Link>
            <Link to="/discounts" onClick={closeNav}>Ưu đãi</Link>
            <Link to="/contact" onClick={closeNav}>Liên hệ</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
