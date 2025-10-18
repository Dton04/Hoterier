import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
// ✅ ĐÃ SỬA LỖI IMPORT
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

// Cấu hình Axios Interceptor (nếu chưa có ở file chung)
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
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    hotelIds: [],
    imageUrl: '',
    isFree: false,
    requiresBooking: false,
  });

  // --- LOGIC (Không thay đổi) ---
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
    setFormData({ name: '', description: '', price: 0, hotelIds: [], imageUrl: '', isFree: false, requiresBooking: false });
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
      hotelIds: [service.hotelId?._id],
      imageUrl: service.imageUrl || '',
      isFree: service.isFree,
      requiresBooking: service.requiresBooking,
    });
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

  // --- GIAO DIỆN ---
  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Dịch vụ</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
            <li className="font-medium text-blue-600">Services</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-gray-200 pb-4">
          {isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputField label="Tên dịch vụ" name="name" value={formData.name} onChange={handleInputChange} required />
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">Khách sạn áp dụng</label>
                <select multiple={!isEditing} name="hotelIds" value={formData.hotelIds} onChange={handleHotelSelectChange} required className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 h-24">
                  {!isEditing && <option value="all">Tất cả khách sạn</option>}
                  {hotels.map(hotel => <option key={hotel._id} value={hotel._id}>{hotel.name}</option>)}
                </select>
                {!isEditing && <p className="text-xs text-gray-500 mt-1">Giữ Ctrl (hoặc Cmd) để chọn nhiều khách sạn.</p>}
              </div>
              <InputField label="URL hình ảnh (tùy chọn)" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
            </div>
            <div>
              <InputField label="Mô tả" name="description" value={formData.description} onChange={handleInputChange} type="textarea"/>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Giá (VNĐ)" name="price" type="number" value={formData.price} onChange={handleInputChange} disabled={formData.isFree} />
                <div className="flex flex-col justify-around">
                    <CheckBox label="Miễn phí" name="isFree" checked={formData.isFree} onChange={handleInputChange} />
                    <CheckBox label="Yêu cầu đặt trước" name="requiresBooking" checked={formData.requiresBooking} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            {isEditing && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Hủy</button>}
            <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              <FiPlus className="inline -ml-1 mr-1" /> {isEditing ? 'Cập nhật' : 'Thêm Dịch Vụ'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Dịch vụ</th>
                <th className="py-4 px-4 font-medium text-slate-800">Khách sạn</th>
                <th className="py-4 px-4 font-medium text-slate-800">Giá</th>
                <th className="py-4 px-4 font-medium text-slate-800">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-slate-800">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service._id}>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <p className="font-medium text-slate-800">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4"><p>{service.hotelId?.name || 'N/A'}</p></td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    {service.isFree ? <p className="text-green-600 font-medium">Miễn phí</p> : <p>{service.price.toLocaleString('vi-VN')} VNĐ</p>}
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    {service.isAvailable ? <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">Hoạt động</p> : <p className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">Tạm ngưng</p>}
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleEdit(service)} className="text-blue-600 hover:text-blue-800" title="Sửa"><FiEdit size={18} /></button>
                      {/* ✅ ĐÃ SỬA LẠI ICON */}
                      <button onClick={() => handleToggleAvailability(service._id)} className={service.isAvailable ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} title={service.isAvailable ? 'Tạm ngưng' : 'Kích hoạt'}>{service.isAvailable ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
                      <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-800" title="Xóa"><FiTrash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Component phụ để render các trường input
const InputField = ({ label, name, type = 'text', value, onChange, required, disabled, type: inputType }) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-slate-700">{label}</label>
        {inputType === 'textarea' ? (
            <textarea name={name} value={value} onChange={onChange} required={required} disabled={disabled} rows="3"
                className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"/>
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled}
                className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"/>
        )}
    </div>
);

const CheckBox = ({ label, name, checked, onChange }) => (
    <div className="flex items-center">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} id={name} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <label htmlFor={name} className="ml-2 block text-sm text-slate-700">{label}</label>
    </div>
);

export default ServiceManagement;