import React from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="p-6 md:p-10 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
