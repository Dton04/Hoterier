import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiGrid, FiUser, FiLogOut } from 'react-icons/fi';
import { BiChevronDown } from 'react-icons/bi';
import defaultAvatar from '../../assets/images/default-avatar.jpg';

const AdminHeader = ({ sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const trigger = useRef(null);
  const dropdown = useRef(null);

  // Đóng dropdown khi nhấp chuột ra ngoài
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-gray-200">
      <div className="flex flex-grow items-center justify-between px-4 md:px-6 2xl:px-11 h-[68px]">
        
        <div className="flex items-center gap-3">
          {/* --- Nút Hamburger Menu (hiển thị trên mobile) --- */}
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="block rounded-md border border-gray-200 bg-gray-50 p-2 lg:hidden"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          {/* --- Thanh tìm kiếm --- */}
          <div className="hidden sm:block relative w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search or type command..."
              className="w-full bg-white pl-11 pr-16 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <kbd className="text-xs font-sans text-gray-500 border border-gray-200 rounded px-1.5 py-1 bg-gray-50">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* --- Các nút hành động và thông tin người dùng --- */}
        <div className="flex items-center gap-3">
          {/* --- Thông tin người dùng (Đã sửa thành Dropdown) --- */}
          <div className="relative">
            <button
              ref={trigger}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={defaultAvatar}
                alt="User Avatar"
                className="h-8 w-8 rounded-full border border-gray-300 object-cover"
              />
              <span className="hidden text-sm font-medium text-gray-700 md:block">
                Admin
              </span>
              <BiChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* --- Dropdown Menu --- */}
            {dropdownOpen && (
              <div
                ref={dropdown}
                className="absolute right-0 mt-2.5 flex w-60 flex-col rounded-md border border-gray-200 bg-white shadow-md z-50"
              >
                <ul className="flex flex-col gap-0.5 border-b border-gray-200 p-2">
                  <li>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3.5 rounded-md px-3 py-2 text-sm text-black font-medium duration-300 ease-in-out hover:bg-gray-100"
                    >
                      <FiGrid className="text-blue-500"/>
                      Bảng điều khiển
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3.5 rounded-md px-3 py-2 text-sm text-black font-medium duration-300 ease-in-out hover:bg-gray-100"
                    >
                      <FiUser className="text-green-500"/>
                      Hồ sơ
                    </Link>
                  </li>
                </ul>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3.5 rounded-md px-3 py-2 text-sm text-red-500 font-medium duration-300 ease-in-out hover:bg-gray-100"
                >
                  <FiLogOut />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;