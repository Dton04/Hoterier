import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiLock, FiCheckSquare, FiSearch } from 'react-icons/fi';
import { FaTags } from 'react-icons/fa';

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
  const [discounts, setDiscounts] = useState([]); // ✅ CORRECT INITIALIZATION
  const [hotels, setHotels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('none');

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
      setDiscounts(data || []); // Ensure it's an array even if API returns null/undefined
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách khuyến mãi.');
      setDiscounts([]); // Set to empty array on error
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
    let result = [...discounts]; // Create a copy to avoid mutating state
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

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', type: 'voucher', discountType: 'percentage', discountValue: 0, applicableHotels: [], startDate: '', endDate: '', maxDiscount: '', isStackable: false, image: '' });
  };
  
  const handleEdit = (discount) => {
    window.scrollTo(0, 0);
    setIsEditing(true);
    setEditId(discount._id);
    setFormData({
      ...discount,
      startDate: discount.startDate ? moment(discount.startDate).format('YYYY-MM-DD') : '',
      endDate: discount.endDate ? moment(discount.endDate).format('YYYY-MM-DD') : '',
      applicableHotels: discount.applicableHotels.map(h => h._id || h),
    });
  };

  const handleOpenModal = (discount = null) => {
      if (discount) {
          handleEdit(discount);
      } else {
          setIsEditing(false);
          setEditId(null);
          resetForm();
      }
      setIsModalOpen(true);
  }
  
  const handleCancelModal = () => setIsModalOpen(false);

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
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus /> Thêm Khuyến mãi
          </button>
        </div>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm theo tên hoặc mã..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">Tất cả loại</option>
            <option value="voucher">Voucher</option>
            <option value="festival">Festival</option>
            <option value="member">Member</option>
            <option value="accumulated">Accumulated</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="none">Mặc định</option>
            <option value="desc">Giảm giá: Cao đến thấp</option>
            <option value="asc">Giảm giá: Thấp đến cao</option>
          </select>
        </div>
      </div>

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
                <th className="py-3 px-4 font-semibold text-slate-800">Chồng KM</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Ảnh</th>
                <th className="py-3 px-4 font-semibold text-slate-800">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {filteredAndSortedDiscounts.map(d => (
                <tr key={d._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4"><p className="font-medium text-slate-800">{d.name}</p><p className="text-xs font-semibold text-blue-600">{d.code || 'N/A'}</p></td>
                    <td className="py-3 px-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${ d.type === 'voucher' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }`}>{d.type}</span></td>
                    <td className="py-3 px-4"><p className="font-medium text-slate-800">{d.discountType === 'percentage' ? `${d.discountValue}%` : formatPrice(d.discountValue)}</p>{d.maxDiscount && <p className="text-xs text-gray-500">Max: {formatPrice(d.maxDiscount)}</p>}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{getHotelNames(d.applicableHotels)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{moment(d.endDate).format('DD/MM/YYYY')}</td>
                    <td className="py-3 px-4 text-center">{d.isStackable ? <FiCheckSquare className="text-green-500" /> : <FiLock className="text-red-500" />}</td>
                    <td className="py-3 px-4">{d.image ? <img src={d.image} alt={d.name} className="h-10 w-10 rounded-md object-cover" /> : <FaTags className="text-gray-300" />}</td>
                    <td className="py-3 px-4">
                        <div className="flex items-center space-x-3.5">
                            <button onClick={() => handleEdit(d)} className="text-blue-600 hover:text-blue-800" title="Sửa"><FiEdit size={18} /></button>
                            <button onClick={() => handleDelete(d._id)} className="text-red-600 hover:text-red-800" title="Xóa"><FiTrash2 size={18} /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
        
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-slate-800">{isEditing ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}</h3>
                      <button onClick={handleCancelModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Tên khuyến mãi" name="name" value={formData.name} onChange={handleInputChange} required/>
                        <div className="mb-4"><label className="block text-sm font-medium text-slate-700">Loại khuyến mãi</label><select name="type" value={formData.type} onChange={handleInputChange} disabled={isEditing} className="w-full mt-1 p-2 border rounded-md bg-white text-sm">{discountTypes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                        {formData.type === 'voucher' && <InputField label="Mã Voucher" name="code" value={formData.code} onChange={handleInputChange} required/>}
                        <div className="grid grid-cols-2 gap-2"><div className="mb-4"><label className="block text-sm font-medium text-slate-700">Loại giảm giá</label><select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-white text-sm">{discountValueTypes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div><InputField label="Giá trị" name="discountValue" type="number" value={formData.discountValue} onChange={handleInputChange} required/></div>
                        {formData.discountType === 'percentage' && <InputField label="Giảm tối đa (VND)" name="maxDiscount" type="number" value={formData.maxDiscount} onChange={handleInputChange} placeholder="Không giới hạn"/>}
                        <div className="md:col-span-2"><InputField label="Mô tả" name="description" value={formData.description} onChange={handleInputChange} type="textarea"/></div>
                        <div className="md:col-span-2 mb-4"><label className="block text-sm font-medium text-slate-700">Khách sạn áp dụng</label><select multiple name="applicableHotels" value={formData.applicableHotels} onChange={handleHotelChange} className="w-full mt-1 p-2 border rounded-md bg-white text-sm h-24">{hotels.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}</select><p className="text-xs text-gray-500 mt-1">Để trống để áp dụng cho tất cả. Giữ Ctrl/Cmd để chọn nhiều.</p></div>
                        <InputField label="Ngày bắt đầu" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required/>
                        <InputField label="Ngày kết thúc" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} required/>
                        <div className="md:col-span-2"><InputField label="Ảnh (URL)" name="image" value={formData.image} onChange={handleInputChange}/></div>
                        <div className="md:col-span-2"><CheckBox label="Cho phép chồng khuyến mãi" name="isStackable" checked={formData.isStackable} onChange={handleInputChange}/></div>
                      </div>
                      <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                          <button type="button" onClick={handleCancelModal} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Lưu</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

const InputField=({label,name,type="text",value,onChange,required,placeholder,disabled,type:inputType})=>(<div className="mb-4"><label className="block text-sm font-medium text-slate-700">{label}</label>{inputType==="textarea"?<textarea name={name} value={value} onChange={onChange} required={required} disabled={disabled} rows="2" className="w-full mt-1 p-2 border rounded-md bg-white text-sm"/>:<input type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} className="w-full mt-1 p-2 border rounded-md bg-white text-sm"/>}</div>);
const CheckBox=({label,name,checked,onChange})=>(<div className="flex items-center"><input type="checkbox" name={name} checked={checked} onChange={onChange} id={name} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><label htmlFor={name} className="ml-2 block text-sm text-slate-700">{label}</label></div>);

export default AdminDiscounts;