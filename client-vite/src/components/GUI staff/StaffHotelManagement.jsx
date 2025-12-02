import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Search, Settings, AlertCircle, Edit2 } from "lucide-react";
import { Modal } from 'antd';

const StaffHotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 10;
  const hasFetched = useRef(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const ownerEmail = String((userInfo?.user || userInfo)?.email || "").toLowerCase();
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/hotels", config);
      const all = Array.isArray(data) ? data : [];
      const ownHotels = all
        .filter(h => String(h.email || "").toLowerCase() === ownerEmail)
        .map(h => ({ ...h, roomCount: h.rooms?.length || 0 }));
      setHotels(ownHotels);
      toast.success(`Đã tải ${ownHotels.length} khách sạn của bạn`);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách khách sạn");
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const [regions, setRegions] = useState([]);
  const fetchRegions = async () => {
    try {
      const { data } = await axios.get("/api/regions", config);
      setRegions(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(()=>{ fetchRegions(); },[]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
    district: "",
    contactNumber: "",
    email: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s)=>({ ...s, [name]: value }));
  };

  const handleEdit = (hotel) => {
    setModalVisible(true);
    setEditId(hotel._id);
    setFormData({
      name: hotel.name || "",
      address: hotel.address || "",
      region: hotel.region?._id || "",
      district: hotel.district || "",
      contactNumber: hotel.contactNumber || "",
      email: hotel.email || "",
      description: hotel.description || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      delete payload.email; // staff không được sửa email
      if (!payload.region) {
        const regionId = formData.region;
        payload.region = regionId;
      }
      await axios.put(`/api/hotels/${editId}`, payload, config);
      setModalVisible(false);
      await fetchHotels();
    } catch (err) {
      // swallow error, could add toast
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchHotels();
      hasFetched.current = true;
    }
  }, []);

  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastHotel = currentPage * hotelsPerPage;
  const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstHotel, indexOfLastHotel);
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <>
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Khách sạn của tôi</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/staff/dashboard" className="font-medium hover:text-blue-600">Dashboard /</Link>
            </li>
            <li className="font-medium text-blue-600">Hotels</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Danh sách khách sạn ({filteredHotels.length})</h3>
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ hoặc thành phố..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Khách sạn</th>
                <th className="py-4 px-4 font-medium text-slate-800">Liên hệ</th>
                <th className="py-4 px-4 font-medium text-slate-800">Khu vực</th>
                <th className="py-4 px-4 font-medium text-slate-800 text-center">Phòng</th>
                <th className="py-4 px-4 font-medium text-slate-800 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : currentHotels.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    <AlertCircle className="inline mr-2" size={20} />
                    Không có khách sạn nào thuộc quyền quản lý của bạn
                  </td>
                </tr>
              ) : (
                currentHotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50 transition-colors">
                    <td className="border-b border-gray-200 py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={hotel.imageurls?.[0] || '/placeholder-hotel.jpg'}
                          alt={hotel.name}
                          className="h-12 w-16 rounded object-cover"
                          onError={(e) => { e.target.src = '/placeholder-hotel.jpg'; }}
                        />
                        <div>
                          <p className="font-medium text-slate-800">{hotel.name}</p>
                          <p className="text-sm text-gray-500">{hotel.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-gray-200 py-4 px-4">
                      <p className="text-sm text-slate-800">{hotel.email}</p>
                      <p className="text-sm text-gray-500">{hotel.contactNumber}</p>
                    </td>
                    <td className="border-b border-gray-200 py-4 px-4">
                      <p className="text-slate-800">
                        {hotel.region?.name || "N/A"}
                        {hotel.district ? ` - ${hotel.district}` : ""}
                      </p>
                    </td>
                    <td className="border-b border-gray-200 py-4 px-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {hotel.roomCount || 0}
                      </span>
                    </td>
                    <td className="border-b border-gray-200 py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(hotel)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <Link
                          to={`/staff/hotel/${hotel._id}/rooms`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Quản lý phòng"
                        >
                          <Settings size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredHotels.length > 0 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị {indexOfFirstHotel + 1}-{Math.min(indexOfLastHotel, filteredHotels.length)} trên {filteredHotels.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    <Modal
      title={'Chỉnh sửa thông tin khách sạn'}
      open={modalVisible}
      onCancel={()=>setModalVisible(false)}
      footer={null}
      width={900}
      centered
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Tên khách sạn</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm" />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Địa chỉ</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm" />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Khu vực / Thành phố</label>
              <select
                name="region"
                value={formData.region}
                onChange={(e)=> setFormData((s)=>({ ...s, region: e.target.value }))}
                required
                className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm"
              >
                <option value="">-- Chọn khu vực --</option>
                {regions.map((region) => (
                  <optgroup key={region._id} label={region.name}>
                    {region.cities?.map((city, i) => (
                      <option key={i} value={region._id}>{city.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Thành phố/Quận (district)</label>
              <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm" />
            </div>
          </div>
          <div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Số điện thoại</label>
              <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm" />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Email (không thể chỉnh)</label>
              <input type="email" name="email" value={formData.email} disabled className="w-full rounded-md border border-gray-300 bg-gray-100 p-2.5 text-sm" />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Mô tả</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm"></textarea>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={()=>setModalVisible(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Hủy</button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Lưu</button>
        </div>
      </form>
    </Modal>
    </>
  );
};

export default StaffHotelManagement;
