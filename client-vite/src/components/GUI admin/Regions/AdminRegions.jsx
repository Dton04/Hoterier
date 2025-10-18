import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button, Form, Input } from 'antd';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";

// --- DANH SÁCH TỈNH THÀNH THEO VÙNG MIỀN (Chỉ dùng ở Frontend) ---
const MIEN_BAC = ['Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hà Nam', 'Hải Dương', 'Hưng Yên', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Vĩnh Phúc', 'Lào Cai', 'Yên Bái', 'Điện Biên', 'Hòa Bình', 'Lai Châu', 'Sơn La', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ', 'Bắc Giang'];
const MIEN_TRUNG = ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Nha Trang', 'Ninh Thuận', 'Bình Thuận', 'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'Đà Lạt'];
const MIEN_NAM = ['TP.HCM', 'Hồ Chí Minh', 'Bình Phước', 'Bình Dương', 'Đồng Nai', 'Tây Ninh', 'Bà Rịa - Vũng Tàu', 'Long An', 'Đồng Tháp', 'Tiền Giang', 'An Giang', 'Bến Tre', 'Vĩnh Long', 'Trà Vinh', 'Hậu Giang', 'Kiên Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau', 'Cần Thơ'];

function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State cho thanh tìm kiếm
  const [form] = Form.useForm();

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/regions", config);
      setRegions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Không thể tải danh sách khu vực.");
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  // --- LOGIC PHÂN MIỀN VÀ TÌM KIẾM ---
  const groupedRegions = useMemo(() => {
    // 1. Lọc theo thanh tìm kiếm trước
    const filtered = (regions || []).filter(region =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Phân các khu vực đã lọc vào 3 nhóm
    const groups = { north: [], central: [], south: [], other: [] };
    filtered.forEach(region => {
      if (MIEN_BAC.some(city => region.name.includes(city))) {
        groups.north.push(region);
      } else if (MIEN_TRUNG.some(city => region.name.includes(city))) {
        groups.central.push(region);
      } else if (MIEN_NAM.some(city => region.name.includes(city))) {
        groups.south.push(region);
      } else {
        groups.other.push(region); // Các khu vực không xác định
      }
    });
    return groups;
  }, [regions, searchTerm]);


  const handleOpenModal = (region = null) => {
    if (region) {
      setIsEditing(true);
      setEditId(region._id);
      form.setFieldsValue({ name: region.name });
    } else {
      setIsEditing(false);
      setEditId(null);
      form.resetFields();
    }
    setNewImage(null);
    setIsModalOpen(true);
  };

  const handleCancelModal = () => setIsModalOpen(false);

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (newImage) formData.append("image", newImage);
    
    const requestConfig = {
        headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
        },
    };

    try {
      if (isEditing) {
        await axios.put(`/api/regions/${editId}`, formData, requestConfig);
        toast.success("Cập nhật khu vực thành công!");
      } else {
        await axios.post("/api/regions", formData, requestConfig);
        toast.success("Tạo khu vực thành công!");
      }
      setIsModalOpen(false);
      fetchRegions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khu vực này?')) {
        try {
            await axios.delete(`/api/regions/${id}`, config);
            toast.success("Xóa khu vực thành công!");
            fetchRegions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa khu vực.");
        }
    }
  };

  // --- GIAO DIỆN ---
  if (loading) { /* ... spinner ... */ }

  return (
    <div className="p-4 md:p-5">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Khu vực</h2>
        <div className="flex items-center gap-4">
            <nav>
              <ol className="flex items-center gap-2">
                <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
                <li className="font-medium text-blue-600">Regions</li>
              </ol>
            </nav>
            <Button type="primary" icon={<FiPlus />} onClick={() => handleOpenModal()}>
                Thêm Khu vực
            </Button>
        </div>
      </div>
      
      {/* Thanh tìm kiếm */}
      <div className="mb-8 relative w-full md:w-1/3">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
              type="text"
              placeholder="Tìm kiếm khu vực..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
      </div>

      {/* Lưới hiển thị các khu vực đã phân miền */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
        <RegionColumn title="Miền Bắc" regions={groupedRegions.north} onEdit={handleOpenModal} onDelete={handleDelete} />
        <RegionColumn title="Miền Trung" regions={groupedRegions.central} onEdit={handleOpenModal} onDelete={handleDelete} />
        <RegionColumn title="Miền Nam" regions={groupedRegions.south} onEdit={handleOpenModal} onDelete={handleDelete} />
        {/* Hiển thị cột "Khác" nếu có */}
        {groupedRegions.other.length > 0 && (
          <RegionColumn title="Khác" regions={groupedRegions.other} onEdit={handleOpenModal} onDelete={handleDelete} />
        )}
      </div>

      <Modal title={isEditing ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"} open={isModalOpen} onCancel={handleCancelModal} footer={null} centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="p-4">
          <Form.Item label="Tên khu vực" name="name" rules={[{ required: true, message: "Vui lòng nhập tên khu vực!" }]}>
            <Input placeholder="Ví dụ: Hà Nội, Hồ Chí Minh..." />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (Tùy chọn)">
             <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </Form.Item>
          <Form.Item className="text-right">
            <Button onClick={handleCancelModal} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">{isEditing ? "Cập nhật" : "Tạo mới"}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Component phụ để render một cột
const RegionColumn = ({ title, regions, onEdit, onDelete }) => (
  <div>
      <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b-2 border-blue-500 pb-2">{title}</h3>
      <div className="grid grid-cols-1 gap-4"> {/* Giảm khoảng cách giữa các card */}
          {regions.length > 0 ? regions.map((region) => (
              <div key={region._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group">
                  {/* Giảm chiều cao ảnh */}
                  <div className="h-32 overflow-hidden relative">
                      <img src={region.imageUrl || "/images/placeholder.jpg"} alt={region.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(region)} className="bg-white/80 p-2 rounded-full text-blue-600 hover:bg-white"><FiEdit size={16}/></button>
                          <button onClick={() => onDelete(region._id)} className="bg-white/80 p-2 rounded-full text-red-600 hover:bg-white"><FiTrash2 size={16}/></button>
                      </div>
                  </div>
                  {/* Giảm padding và cỡ chữ */}
                  <div className="p-3 text-center bg-white">
                      <h4 className="text-base font-semibold text-gray-800">{region.name}</h4>
                  </div>
              </div>
          )) : (
              <p className="text-sm text-gray-500">Chưa có khu vực nào.</p>
          )}
      </div>
  </div>
);


export default AdminRegions;