import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
// ✅ BƯỚC 1: Import Select và Option từ Ant Design
import { Select } from 'antd';
import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import { FiCheck, FiX } from "react-icons/fi";

const { Option } = Select; // Lấy Option từ Select

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const navigate = useNavigate();

  // --- LOGIC (Không thay đổi) ---
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) {
          throw new Error("Bạn cần đăng nhập để xem danh sách đặt phòng");
        }
        const response = await axios.get("/api/bookings", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setBookings(response.data);
        setFilteredBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err.response?.data, err.message);
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [navigate]);

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== "all") {
      result = result.filter((booking) => booking.status === statusFilter);
    }
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(
        (booking) =>
          booking.name?.toLowerCase().includes(lowercasedTerm) ||
          booking.email?.toLowerCase().includes(lowercasedTerm) ||
          booking.hotelId?.name?.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredBookings(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, bookings]);

  const handleConfirm = async (bookingId) => {
    try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        await axios.put(`/api/bookings/${bookingId}/confirm`, {}, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setBookings(bookings.map((b) => b._id === bookingId ? { ...b, status: "confirmed" } : b));
    } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi xác nhận đặt phòng");
    }
  };

  const handleCancel = async (bookingId) => {
     try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        await axios.delete(`/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setBookings(bookings.map((b) => b._id === bookingId ? { ...b, status: "canceled" } : b));
    } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi hủy đặt phòng");
    }
  };

  // Phân trang
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <p className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-600">Chờ xác nhận</p>;
      case "confirmed":
        return <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">Đã xác nhận</p>;
      case "canceled":
        return <p className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">Đã hủy</p>;
      default:
        return <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">Không xác định</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Đặt phòng</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><a href="/admin/dashboard" className="font-medium">Dashboard /</a></li>
            <li className="font-medium text-blue-600">Bookings</li>
          </ol>
        </nav>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm sm:px-7.5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-1/2">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm theo khách hàng, email, khách sạn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white pl-11 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
            </div>
            
            {/* ✅ BƯỚC 2: Thay thế <select> bằng <Select> của Ant Design */}
            <Select
                defaultValue="all"
                value={statusFilter}
                // ✅ BƯỚC 3: Sửa lại hàm onChange
                onChange={(value) => setStatusFilter(value)} 
                style={{ width: 200 }} // Đặt chiều rộng cố định để giao diện đẹp hơn
            >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="pending">Chờ xác nhận</Option>
                <Option value="confirmed">Đã xác nhận</Option>
                <Option value="canceled">Đã hủy</Option>
            </Select>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            {/* ... phần còn lại của bảng không đổi ... */}
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="min-w-[220px] py-4 px-4 font-medium text-slate-800">Khách hàng</th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-slate-800">Khách sạn</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-slate-800">Check-in</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-slate-800">Check-out</th>
                <th className="py-4 px-4 font-medium text-slate-800">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-slate-800">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img src={booking.user?.avatar || defaultAvatar} alt="Avatar" className="w-full h-full object-cover"/>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{booking.name}</p>
                        <p className="text-sm text-gray-500">{booking.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <p className="text-slate-800">{booking.hotelId?.name || booking.roomid?.hotelId?.name || "Không có"}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <p className="text-slate-800">{new Date(booking.checkin).toLocaleDateString("vi-VN")}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <p className="text-slate-800">{new Date(booking.checkout).toLocaleDateString("vi-VN")}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <div className="flex items-center space-x-3.5 justify-center">
                      {booking.status === "pending" ? (
                        <>
                          <button onClick={() => handleConfirm(booking._id)} className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Duyệt">
                            <FiCheck size={18} />
                          </button>
                          <button onClick={() => handleCancel(booking._id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Không duyệt">
                            <FiX size={18} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
                Hiển thị {indexOfFirstBooking + 1}-{Math.min(indexOfLastBooking, filteredBookings.length)} trên {filteredBookings.length}
            </p>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Trước
                </button>
                <span className="text-sm">Trang {currentPage} / {totalPages}</span>
                <button 
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                    Sau
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
