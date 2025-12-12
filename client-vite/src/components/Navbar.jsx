import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { connectSocket } from "../utils/chatApi";
import { FiBell } from "react-icons/fi";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socketRef, setSocketRef] = useState(null);
  const expiryTimersRef = useRef({});

  //Kiểm tra đăng nhập
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

  // 🚫 Khóa cuộn nền khi mở menu
  useEffect(() => {
    document.body.style.overflow = isNavOpen ? "hidden" : "auto";
  }, [isNavOpen]);

  // 🔔 Realtime notifications với socket.io
  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null;
    const token = userInfo?.user?.token || userInfo?.token;
    const lastSeenKey = "notif_last_seen";
    const resolveUserId = () => {
      try {
        const raw = localStorage.getItem("userInfo");
        if (!raw) return null;
        const info = JSON.parse(raw);
        const u = info?.user || info;
        return u?._id || u?.id || null;
      } catch {
        return null;
      }
    };
    const hasRecipient = (n) => {
      const rid = n?.recipientId || n?.recipient_id || n?.userId || n?.user_id || n?.targetUserId || n?.target_user_id || n?.user;
      return !!rid;
    };
    const isSystemNotif = (n) => {
      // Chỉ coi là hệ thống chung khi audience='all' hoặc không có người nhận cụ thể
      if (n?.audience === 'all') return true;
      if (n?.isSystem || n?.category === 'system') {
        return !hasRecipient(n);
      }
      return false;
    };
    const extractRecipientId = (n) => n?.recipientId || n?.recipient_id || n?.userId || n?.user_id || n?.targetUserId || n?.target_user_id || n?.user || null;
    const shouldKeepNotif = (n, uid) => {
      if (isSystemNotif(n)) return true;
      if (!uid) return false;
      const rid = extractRecipientId(n);
      if (!rid) return false;
      return String(rid) === String(uid);
    };

    const updateHasNewFromList = (list) => {
      const lastSeen = localStorage.getItem(lastSeenKey);
      const latestAt = list?.[0]?.createdAt || list?.[0]?.created_at;
      if (latestAt && (!lastSeen || new Date(latestAt).getTime() > Number(lastSeen))) {
        setHasNewNotif(true);
      }
    };

    const scheduleExpiry = (n) => {
      try {
        const id = n?._id || `${n.message}-${n.createdAt}`;
        if (!id) return;
        if (expiryTimersRef.current[id]) return;
        const endsAtTs = n?.endsAt ? new Date(n.endsAt).getTime() : null;
        const nowTs = Date.now();
        if (!endsAtTs || endsAtTs <= nowTs) return;
        const delay = endsAtTs - nowTs;
        const timer = setTimeout(() => {
          setNotifications((prev) => {
            const next = prev.filter((x) => (x?._id || `${x.message}-${x.createdAt}`) !== id);
            try { localStorage.setItem("notif_cache", JSON.stringify(next)); } catch { }
            return next;
          });
          delete expiryTimersRef.current[id];
        }, delay);
        expiryTimersRef.current[id] = timer;
      } catch { }
    };

    const fetchFeed = async () => {
      try {
        if (token) {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const res = await axios.get("/api/notifications/feed", config);
          const list = Array.isArray(res.data) ? res.data : res.data?.notifications || [];
          const now = Date.now();
          const base = list.filter(n => (
            (!n.startsAt || new Date(n.startsAt).getTime() <= now) &&
            (!n.endsAt || new Date(n.endsAt).getTime() >= now) &&
            !n.isOutdated
          ));
          const uid = resolveUserId();
          const filtered = base.filter(n => shouldKeepNotif(n, uid));
          setNotifications(filtered);
          filtered.forEach(scheduleExpiry);
          updateHasNewFromList(filtered);
          try { localStorage.setItem("notif_cache", JSON.stringify(filtered)); } catch { }
        } else {
          const res = await axios.get("/api/notifications/public/latest");
          const list = res.data ? [res.data] : [];
          const now = Date.now();
          const filtered = list.filter(n => (
            (!n.startsAt || new Date(n.startsAt).getTime() <= now) &&
            (!n.endsAt || new Date(n.endsAt).getTime() >= now) &&
            !n.isOutdated
          ));
          setNotifications(filtered);
          filtered.forEach(scheduleExpiry);
          updateHasNewFromList(filtered);
          try { localStorage.setItem("notif_cache", JSON.stringify(filtered)); } catch { }
        }
      } catch (e) { }
    };

    try {
      const cachedRaw = localStorage.getItem("notif_cache");
      const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      if (Array.isArray(cached) && cached.length) {
        const uid = resolveUserId();
        const filtered = cached.filter(n => shouldKeepNotif(n, uid));
        setNotifications(filtered);
        updateHasNewFromList(filtered);
      }
    } catch { }

    fetchFeed();

    if (token) {
      const s = connectSocket(token);
      s.on("connect_error", (err) => { console.error("Socket connect_error", err?.message || err); });
      s.on("disconnect", (reason) => { console.warn("Socket disconnected", reason); });
      s.on("notification:expired", (payload) => {
        const id = payload?._id || payload?.id || null;
        setNotifications((prev) => {
          const next = prev.filter((x) => (x?._id || x?.id) !== id);
          try { localStorage.setItem("notif_cache", JSON.stringify(next)); } catch { }
          return next;
        });
        if (id) {
          const t = expiryTimersRef.current[id];
          if (t) {
            clearTimeout(t);
            delete expiryTimersRef.current[id];
          }
        }
      });
      s.on("notification:new", (payload) => {
        const uid = resolveUserId();
        if (!shouldKeepNotif(payload, uid)) return;
        const now = Date.now();
        const startOk = !payload.startsAt || new Date(payload.startsAt).getTime() <= now;
        const endOk = !payload.endsAt || new Date(payload.endsAt).getTime() >= now;
        if (payload.isOutdated || !endOk) return;
        if (!startOk) {
          const delay = new Date(payload.startsAt).getTime() - now;
          if (delay > 0) {
            setTimeout(() => {
              setNotifications((prev) => {
                const next = [payload, ...prev].slice(0, 10);
                try { localStorage.setItem("notif_cache", JSON.stringify(next)); } catch { }
                return next;
              });
              setHasNewNotif(true);
              scheduleExpiry(payload);
            }, delay);
          }
          return;
        }
        setNotifications((prev) => {
          const next = [payload, ...prev].slice(0, 10);
          try { localStorage.setItem("notif_cache", JSON.stringify(next)); } catch { }
          return next;
        });
        scheduleExpiry(payload);
        setHasNewNotif(true);
      });
      setSocketRef(s);
      return () => {
        Object.values(expiryTimersRef.current).forEach((t) => clearTimeout(t));
        expiryTimersRef.current = {};
        s.disconnect();
      };
    }
  }, [isLoggedIn]);

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

  const handleNotificationsClick = async () => {
    setNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      const now = Date.now();
      localStorage.setItem("notif_last_seen", String(now));
      setHasNewNotif(false);
    }
  };

  return (
    <header className="relative top-0 left-0 w-full text-white z-[999] bg-[#003580]">

      <div className="max-w-7xl mx-auto flex justify-between items-center px-5 py-3">
        {/* 🏨 Logo */}
        <Link
          to="/home"
          onClick={closeNav}
          className="text-2xl font-bold flex items-center gap-2 hover:opacity-90 transition"
        >
          <i className="fas fa-hotel text-white"></i> HOTELIER
        </Link>

        {/* 🌐 Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          {[
            { path: "/home", label: "Trang chủ" },
            { path: "/hotel-results", label: "Khách sạn & Phòng" },
            { path: "/discounts", label: "Ưu đãi" },
            { path: "/contact", label: "Liên hệ" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`pb-2 hover:text-[#febb02] ${location.pathname === item.path ||
                (item.path === "/home" && location.pathname === "/")
                ? "border-b-2 border-[#febb02]"
                : ""
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 👤 User menu + Mobile button */}
        <div className="flex items-center gap-3">
          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              className="flex items-center gap-2 hover:text-[#febb02] font-medium bg-[#003580]"
              onClick={handleNotificationsClick}
            >
              <FiBell className="text-white" />
            </button>
            {hasNewNotif && (
              <span className="absolute -top-1 -right-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>
            )}
            {isNotifOpen && (
              <ul className="absolute right-0 mt-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-md w-72 z-50 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500">Không có thông báo</li>
                ) : (
                  notifications.map((n, idx) => (
                    <li key={idx} className="px-4 py-2 hover:bg-gray-100">
                      {n.isSystem || n.category === 'system' ? (
                        <div>
                          <div className="text-sm font-semibold">{n.message}</div>
                          {n.hotelName && (
                            <div className="text-xs text-gray-700">Khách sạn: {n.hotelName}</div>
                          )}
                          {(n.checkin || n.checkout) && (
                            <div className="text-xs text-gray-700">Ngày: {n.checkin ? new Date(n.checkin).toLocaleString('vi-VN') : ''} → {n.checkout ? new Date(n.checkout).toLocaleString('vi-VN') : ''}</div>
                          )}
                          {(n.adults || n.children || n.roomsBooked) && (
                            <div className="text-xs text-gray-700">Khách: {n.adults || 0} người lớn, {n.children || 0} trẻ em, {n.roomsBooked || 1} phòng</div>
                          )}
                          {typeof n.amountPaid === 'number' && n.amountPaid > 0 && (
                            <div className="text-xs text-gray-700">Thanh toán: {Number(n.amountPaid).toLocaleString('vi-VN')} VND</div>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1">{new Date(n.createdAt || n.created_at || Date.now()).toLocaleString('vi-VN')}</div>
                          <div className="mt-2">
                            <button
                              className="text-xs bg-[#003580] text-white px-3 py-1 rounded hover:bg-[#0050a3]"
                              onClick={() => { setNotifOpen(false); navigate('/bookings'); }}
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium">{n.message || n.text || n.title}</div>
                          <div className="text-xs text-gray-500">{new Date(n.createdAt || n.created_at || Date.now()).toLocaleString('vi-VN')}</div>
                        </>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          {isLoggedIn ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 hover:text-[#febb02] font-medium bg-[#003580]"
                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
              >
                <img
                  src={
                    user?.avatar
                      ? user.avatar.startsWith("http")
                        ? user.avatar
                        : `http://localhost:5000/${user.avatar.replace(/^\/+/, "")}`
                      : "http://localhost:5000/Uploads/default-avt.jpg"
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-gray-300 object-cover"
                />
                <span className="text-sm font-semibold">{user.name}</span>
                <i className="fas fa-chevron-down text-xs mt-0.5"></i>
              </button>

              {isUserDropdownOpen && (
                <ul className="absolute right-0 mt-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-md w-56 z-50">
                  {user.role === "admin" ? (
                    <>
                      <li>
                        <Link
                          to="/admin/dashboard"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-tachometer-alt mr-2 text-green-600"></i>
                          Quản trị hệ thống
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/hotels"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-hotel mr-2 text-blue-600"></i>
                          Quản lý khách sạn
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/users"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-users mr-2 text-purple-600"></i>
                          Quản lý người dùng
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                        </button>
                      </li>
                    </>
                  ) : user.role === "staff" ? (
                    <>
                      <li>
                        <Link
                          to="/staff/dashboard"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-tachometer-alt mr-2 text-blue-600"></i>
                          Staff Dashboard
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/bookings"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-bed mr-2 text-blue-500"></i>
                          Đặt phòng của tôi
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/favorites"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-heart mr-2 text-red-500"></i>
                          Danh sách yêu thích
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
                      <li>
                        <Link
                          to="/reviews"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-heart mr-2 text-red-500"></i>
                          Đánh giá của tôi
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/profile"
                          onClick={closeNav}
                          className="block px-4 py-2 hover:bg-gray-100"
                        >
                          <i className="fas fa-user mr-2"></i> Hồ sơ của tôi
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden md:block bg-white text-[#003580] font-semibold px-4 py-1.5 rounded-md hover:bg-gray-100 transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="hidden md:block bg-[#0071c2] text-white px-4 py-1.5 rounded-md font-semibold hover:bg-[#005fa3] transition"
              >
                Đăng ký
              </Link>
            </>
          )}

          {/* 📱 Nút menu 3 gạch giống Booking */}
          <button
            onClick={() => setNavOpen(!isNavOpen)}
            className="md:hidden ml-2 p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-300  bg-[#003580]"
            aria-label="Menu"
          >
            <div className="flex flex-col justify-between w-6 h-4">
              <span
                className={`block h-0.5 rounded-full bg-white transition-all duration-300 ${isNavOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
              ></span>
              <span
                className={`block h-0.5 rounded-full bg-white transition-all duration-300 ${isNavOpen ? "opacity-0" : ""
                  }`}
              ></span>
              <span
                className={`block h-0.5 rounded-full bg-white transition-all duration-300 ${isNavOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* 📱 Mobile Menu Overlay - Giống Booking.com */}
      {isNavOpen && (
        <div className="fixed inset-0 bg-white text-gray-800 z-[9999] overflow-y-auto animate-fadeIn">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-lg font-semibold text-[#003580]">Khác</h2>
            <button
              onClick={closeNav}
              className="text-gray-600 text-2xl font-light hover:text-red-500"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-10">
            {/* Ngôn ngữ + Đăng nhập */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">VND</span>
                <span className="text-gray-500 text-sm">Đồng Việt Nam</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-700 font-medium">🌐 Tiếng Việt</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <i className="fas fa-star text-yellow-400"></i>
                <span>Chương trình khách hàng thân thiết Genius</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <i className="fas fa-home text-blue-500"></i>
                <Link to="/register" onClick={closeNav}>
                  Đăng chỗ nghỉ của Quý vị
                </Link>
              </div>
            </div>

            {/* Trợ giúp */}
            <div>
              <h3 className="font-semibold mb-2 text-[#003580]">Trợ giúp</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-3">
                  <i className="fas fa-headset text-blue-500"></i>
                  <a href="#">Liên hệ Dịch vụ Khách hàng</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-handshake text-green-500"></i>
                  <a href="#">Tranh chấp đối tác</a>
                </li>
              </ul>
            </div>

            {/* Cảm hứng */}
            <div>
              <h3 className="font-semibold mb-2 text-[#003580]">Cảm hứng</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-3">
                  <i className="fas fa-tags text-orange-500"></i>
                  <a href="#">Ưu đãi theo mùa và dịp lễ</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-plane text-purple-500"></i>
                  <a href="#">Bài viết du lịch</a>
                </li>
              </ul>
            </div>

            {/* Cài đặt & pháp lý */}
            <div>
              <h3 className="font-semibold mb-2 text-[#003580]">Cài đặt & Pháp lý</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-3">
                  <i className="fas fa-info-circle text-blue-400"></i>
                  <a href="#">Về Hotelier</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-briefcase text-indigo-500"></i>
                  <a href="#">Cơ hội việc làm</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-user-shield text-yellow-500"></i>
                  <a href="#">Bảo mật & Cookie</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-file-contract text-gray-700"></i>
                  <a href="#">Điều khoản dịch vụ</a>
                </li>
                <li className="flex items-center gap-3">
                  <i className="fas fa-gavel text-red-500"></i>
                  <a href="#">Pháp lý</a>
                </li>
              </ul>
            </div>

            {/* Đăng nhập / Tài khoản */}
            <div className="border-t border-gray-200 pt-5">
              {isLoggedIn ? (
                <>
                  <h3 className="font-semibold mb-2 text-[#003580]">Tài khoản của tôi</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><Link to="/profile" onClick={closeNav}>Hồ sơ cá nhân</Link></li>
                    <li><Link to="/bookings" onClick={closeNav}>Đặt phòng của tôi</Link></li>
                    <li><Link to="/favorites" onClick={closeNav}>Danh sách yêu thích</Link></li>
                    <li><Link to="/reviews" onClick={closeNav}>Đánh giá của tôi</Link></li>
                    {user?.role === 'staff' && (
                      <li><Link to="/staff/dashboard" onClick={closeNav}>Staff Dashboard</Link></li>
                    )}
                    <li>
                      <button onClick={handleLogout} className="text-red-600">
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeNav}
                    className="block bg-[#0071c2] text-white text-center py-2 rounded-md font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeNav}
                    className="block mt-2 border border-[#0071c2] text-[#0071c2] text-center py-2 rounded-md font-medium"
                  >
                    Tạo tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}

export default Navbar;
