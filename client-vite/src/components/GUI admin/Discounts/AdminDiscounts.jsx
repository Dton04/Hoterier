import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Lock, CheckSquare, Search } from 'lucide-react';

// Constants for discount types
const discountTypes = [
  { value: 'voucher', label: 'Voucher' },
  { value: 'festival', label: 'Festival' },
  { value: 'member', label: 'Member' },
  { value: 'accumulated', label: 'Accumulated' },
];

const discountValueTypes = [
  { value: 'percentage', label: 'Phần trăm (%)' },
  { value: 'fixed', label: 'Cố định (VND)' },
];

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('none');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const discountsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '', code: '', description: '', type: 'voucher', discountType: 'percentage', discountValue: 0,
    applicableHotels: [], startDate: '', endDate: '', maxDiscount: '', isStackable: false, image: ''
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/discounts/admin', config);
      setDiscounts((data || []).filter(d => d.isDeleted !== true));
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách khuyến mãi.');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get('/api/hotels', config);
      setHotels(data);
    } catch (error) {
      toast.error('Không thể lấy danh sách khách sạn.');
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchHotels();
  }, []);

  const filteredAndSortedDiscounts = useMemo(() => {
    let result = [...discounts];
    if (typeFilter !== 'all') {
      result = result.filter(d => d.type === typeFilter);
    }
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(lowercasedTerm) ||
        d.code?.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (sortOrder !== 'none') {
      result.sort((a, b) => {
        const valueA = a.discountValue;
        const valueB = b.discountValue;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }
    return result;
  }, [discounts, searchTerm, typeFilter, sortOrder]);

  // Pagination logic
  const indexOfLastDiscount = currentPage * discountsPerPage;
  const indexOfFirstDiscount = indexOfLastDiscount - discountsPerPage;
  const currentDiscounts = filteredAndSortedDiscounts.slice(indexOfFirstDiscount, indexOfLastDiscount);
  const totalPages = Math.ceil(filteredAndSortedDiscounts.length / discountsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, sortOrder]);

  const resetForm = () => {
    setFormData({
      name: '', code: '', description: '', type: 'voucher', discountType: 'percentage',
      discountValue: 0, applicableHotels: [], startDate: '', endDate: '',
      maxDiscount: '', isStackable: false, image: ''
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleEdit = (discount) => {
    setIsEditing(true);
    setEditId(discount._id);
    setFormData({
      name: discount.name,
      code: discount.code || '',
      description: discount.description || '',
      type: discount.type,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      startDate: discount.startDate ? moment(discount.startDate).format('YYYY-MM-DD') : '',
      endDate: discount.endDate ? moment(discount.endDate).format('YYYY-MM-DD') : '',
      applicableHotels: discount.applicableHotels.map(h => h._id || h),
      maxDiscount: discount.maxDiscount || '',
      isStackable: discount.isStackable || false,
      image: discount.image || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenModal = (discount = null) => {
    if (discount) {
      handleEdit(discount);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleHotelChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, applicableHotels: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/discounts/${editId}`, formData, config);
        toast.success('Cập nhật khuyến mãi thành công');
      } else {
        await axios.post('/api/discounts', formData, config);
        toast.success('Tạo khuyến mãi thành công');
      }
      setIsModalOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khuyến mãi này không?')) {
      try {
        await axios.delete(`/api/discounts/${id}`, config);
        toast.success('Xóa khuyến mãi thành công');
        fetchDiscounts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi xóa');
      }
    }
  };

  const getHotelNames = (hotelIds) => {
    if (!hotelIds || hotelIds.length === 0) return 'Tất cả khách sạn';
    const names = hotelIds.map(id => hotels.find(h => h._id === (id._id || id))?.name).filter(Boolean);
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} và ${names.length - 2} khác` : names.join(', ');
  };

  const formatPrice = (price) => price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  // --- UI ---
  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Khuyến mãi</h2>
        <div className="flex items-center gap-4">
          <nav>
            <ol className="flex items-center gap-2">
              <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
              <li className="font-medium text-blue-600">Discounts</li>
            </ol>
          </nav>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm Khuyến mãi
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="voucher">Voucher</option>
            <option value="festival">Festival</option>
            <option value="member">Member</option>
            <option value="accumulated">Accumulated</option>
          </select>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Mặc định</option>
            <option value="desc">Giảm giá: Cao đến thấp</option>
            <option value="asc">Giảm giá: Thấp đến cao</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-800">Tên & Mã</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Loại</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Giảm giá</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Phạm vi</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Hết hạn</th>
                <th className="py-3 px-4 font-semibold text-slate-800 text-center">Chồng KM</th>
                <th className="py-3 px-4 font-semibold text-slate-800 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : currentDiscounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    Không có khuyến mãi nào
                  </td>
                </tr>
              ) : (
                currentDiscounts.map(d => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs font-semibold text-blue-600">{d.code || 'N/A'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${d.type === 'voucher' ? 'bg-yellow-100 text-yellow-800' :
                        d.type === 'festival' ? 'bg-purple-100 text-purple-800' :
                          d.type === 'member' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {d.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">
                        {d.discountType === 'percentage' ? `${d.discountValue}%` : formatPrice(d.discountValue)}
                      </p>
                      {d.maxDiscount && <p className="text-xs text-gray-500">Max: {formatPrice(d.maxDiscount)}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{getHotelNames(d.applicableHotels)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{moment(d.endDate).format('DD/MM/YYYY')}</td>
                    <td className="py-3 px-4 text-center">
                      {d.isStackable ? (
                        <CheckSquare className="text-green-500 mx-auto" size={18} />
                      ) : (
                        <Lock className="text-red-500 mx-auto" size={18} />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(d)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(d._id)}
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
        {!loading && filteredAndSortedDiscounts.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị {indexOfFirstDiscount + 1}-{Math.min(indexOfLastDiscount, filteredAndSortedDiscounts.length)} trên {filteredAndSortedDiscounts.length}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-800">
                {isEditing ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
              </h3>
              <button onClick={handleCancelModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Tên khuyến mãi"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700">Loại khuyến mãi</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                  >
                    {discountTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {formData.type === 'voucher' && (
                  <InputField
                    label="Mã Voucher"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                  />
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700">Loại giảm giá</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
                  >
                    {discountValueTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <InputField
                  label="Giá trị"
                  name="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  required
                />
                {formData.discountType === 'percentage' && (
                  <InputField
                    label="Giảm tối đa (VND)"
                    name="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    placeholder="Không giới hạn"
                  />
                )}
                <div className="md:col-span-2">
                  <InputField
                    label="Mô tả"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    inputType="textarea"
                  />
                </div>
                <div className="md:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-slate-700">Khách sạn áp dụng</label>
                  <select
                    multiple
                    name="applicableHotels"
                    value={formData.applicableHotels}
                    onChange={handleHotelChange}
                    className="w-full mt-1 p-2 border rounded-md bg-white text-sm h-24"
                  >
                    {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Để trống để áp dụng cho tất cả. Giữ Ctrl/Cmd để chọn nhiều.</p>
                </div>
                <InputField
                  label="Ngày bắt đầu"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Ngày kết thúc"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Ảnh (URL)"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-32 w-auto rounded-md object-cover border border-gray-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <CheckBox
                    label="Cho phép chồng khuyến mãi"
                    name="isStackable"
                    checked={formData.isStackable}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, name, type = "text", value, onChange, required, placeholder, disabled, inputType }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    {inputType === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows="3"
        className="w-full mt-1 p-2 border rounded-md bg-white text-sm resize-none"
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
        className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
      />
    )}
  </div>
);

const CheckBox = ({ label, name, checked, onChange }) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      id={name}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <label htmlFor={name} className="ml-2 block text-sm text-slate-700">{label}</label>
  </div>
);

export default AdminDiscounts;