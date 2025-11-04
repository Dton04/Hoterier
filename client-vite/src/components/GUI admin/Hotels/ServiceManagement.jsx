import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Power, Trash2 } from 'lucide-react';

axios.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({ hotelId: '', isAvailable: '' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;

  // Modal state
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    hotelIds: [],
    imageUrl: '',
    isFree: false,
    requiresBooking: false,
  });

  // Lock scroll when modal open + ESC to close
  useEffect(() => {
    if (showAddForm) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    const onEsc = (e) => { if (e.key === 'Escape') setShowAddForm(false); };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', onEsc);
    };
  }, [showAddForm]);

  useEffect(() => {
    fetchServices();
    fetchHotels();
  }, [filters]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.hotelId) params.append('hotelId', filters.hotelId);
      if (filters.isAvailable !== '') params.append('isAvailable', filters.isAvailable);
      const { data } = await axios.get(`/api/services?${params}`);
      setServices(data);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get('/api/hotels');
      setHotels(data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách khách sạn');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      hotelIds: [],
      imageUrl: '',
      isFree: false,
      requiresBooking: false
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleHotelSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, hotelIds: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.hotelIds.length === 0) {
      toast.warn('Vui lòng nhập tên và chọn khách sạn.');
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`/api/services/${editId}`, { ...formData, hotelId: formData.hotelIds[0] });
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        const requests = formData.hotelIds.map(hotelId =>
          axios.post('/api/services', { ...formData, hotelId })
        );
        await Promise.all(requests);
        toast.success('Tạo dịch vụ thành công');
      }
      resetForm();
      setShowAddForm(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (service) => {
    window.scrollTo(0, 0);
    setIsEditing(true);
    setEditId(service._id);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      hotelIds: [service.hotelId?._id || ''],
      imageUrl: service.imageUrl || '',
      isFree: service.isFree,
      requiresBooking: service.requiresBooking,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await axios.delete(`/api/services/${serviceId}`);
        toast.success('Xóa dịch vụ thành công');
        fetchServices();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handleToggleAvailability = async (serviceId) => {
    try {
      await axios.patch(`/api/services/${serviceId}/toggle`);
      toast.success('Cập nhật trạng thái thành công');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = services.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(services.length / servicesPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
            <nav className="mt-2">
              <ol className="flex items-center gap-2 text-sm text-gray-600">
                <li><Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
                <li>/</li>
                <li className="text-blue-600 font-medium">Dịch vụ</li>
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Plus size={18} /> Thêm dịch vụ
            </button>

            <div className="text-sm text-gray-500">
              Tổng: <span className="font-semibold text-gray-900">{services.length}</span> dịch vụ
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { resetForm(); setShowAddForm(false); }}
          />
          <div className="relative z-50 mx-auto mt-20 w-[95%] max-w-[980px]">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Basic Info */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin cơ bản</h3>
                      <InputField
                        label="Tên dịch vụ"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="VD: Dịch vụ giặt là"
                      />
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Khách sạn áp dụng</label>
                        <select
                          multiple={!isEditing}
                          name="hotelIds"
                          value={formData.hotelIds}
                          onChange={handleHotelSelectChange}
                          required
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all h-28"
                        >
                          {!isEditing && <option value="all" disabled>Tất cả khách sạn</option>}
                          {hotels.map(hotel => (
                            <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                          ))}
                        </select>
                        {!isEditing && <p className="text-xs text-gray-500 mt-2">Giữ Ctrl/Cmd để chọn nhiều</p>}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Description & Image */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Mô tả & Hình ảnh</h3>
                      <InputField
                        label="Mô tả chi tiết"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        type="textarea"
                        placeholder="Nhập mô tả về dịch vụ..."
                      />
                      <InputField
                        label="URL hình ảnh"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  {/* Column 3: Pricing & Options */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Giá & Tùy chọn</h3>
                      <InputField
                        label="Giá dịch vụ (VNĐ)"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        disabled={formData.isFree}
                        placeholder="0"
                      />
                      <div className="space-y-3 mt-4">
                        <CheckBox
                          label="Dịch vụ miễn phí"
                          name="isFree"
                          checked={formData.isFree}
                          onChange={handleInputChange}
                        />
                        <CheckBox
                          label="Yêu cầu đặt trước"
                          name="requiresBooking"
                          checked={formData.requiresBooking}
                          onChange={handleInputChange}
                        />
                      </div>
                      {formData.isFree && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700">Dịch vụ này sẽ được cung cấp miễn phí</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowAddForm(false); }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    {isEditing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Lọc theo khách sạn</label>
            <select
              value={filters.hotelId}
              onChange={(e) => setFilters({ ...filters, hotelId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Tất cả khách sạn</option>
              {hotels.map(hotel => <option key={hotel._id} value={hotel._id}>{hotel.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Lọc theo trạng thái</label>
            <select
              value={filters.isAvailable}
              onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Tạm ngưng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thông tin dịch vụ
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Khách sạn
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Giá
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Yêu cầu
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : currentServices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    Không có dịch vụ nào
                  </td>
                </tr>
              ) : (
                currentServices.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        {service.imageUrl && (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {service.hotelId?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {service.isFree ? (
                        <span className="text-green-600 font-semibold">Miễn phí</span>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {Number(service.price || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {service.requiresBooking ? (
                        <span className="text-xs text-orange-600 font-medium">Đặt trước</span>
                      ) : (
                        <span className="text-xs text-gray-400">Không yêu cầu</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {service.isAvailable ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Tạm ngưng
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(service._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            service.isAvailable
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={service.isAvailable ? 'Tạm ngưng' : 'Kích hoạt'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && services.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị {indexOfFirstService + 1}-{Math.min(indexOfLastService, services.length)} trên {services.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
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
  );
};

const InputField = ({ label, name, type = 'text', value, onChange, required, disabled, placeholder }) => (
  <div className="mb-4">
    <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows="4"
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 transition-all resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 transition-all"
      />
    )}
  </div>
);

const CheckBox = ({ label, name, checked, onChange }) => (
  <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      id={name}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <label htmlFor={name} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
      {label}
    </label>
  </div>
);

export default ServiceManagement;