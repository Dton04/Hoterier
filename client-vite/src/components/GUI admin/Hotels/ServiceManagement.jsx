import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { iconForAmenity } from "../../../utils/amenityIcons";

const ServiceManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [hotelServices, setHotelServices] = useState([]);
  const [globalServices, setGlobalServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  useEffect(() => {
    fetchHotels();
    fetchGlobalServices();
  }, []);

  useEffect(() => {
    if (selectedHotel) fetchHotelServices(selectedHotel);
  }, [selectedHotel]);

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get("/api/hotels");
      setHotels(data);
    } catch {
      toast.error("Không thể tải danh sách khách sạn");
    }
  };

  const fetchGlobalServices = async () => {
    try {
      const { data } = await axios.get("/api/services?global=true");
      setGlobalServices(data);
    } catch {
      toast.error("Không thể tải danh sách dịch vụ mẫu");
    }
  };

  const fetchHotelServices = async (hotelId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/services?hotelId=${hotelId}`);
      setHotelServices(data);
    } catch {
      toast.error("Không thể tải dịch vụ khách sạn");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignService = async (serviceId) => {
    if (!selectedHotel) return toast.warn("Vui lòng chọn khách sạn trước");

    const selected = globalServices.find((s) => s._id === serviceId);
    if (!selected) return;

    try {
      await axios.post(
        "/api/services",
        {
          name: selected.name,
          description: selected.description,
          price: selected.price,
          icon: selected.icon,
          hotelId: selectedHotel,
        },
        config
      );
      toast.success(`Đã thêm dịch vụ "${selected.name}" cho khách sạn`);
      fetchHotelServices(selectedHotel);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể thêm dịch vụ");
    }
  };

  const handleToggleAvailability = async (serviceId) => {
    try {
      await axios.patch(`/api/services/${serviceId}/toggle`, {}, config);
      toast.success("Cập nhật trạng thái thành công");
      fetchHotelServices(selectedHotel);
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này khỏi khách sạn?")) return;
    try {
      await axios.delete(`/api/services/${serviceId}`, config);
      toast.success("Đã xóa dịch vụ khỏi khách sạn");
      fetchHotelServices(selectedHotel);
    } catch {
      toast.error("Không thể xóa dịch vụ");
    }
  };

  const isServiceAssigned = (globalServiceId) =>
    hotelServices.some((hs) => hs.name === globalServices.find((gs) => gs._id === globalServiceId)?.name);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gán Dịch vụ cho Khách sạn</h1>
          <nav className="mt-2">
            <ol className="flex items-center gap-2 text-sm text-gray-600">
              <li>
                <Link to="/admin/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
              </li>
              <li>/</li>
              <li className="text-blue-600 font-medium">Dịch vụ khách sạn</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Hotel Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn khách sạn để quản lý dịch vụ
        </label>
        <select
          value={selectedHotel}
          onChange={(e) => setSelectedHotel(e.target.value)}
          className="w-full md:w-1/3 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
        >
          <option value="">-- Chọn khách sạn --</option>
          {hotels.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Global Services List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách dịch vụ mẫu</h2>
          {!selectedHotel && (
            <p className="text-sm text-gray-500">Vui lòng chọn khách sạn để thêm dịch vụ</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {globalServices.length === 0 ? (
            <p className="text-gray-500 col-span-full">Chưa có dịch vụ mẫu nào.</p>
          ) : (
            globalServices.map((s) => {
              const assigned = isServiceAssigned(s._id);
              return (
                <div
                  key={s._id}
                  className={`p-4 border rounded-lg flex items-center justify-between ${
                    assigned ? "bg-green-50 border-green-200" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5">{iconForAmenity(s.name)}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.price ? `${s.price.toLocaleString("vi-VN")} ₫` : "Miễn phí"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      assigned ? toast.info("Dịch vụ đã được gán") : handleAssignService(s._id)
                    }
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      assigned
                        ? "bg-green-100 text-green-700 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {assigned ? "Đã gán" : "Gán"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hotel Services Table */}
      {selectedHotel && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Dịch vụ hiện có của khách sạn
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-2">Tên dịch vụ</th>
                  <th className="text-left px-4 py-2">Giá</th>
                  <th className="text-center px-4 py-2">Trạng thái</th>
                  <th className="text-center px-4 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : hotelServices.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      Chưa có dịch vụ nào.
                    </td>
                  </tr>
                ) : (
                  hotelServices.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span className="w-5 h-5">{iconForAmenity(s.name)}</span>
                        {s.name}
                      </td>
                      <td className="px-4 py-2">
                        {s.isFree
                          ? "Miễn phí"
                          : `${Number(s.price || 0).toLocaleString("vi-VN")} ₫`}
                      </td>
                      <td className="text-center px-4 py-2">
                        {s.isAvailable ? (
                          <span className="text-green-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle size={14} /> Hoạt động
                          </span>
                        ) : (
                          <span className="text-red-700 font-semibold flex items-center justify-center gap-1">
                            <XCircle size={14} /> Tạm ngưng
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleToggleAvailability(s._id)}
                            className={`px-3 py-1 rounded-md text-xs font-medium ${
                              s.isAvailable
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {s.isAvailable ? "Tạm ngưng" : "Kích hoạt"}
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            <Trash2 size={14} />
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
      )}
    </div>
  );
};

export default ServiceManagement;
