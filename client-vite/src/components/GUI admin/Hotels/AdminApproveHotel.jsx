import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Check, X, Eye, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AdminApproveHotel = () => {
  const [pendingHotels, setPendingHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
  };

  const fetchPendingHotels = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/hotels?includeUnapproved=true", config);
      const allHotels = Array.isArray(data) ? data : [];
      // Filter hotels that are NOT approved (isApproved === false or undefined)
      const pending = allHotels.filter(h => h.isApproved === false);
      setPendingHotels(pending);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách khách sạn chờ duyệt");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingHotels();
  }, []);

  const handleApprove = async (hotel) => {
    if (!window.confirm(`Xác nhận duyệt khách sạn "${hotel.name}"?`)) return;

    try {
      await axios.put(`/api/hotels/${hotel._id}`, { isApproved: true }, config);
      toast.success(`Đã duyệt khách sạn "${hotel.name}"`);
      fetchPendingHotels(); // Refresh list
    } catch (err) {
      toast.error("Lỗi khi duyệt khách sạn");
    }
  };

  const handleReject = async (hotel) => {
    if (!window.confirm(`Bạn có chắc muốn từ chối và XÓA khách sạn "${hotel.name}"?`)) return;

    try {
      await axios.delete(`/api/hotels/${hotel._id}`, config);
      toast.success(`Đã từ chối yêu cầu của "${hotel.name}"`);
      fetchPendingHotels();
    } catch (err) {
      toast.error("Lỗi khi xóa yêu cầu");
    }
  };

  return (
    <div className="p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">
          Duyệt Khách Sạn <span className="text-sm font-normal text-gray-500">({pendingHotels.length} yêu cầu)</span>
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium hover:text-blue-600">Dashboard /</Link></li>
            <li className="font-medium text-blue-600">Approve Hotels</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 font-medium text-slate-700">Khách sạn</th>
                <th className="py-4 px-6 font-medium text-slate-700">Thông tin liên hệ</th>
                <th className="py-4 px-6 font-medium text-slate-700">Địa chỉ</th>
                <th className="py-4 px-6 font-medium text-slate-700 text-center">Ngày tạo</th>
                <th className="py-4 px-6 font-medium text-slate-700 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : pendingHotels.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={32} className="text-gray-300" />
                      <p>Không có yêu cầu nào đang chờ duyệt</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingHotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={hotel.imageurls?.[0] || '/placeholder-hotel.jpg'}
                          alt={hotel.name}
                          className="h-12 w-16 rounded object-cover border border-gray-200"
                          onError={(e) => { e.target.src = '/placeholder-hotel.jpg'; }}
                        />
                        <div>
                          <p className="font-medium text-slate-800">{hotel.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                              {hotel.starRating} sao
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-700">{hotel.email}</span>
                        <span className="text-sm text-gray-500">{hotel.contactNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-700 max-w-xs truncate" title={hotel.address}>
                        {hotel.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {hotel.region?.name} - {hotel.district}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-500">
                      {new Date(hotel.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(hotel)}
                          className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                          title="Duyệt"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleReject(hotel)}
                          className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                          title="Từ chối"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminApproveHotel;
