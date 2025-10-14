import React from "react";

const AdminHeader = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3 w-full justify-between">
        {/* Search */}
        <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 w-1/2">
          <i className="fas fa-search text-gray-400 mr-2"></i>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="bg-transparent outline-none text-sm w-full text-gray-700"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <button className="relative text-gray-600 hover:text-blue-600">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src="https://i.pravatar.cc/40"
              alt="avatar"
              className="w-8 h-8 rounded-full border border-gray-300"
            />
            <span className="text-gray-700 font-medium text-sm">Admin</span>
            <i className="fas fa-chevron-down text-xs text-gray-400"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
