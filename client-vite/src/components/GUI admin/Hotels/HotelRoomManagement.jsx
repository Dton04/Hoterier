import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

const HotelRoomManagement = () => {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    name: '', maxcount: '', beds: '', baths: '', quantity: '', rentperday: '', type: '', description: '', availabilityStatus: 'available',
  });
  const [newImages, setNewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [amenityQuery, setAmenityQuery] = useState("");
  const [showAmenityDropdown, setShowAmenityDropdown] = useState(false);

  // Helper: chuẩn hóa đối tượng tiện ích thành tên (string)
  const toAmenityName = (a) => (typeof a === "string" ? a : a?.name || "");

  // Tìm kiếm tiện ích theo tên
  const filteredAmenities = amenities.filter((a) =>
    toAmenityName(a).toLowerCase().includes(amenityQuery.toLowerCase())
  );

  // Thêm tiện ích theo tên, tránh trùng (không phân biệt hoa thường)
  const addAmenity = (name) => {
    const normalized = (name || "").trim();
    if (!normalized) return;
    setSelectedAmenities((prev) => {
      const has = prev.some((a) => toAmenityName(a).toLowerCase() === normalized.toLowerCase());
      return has ? prev : [...prev, normalized];
    });
    setAmenityQuery("");
    setShowAmenityDropdown(false);
  };

  // Xóa tiện ích theo tên (kể cả khi phần tử trong mảng là object)
  const removeAmenity = (name) => {
    setSelectedAmenities((prev) => prev.filter((a) => toAmenityName(a) !== name));
  };
  // Lấy token để xác thực
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  // --- LOGIC (Giữ nguyên, chỉ thêm Toast) ---
  const fetchHotelAndRooms = async () => {
    try {
      const { data } = await axios.get(`/api/hotels/${hotelId}/rooms`, config);
      setHotel(data.hotel);
      setRooms(data.rooms);
    } catch (err) {
      toast.error('Lỗi khi lấy thông tin khách sạn và phòng');
    }
  };

  useEffect(() => {
    fetchHotelAndRooms();

    // Lấy danh sách tiện ích từ DB
    const fetchAmenities = async () => {
      try {
        const { data } = await axios.get("/api/amenities", config);
        setAmenities(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Lỗi khi lấy danh sách tiện ích");
      }
    };
    fetchAmenities();
  }, [hotelId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const resetForm = () => {
    setFormData({ name: '', maxcount: '', beds: '', baths: '', quantity: '', rentperday: '', type: '', description: '', availabilityStatus: 'available' });
    setNewImages([]);
    setIsEditing(false);
    setEditId(null);
    // Xóa lựa chọn tiện ích và dropdown
    setSelectedAmenities([]);
    setAmenityQuery("");
    setShowAmenityDropdown(false);
    if (document.getElementById('image-upload-room')) {
      document.getElementById('image-upload-room').value = null;
    }
  };
  
  const handleEdit = (room) => {
    window.scrollTo(0, 0);
    setFormData({
      name: room.name,
      maxcount: room.maxcount,
      beds: room.beds,
      baths: room.baths,
      quantity: room.quantity,
      rentperday: room.rentperday,
      type: room.type,
      description: room.description,
      availabilityStatus: room.availabilityStatus,
    });

    // Chuyển tiện ích về mảng tên (string) để tránh render object trong JSX
    const amenityNames = Array.isArray(room.amenities)
      ? room.amenities
          .map((a) => (typeof a === "string" ? a : a?.name))
          .filter(Boolean)
      : [];
    setSelectedAmenities(amenityNames);

    setIsEditing(true);
    setEditId(room._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gửi JSON cho tạo/cập nhật phòng
    const payload = {
      ...formData,
      hotelId,
      amenities: selectedAmenities, // mảng chuỗi tên tiện ích
    };

    try {
      let roomId;

      if (isEditing) {
        const { data } = await axios.patch(`/api/rooms/${editId}`, payload, config);
        roomId = editId;
        toast.success('Cập nhật phòng thành công!');
      } else {
        const { data } = await axios.post('/api/rooms', payload, config);
        roomId = data.room?._id;
        toast.success('Thêm phòng thành công!');
      }

      // Upload ảnh nếu có, tách riêng qua route /api/rooms/:id/images
      if (newImages.length > 0 && roomId) {
        const imageForm = new FormData();
        newImages.forEach((img) => imageForm.append('images', img));

        await axios.post(`/api/rooms/${roomId}/images`, imageForm, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        toast.success('Tải ảnh phòng lên thành công!');
      }

      resetForm();
      fetchHotelAndRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phòng này?')) {
      try {
        await axios.delete(`/api/rooms/${id}?hotelId=${hotelId}`, config);
        toast.success('Xóa phòng thành công!');
        fetchHotelAndRooms();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa phòng');
      }
    }
  };
  
  // --- GIAO DIỆN (Đã viết lại) ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available': return <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">Có sẵn</p>;
      case 'maintenance': return <p className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-600">Bảo trì</p>;
      case 'busy': return <p className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">Đang sử dụng</p>;
      default: return <p className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">Không rõ</p>;
    }
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Breadcrumb và Tiêu đề */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h2 className="text-2xl font-semibold text-slate-800">Quản lý Phòng</h2>
            <p className="text-sm text-gray-500">Khách sạn: {hotel?.name || 'Đang tải...'}</p>
        </div>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
            <li><Link to="/admin/hotels" className="font-medium">Hotels /</Link></li>
            <li className="font-medium text-blue-600">Rooms</li>
          </ol>
        </nav>
      </div>

      {/* Form thêm/sửa phòng */}
      <div className="rounded-lg border border-gray-200 bg_white p-6 shadow-sm mb-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-gray-200 pb-4">
          {isEditing ? 'Chỉnh sửa thông tin phòng' : 'Thêm phòng mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Các trường input */}
            <InputField label="Tên phòng" name="name" value={formData.name} onChange={handleInputChange} required />
            <InputField label="Số người tối đa" name="maxcount" type="number" value={formData.maxcount} onChange={handleInputChange} required />
            <InputField label="Số giường" name="beds" type="number" value={formData.beds} onChange={handleInputChange} required />
            <InputField label="Số phòng tắm" name="baths" type="number" value={formData.baths} onChange={handleInputChange} required />
            <InputField label="Số lượng phòng" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
            <InputField label="Giá mỗi ngày (VNĐ)" name="rentperday" type="number" value={formData.rentperday} onChange={handleInputChange} required />
            <InputField label="Loại phòng" name="type" value={formData.type} onChange={handleInputChange} required />
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Trạng thái</label>
              <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="available">Có sẵn</option>
                <option value="maintenance">Bảo trì</option>
                <option value="busy">Đang sử dụng</option>
              </select>
            </div>

            {/* Combobox chọn tiện ích */}
            <div className="mb-4 md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-slate-700">Tiện ích phòng</label>

              {/* Chips tiện ích đã chọn */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedAmenities.map((a) => {
                  const label = toAmenityName(a);
                  if (!label) return null;
                  return (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeAmenity(label)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {selectedAmenities.length === 0 && (
                  <span className="text-sm text-gray-500">Chưa chọn tiện ích nào</span>
                )}
              </div>

              {/* Ô tìm kiếm + dropdown */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm hoặc chọn tiện ích…"
                  value={amenityQuery}
                  onChange={(e) => {
                    setAmenityQuery(e.target.value);
                    setShowAmenityDropdown(true);
                  }}
                  onFocus={() => setShowAmenityDropdown(true)}
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {showAmenityDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredAmenities.length > 0 ? (
                      filteredAmenities.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          onClick={() => addAmenity(item.name)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy tiện ích phù hợp</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-slate-700">Mô tả</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
            </div>
            
            <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">Ảnh phòng</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} id="image-upload-room"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            {isEditing && ( <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Hủy</button> )}
            <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              <FiPlus className="inline -ml-1 mr-1" /> {isEditing ? 'Cập nhật' : 'Thêm Phòng'}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách phòng */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Phòng</th>
                <th className="py-4 px-4 font-medium text-slate-800">Sức chứa</th>
                <th className="py-4 px-4 font-medium text-slate-800">Giá/Ngày</th>
                <th className="py-4 px-4 font-medium text-slate-800">Số lượng</th>
                <th className="py-4 px-4 font-medium text-slate-800">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-slate-800">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id}>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={room.imageurls?.[0]} alt={room.name} className="h-12 w-16 rounded object-cover"/>
                      <div>
                        <p className="font-medium text-slate-800">{room.name}</p>
                        <p className="text-sm text-gray-500">{room.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4"><p>{room.maxcount} người</p></td>
                  <td className="border-b border-gray-200 py-4 px-4"><p>{room.rentperday?.toLocaleString('vi-VN')} VNĐ</p></td>
                  <td className="border-b border-gray-200 py-4 px-4"><p>{room.quantity}</p></td>
                  <td className="border-b border-gray-200 py-4 px-4">{getStatusBadge(room.availabilityStatus)}</td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleEdit(room)} className="text-blue-600 hover:text-blue-800" title="Sửa"><FiEdit size={18} /></button>
                      <button onClick={() => handleDelete(room._id)} className="text-red-600 hover:text-red-800" title="Xóa"><FiTrash2 size={18} /></button>
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
}

// Component phụ để render input field cho gọn
const InputField = ({ label, name, type = 'text', value, onChange, required }) => (
    <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-slate-700">{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange} 
            required={required}
            className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
        />
    </div>
);

export default HotelRoomManagement;