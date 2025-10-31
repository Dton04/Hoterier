import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Button, Form, Input } from "antd";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiImage } from "react-icons/fi";

// --- DANH SÁCH TỈNH THÀNH THEO VÙNG MIỀN ---
const MIEN_BAC = ["Hà Nội", "Hải Phòng", "Quảng Ninh", "Bắc Ninh", "Nam Định", "Ninh Bình", "Lào Cai"];
const MIEN_TRUNG = ["Đà Nẵng", "Huế", "Quảng Nam", "Quảng Ngãi", "Khánh Hòa", "Nha Trang", "Cam Ranh", "Bình Định"];
const MIEN_NAM = ["TP.HCM", "Hồ Chí Minh", "Cần Thơ", "Vũng Tàu", "Bình Dương", "Đồng Nai"];

function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  // --- Modal thêm thành phố ---
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [newCity, setNewCity] = useState("");

  const handleOpenCityModal = (region) => {
    setCurrentRegion(region);
    setCityModalOpen(true);
  };

  const handleAddCity = async () => {
    if (!newCity.trim()) return toast.error("Vui lòng nhập tên thành phố!");
    try {
      await axios.post(`/api/regions/${currentRegion._id}/cities`, { name: newCity }, config);
      toast.success("✅ Đã thêm thành phố mới!");
      setNewCity("");
      setCityModalOpen(false);
      fetchRegions();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Lỗi khi thêm thành phố!");
    }
  };

  // --- Lấy danh sách khu vực ---
  const fetchRegions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/regions", config);
      setRegions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("❌ Không thể tải danh sách khu vực.");
      setRegions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  // --- PHÂN MIỀN & TÌM KIẾM ---
  const groupedRegions = useMemo(() => {
    const filtered = (regions || []).filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const groups = { north: [], central: [], south: [], other: [] };
    filtered.forEach((r) => {
      if (MIEN_BAC.some((x) => r.name.includes(x))) groups.north.push(r);
      else if (MIEN_TRUNG.some((x) => r.name.includes(x))) groups.central.push(r);
      else if (MIEN_NAM.some((x) => r.name.includes(x))) groups.south.push(r);
      else groups.other.push(r);
    });
    return groups;
  }, [regions, searchTerm]);

  // --- Modal khu vực ---
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

    const reqConfig = {
      headers: { ...config.headers, "Content-Type": "multipart/form-data" },
    };

    try {
      if (isEditing) {
        await axios.put(`/api/regions/${editId}`, formData, reqConfig);
        toast.success("✅ Cập nhật khu vực thành công!");
      } else {
        await axios.post("/api/regions", formData, reqConfig);
        toast.success("🎉 Tạo khu vực mới thành công!");
      }
      setIsModalOpen(false);
      fetchRegions();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Có lỗi xảy ra!");
    }
  };

  // --- Xóa khu vực ---
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khu vực này?")) return;
    try {
      await axios.delete(`/api/regions/${id}`, config);
      toast.success("🗑️ Đã xóa khu vực!");
      fetchRegions();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi xóa khu vực");
    }
  };

  // 🖼️ Upload ảnh khu vực
  const handleUploadImage = async (id) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("image", file);

      try {
        await axios.post(`/api/regions/${id}/image`, formData, {
          headers: { ...config.headers, "Content-Type": "multipart/form-data" },
        });
        toast.success("📸 Cập nhật ảnh khu vực thành công!");
        fetchRegions();
      } catch (error) {
        toast.error(error.response?.data?.message || "❌ Lỗi khi cập nhật ảnh!");
      }
    };
    fileInput.click();
  };

  // ❌ Xóa ảnh khu vực
  const handleDeleteImage = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh khu vực này?")) return;
    try {
      await axios.delete(`/api/regions/${id}/image`, config);
      toast.success("🧹 Đã xóa ảnh khu vực!");
      fetchRegions();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi xóa ảnh!");
    }
  };

  // --- Loading ---
  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={2500} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Quản lý Khu vực & Thành phố
        </h2>
        <div className="flex gap-4 items-center">
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Quay lại Dashboard
          </Link>
          <Button type="primary" icon={<FiPlus />} onClick={() => handleOpenModal()}>
            Thêm Khu vực
          </Button>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="mb-8 relative w-full md:w-1/3">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm khu vực..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Grid các miền */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
        {[
          ["Miền Bắc", groupedRegions.north],
          ["Miền Trung", groupedRegions.central],
          ["Miền Nam", groupedRegions.south],
          ["Khác", groupedRegions.other],
        ].map(([title, list]) =>
          list.length > 0 ? (
            <RegionColumn
              key={title}
              title={title}
              regions={list}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onAddCity={handleOpenCityModal}
              onUploadImage={handleUploadImage}
              onDeleteImage={handleDeleteImage}
            />
          ) : null
        )}
      </div>

      {/* Modal khu vực */}
      <Modal
        title={isEditing ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}
        open={isModalOpen}
        onCancel={handleCancelModal}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="p-2">
          <Form.Item
            label="Tên khu vực"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên khu vực!" }]}
          >
            <Input placeholder="VD: TP.HCM, Khánh Hòa..." />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (Tùy chọn)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </Form.Item>
          <Form.Item className="text-right">
            <Button onClick={handleCancelModal} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal thêm thành phố */}
      <Modal
        title={`Thêm Thành phố cho ${currentRegion?.name || ""}`}
        open={cityModalOpen}
        onCancel={() => setCityModalOpen(false)}
        onOk={handleAddCity}
        okText="Thêm"
        cancelText="Hủy"
        centered
      >
        <input
          type="text"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Nhập tên thành phố (VD: Quận 1, Cam Ranh...)"
          className="w-full border rounded-md p-2 text-sm"
        />
      </Modal>
    </div>
  );
}

// --- Component hiển thị khu vực ---
const RegionColumn = ({ title, regions, onEdit, onDelete, onAddCity, onUploadImage, onDeleteImage }) => (
  <div>
    <h3 className="text-xl font-semibold text-slate-700 mb-4 border-b-2 border-blue-500 pb-2">
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-4">
      {regions.length > 0 ? (
        regions.map((region) => (
          <div key={region._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group">
            <div className="h-32 overflow-hidden relative">
              <img
                src={region.imageUrl || "/images/placeholder.jpg"}
                alt={region.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(region)} className="bg-white/80 p-2 rounded-full text-blue-600 hover:bg-white">
                  <FiEdit size={16} />
                </button>
                <button onClick={() => onUploadImage(region._id)} className="bg-white/80 p-2 rounded-full text-green-600 hover:bg-white">
                  <FiImage size={16} />
                </button>
                <button onClick={() => onDeleteImage(region._id)} className="bg-white/80 p-2 rounded-full text-yellow-600 hover:bg-white">
                  ✕
                </button>
                <button onClick={() => onDelete(region._id)} className="bg-white/80 p-2 rounded-full text-red-600 hover:bg-white">
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            <div className="p-3 bg-white text-center">
              <h4 className="text-base font-semibold text-gray-800">{region.name}</h4>
              {region.cities?.length > 0 ? (
                <ul className="mt-2 text-xs text-gray-600 space-y-1 border-t pt-2">
                  {region.cities.map((city, i) => (
                    <li key={i}>{city.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 mt-2 italic">Chưa có thành phố</p>
              )}
              <button
                onClick={() => onAddCity(region)}
                className="mt-2 text-blue-600 hover:underline text-sm font-medium"
              >
                + Thêm Thành phố
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">Chưa có khu vực nào.</p>
      )}
    </div>
  </div>
);

export default AdminRegions;
