import React from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: "fas fa-chart-line", path: "/admin/dashboard" },
  { label: "Đặt phòng", icon: "fas fa-book", path: "/admin/bookings" },
  { label: "Người dùng và nhân viên", icon: "fas fa-users", path: "/admin/users" },
  { label: "Khách sạn", icon: "fas fa-hotel", path: "/admin/hotels" },
  { label: "Dịch vụ", icon: "fas fa-concierge-bell", path: "/admin/services" },
  { label: "Giảm giá", icon: "fas fa-tags", path: "/admin/discounts" },
  { label: "Đánh giá", icon: "fas fa-star", path: "/admin/reviews" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="bg-white border-r border-gray-200 w-64 fixed top-0 left-0 h-screen shadow-sm flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">HOTELIER</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuItems.map((item, index) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-1 text-gray-700 font-medium transition 
                ${active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
        © {new Date().getFullYear()} Hotelier Admin
      </div>
    </aside>
  );
};

export default AdminSidebar;
