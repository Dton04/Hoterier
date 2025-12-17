import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiSearch, FiCheck, FiX } from "react-icons/fi";
import { Select } from 'antd';
import defaultAvatar from "../../assets/images/default-avatar.jpg";

const { Option } = Select;

const StaffBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = JSON.parse(localStorage.getItem("userInfo"));
        const user = raw?.user || raw;
        const token = user?.token;
        const ownerEmail = String(user?.email || "").toLowerCase();
        const { data } = await axios.get("/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
          params: { ownerEmail },
        });
        setBookings(data);
        setFilteredBookings(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

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

  const handleConfirm = async (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem("userInfo"));
      const token = (raw?.user || raw)?.token;
      await axios.put(`/api/bookings/${id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: "confirmed" } : b));
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi duyệt đặt phòng");
    }
  };

  const handleCancel = async (id) => {
    try {
      const raw = JSON.parse(localStorage.getItem("userInfo"));
      const token = (raw?.user || raw)?.token;
      await axios.delete(`/api/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: "canceled" } : b));
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi hủy đặt phòng");
    }
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  if (loading) return (<div className="flex justify-center items-center h-96"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">Chờ xác nhận</span>;
      case "confirmed":
        return <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Đã xác nhận</span>;
      case "canceled":
        return <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Đã hủy</span>;
      default:
        return <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">Không xác định</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Đặt phòng</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><a href="/staff/dashboard" className="font-medium">Dashboard /</a></li>
            <li className="font-medium text-blue-600">Bookings</li>
          </ol>
        </nav>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

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
            <Select defaultValue="all" value={statusFilter} onChange={(value)=>setStatusFilter(value)} style={{ width: 200 }}>
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="canceled">Đã hủy</Option>
            </Select>
        </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
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
            {currentBookings.map((b)=> (
              <tr key={b._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <img src={defaultAvatar} alt="avatar" className="h-8 w-8 rounded-full border" />
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">{b.hotelId?.name || '—'}</td>
                <td className="px-4 py-2">{new Date(b.checkin).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-2">{new Date(b.checkout).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-2">{getStatusBadge(b.status)}</td>
                <td className="px-4 py-2 text-center">
                  {b.status === 'pending' ? (
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={()=>handleConfirm(b._id)} className="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Duyệt">
                        <FiCheck size={18} />
                      </button>
                      <button onClick={()=>handleCancel(b._id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Không duyệt">
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">—</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBookings.length > 0 && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Hiển thị {indexOfFirstBooking + 1}-{Math.min(indexOfLastBooking, filteredBookings.length)} trên {filteredBookings.length}</p>
          <div className="flex items-center gap-2">
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Trước</button>
            <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Sau</button>
          </div>
        </div>
      )}
     </div>
    </div>
  );
};

export default StaffBookings;
