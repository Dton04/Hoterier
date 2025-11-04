import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Modal,
  Button,
  Form,
  Input,
  Spin,
  Tooltip,
  Tag,
  Select,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const { Option } = Select;

// Định nghĩa các miền để chọn
const DOMAIN_OPTIONS = [
  { value: 'all', label: 'Tất cả miền' },
  { value: 'north', label: 'Miền Bắc' },
  { value: 'central', label: 'Miền Trung' },
  { value: 'south', label: 'Miền Nam' },
  { value: 'other', label: 'Khác' },
];

export default function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc và phân trang
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    domain: 'all',
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegions, setTotalRegions] = useState(0);

  // Modal khu vực (Thêm/Sửa)
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newImage, setNewImage] = useState(null);

  // Modal thành phố
  const [cityModal, setCityModal] = useState({ open: false, region: null });
  const [newCity, setNewCity] = useState("");

  // Modal Xóa
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  /** 📦 Fetch Regions (Hỗ trợ filter và pagination) */
  const fetchRegions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };

      // Chỉ thêm filter nếu có giá trị
      if (filters.name) params.name = filters.name;
      if (filters.city) params.city = filters.city;
      if (filters.domain !== 'all') params.domain = filters.domain;

      const { data } = await axios.get("/api/regions", { params });
      
      console.log("📊 Data nhận từ API:", {
        totalRegions: data.totalRegions,
        currentPage: data.currentPage,
        sampleRegion: data.regions?.[0] // Log region đầu tiên để xem structure
      });
      
      setRegions(data.regions || []);
      setTotalPages(data.totalPages || 1);
      setTotalRegions(data.totalRegions || 0);
    } catch (err) {
      console.error("Lỗi fetch regions:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách khu vực!");
      toast.error("Lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [filters]);

  // --- Xử lý Filters và Pagination ---
  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleDomainFilterChange = (value) => {
    setFilters((prev) => ({ ...prev, domain: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // --- Xử lý Modal Khu Vực (Thêm/Sửa) ---
  const openRegionModal = (region = null) => {
    if (region) {
      console.log("🔧 Mở modal sửa region:", {
        id: region._id,
        name: region.name,
        domain: region.domain,
        cities: region.cities?.length || 0
      });
      
      setIsEditing(true);
      setEditId(region._id);
      form.setFieldsValue({
        name: region.name,
        domain: region.domain || 'other',
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      form.resetFields();
      form.setFieldsValue({ domain: 'other' });
    }
    setNewImage(null);
    setIsModalOpen(true);
  };

  const handleRegionSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("domain", values.domain);
      if (newImage) formData.append("image", newImage);

      let response;
      if (isEditing) {
        response = await axios.put(`/api/regions/${editId}`, formData, {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log("✅ Response từ server:", response.data);
        toast.success("Cập nhật khu vực thành công!");
      } else {
        response = await axios.post("/api/regions", formData, {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Đã thêm khu vực mới!");
      }

      setIsModalOpen(false);
      setNewImage(null);
      form.resetFields();
      
      // Đợi một chút rồi mới fetch lại để đảm bảo DB đã lưu xong
      setTimeout(() => {
        fetchRegions();
      }, 300);
    } catch (err) {
      console.error("❌ Lỗi khi lưu khu vực:", err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu khu vực!");
    }
  };
  
  // --- Xử lý Modal Thành Phố ---
  const handleAddCity = async () => {
    const city = newCity.trim();
    if (!city) return toast.error("Vui lòng nhập tên thành phố!");
    
    try {
      await axios.post(`/api/regions/${cityModal.region._id}/cities`, { name: city }, config);
      toast.success("Thêm thành phố thành công!");
      setCityModal({ open: false, region: null });
      setNewCity("");
      fetchRegions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm thành phố!");
    }
  };

  // --- Xử lý Modal Xóa ---
  const showDeleteConfirm = (regionId) => {
    setRegionToDelete(regionId);
    setDeleteModalVisible(true);
  };

  const handleDeleteOk = async () => {
    if (regionToDelete) {
      try {
        await axios.delete(`/api/regions/${regionToDelete}`, config);
        toast.success("Đã xóa khu vực!");
        fetchRegions();
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa khu vực!");
      }
    }
    setDeleteModalVisible(false);
    setRegionToDelete(null);
  };
  
  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setRegionToDelete(null);
  };

  if (loading && regions.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6" /> 
          Quản lý Khu vực
        </h2>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => openRegionModal()}
          className="bg-[#0071c2] hover:bg-[#005f9c] border-0 font-semibold"
        >
          Thêm Khu vực Mới
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <Input
            name="name"
            value={filters.name}
            onChange={handleFilterInputChange}
            placeholder="Tìm theo tên khu vực..."
            prefix={<Search className="text-gray-400" size={16} />}
            className="w-full md:w-1/3 mb-2 md:mb-0"
            allowClear
          />
          <Input
            name="city"
            value={filters.city}
            onChange={handleFilterInputChange}
            placeholder="Tìm theo tên thành phố..."
            prefix={<Search className="text-gray-400" size={16} />}
            className="w-full md:w-1/3 mb-2 md:mb-0"
            allowClear
          />
          <Select
            value={filters.domain}
            onChange={handleDomainFilterChange}
            style={{ width: '100%' }}
            className="md:w-1/3"
          >
            {DOMAIN_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Tổng số: <strong>{totalRegions}</strong> khu vực
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Khu vực</th>
                <th className="py-4 px-4 font-medium text-slate-800">Miền</th>
                <th className="py-4 px-4 font-medium text-slate-800">Thành phố</th>
                <th className="py-4 px-4 font-medium text-slate-800 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center">
                    <Spin />
                  </td>
                </tr>
              ) : regions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-500">
                    Không tìm thấy khu vực nào phù hợp.
                  </td>
                </tr>
              ) : (
                regions.map((region) => (
                  <tr key={region._id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 py-5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={region.imageUrl || "/images/placeholder.jpg"}
                          alt={region.name}
                          className="w-16 h-12 rounded-md object-cover flex-shrink-0"
                        />
                        <p className="font-medium text-slate-800">{region.name}</p>
                      </div>
                    </td>
                    <td className="border-b border-gray-200 py-5 px-4">
                      <Tag color={
                        region.domain === 'north' ? 'blue' : 
                        region.domain === 'central' ? 'green' : 
                        region.domain === 'south' ? 'gold' : 
                        'default'
                      }>
                        {DOMAIN_OPTIONS.find(o => o.value === region.domain)?.label || 'Khác'}
                      </Tag>
                    </td>
                    <td className="border-b border-gray-200 py-5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {region.cities?.length > 0 ? (
                          region.cities.map((c, i) => (
                            <Tag key={i} color="blue">{c.name}</Tag>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Chưa có</p>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-gray-200 py-5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip title="Sửa khu vực">
                          <button 
                            onClick={() => openRegionModal(region)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip title="Thêm thành phố">
                          <button 
                            onClick={() => setCityModal({ open: true, region })} 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          >
                            <PackagePlus size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip title="Xóa khu vực">
                          <button 
                            onClick={() => showDeleteConfirm(region._id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Trang <strong>{filters.page}</strong> / <strong>{totalPages}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Trước
              </button>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Khu vực (Thêm/Sửa) */}
      <Modal
        title={isEditing ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleRegionSubmit} className="p-4">
          <Form.Item 
            label="Tên khu vực" 
            name="name" 
            rules={[{ required: true, message: "Vui lòng nhập tên khu vực!" }]}
          >
            <Input placeholder="VD: Khánh Hòa..." className="py-2" />
          </Form.Item>
          <Form.Item 
            label="Miền" 
            name="domain" 
            rules={[{ required: true, message: "Vui lòng chọn miền!" }]}
          >
            <Select placeholder="Chọn miền cho khu vực">
              {DOMAIN_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Ảnh đại diện (tùy chọn)">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setNewImage(e.target.files[0])}
              className="w-full"
            />
            {newImage && (
              <p className="mt-2 text-sm text-green-600">Đã chọn: {newImage.name}</p>
            )}
          </Form.Item>
          <div className="text-right pt-2">
            <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Thành phố */}
      <Modal
        title={`Thêm thành phố cho ${cityModal.region?.name || ""}`}
        open={cityModal.open}
        onCancel={() => {
          setCityModal({ open: false, region: null });
          setNewCity("");
        }}
        onOk={handleAddCity}
        okText="Thêm"
        cancelText="Hủy"
        centered
      >
        <Input
          placeholder="Nhập tên thành phố (VD: Quận 1, Nha Trang...)"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          className="py-2"
          onPressEnter={handleAddCity}
        />
      </Modal>
      
      {/* Modal Xóa Khu Vực */}
      <Modal
        title="Xác nhận xóa"
        open={deleteModalVisible}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc muốn xóa khu vực này? Thao tác này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
}