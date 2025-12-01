import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// ✅ ĐÃ CẬP NHẬT: Bỏ FiTable, thêm FiMapPin và FiBell
import { FiGrid, FiFileText, FiMapPin, FiUsers, FiStar, FiTag, FiServer, FiHome, FiRotateCcw, FiBell } from 'react-icons/fi';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { pathname } = location;

  // ✅ ĐÃ CẬP NHẬT MẢNG MENU
  const menuItems = [
    { label: "Dashboard", icon: <FiGrid />, path: "/admin/dashboard" },
    { label: "Đặt phòng", icon: <FiFileText />, path: "/admin/bookings" },
    { label: "Người dùng & NV", icon: <FiUsers />, path: "/admin/users" },
    { label: "Khách sạn", icon: <FiHome />, path: "/admin/hotels" },
    { label: "Dịch vụ khách sạn (chung)", icon: <FiServer />, path: "/admin/hotel-services" },
    { label: "Dịch vụ khách sạn", icon: <FiServer />, path: "/admin/services" },
    { label: "Tiện nghi phòng", icon: <FiRotateCcw />, path: "/admin/amenities" },
    { label: "Giảm giá", icon: <FiTag />, path: "/admin/discounts" },
    { label: "Đánh giá", icon: <FiStar />, path: "/admin/reviews" },
    { label: "Khu vực", icon: <FiMapPin />, path: "/admin/regions" }, // Thay thế "Tables"
    { label: "Thông báo", icon: <FiBell />, path: "/admin/notifications" }, // Thêm mục thông báo
    { label: "Lịch sử ChatBot", icon: <FiFileText />, path: "/admin/chat-history" },
  ];

  return (
    <aside
      className={`absolute left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-hidden bg-white border-r border-gray-200 duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      {/* LOGO */}
      <div className="flex items-center justify-between gap-2 px-6 h-[68px] border-b border-gray-200">
        <NavLink to="/home">
          <h1 className="text-2xl font-bold text-slate-800">HOTELIER</h1>
        </NavLink>
        <button
          onClick={() => setSidebarOpen(false)}
          className="block lg:hidden text-gray-500 hover:text-gray-800"
        >
          {/* Icon close */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* NAV MENU */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-gray-400">MENU</h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    className={`group relative flex items-center gap-3 rounded-md py-2 px-4 font-medium text-gray-600 duration-300 ease-in-out hover:bg-gray-100 ${
                      // Logic active link đúng hơn
                      (pathname === item.path || (item.path !== '/admin/dashboard' && pathname.startsWith(item.path))) && 'bg-blue-50 text-blue-600'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;