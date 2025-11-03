import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Modal,
  Button,
  Form,
  Input,
  Spin,
  Tooltip,
  Empty,
  Tag,
  Divider,
} from "antd";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiImage,
  FiMapPin,
} from "react-icons/fi";

const MIEN_BAC = ["Hà Nội", "Hải Phòng", "Quảng Ninh", "Bắc Ninh", "Nam Định", "Ninh Bình"];
const MIEN_TRUNG = ["Đà Nẵng", "Huế", "Quảng Nam", "Khánh Hòa", "Bình Định","Đắk Lắk"];
const MIEN_NAM = ["TP.HCM", "Hồ Chí Minh", "Cần Thơ", "An Giang", "Bình Dương", "Đồng Nai", "Cà Mau","Đồng Tháp"];

export default function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal khu vực
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newImage, setNewImage] = useState(null);

  // Modal thành phố
  const [cityModal, setCityModal] = useState({ open: false, region: null });
  const [newCity, setNewCity] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  /** 📦 Fetch Regions */
  const fetchRegions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/regions", config);
      setRegions(data || []);
    } catch {
      toast.error("Không thể tải danh sách khu vực!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  /** 🔍 Nhóm theo miền */
  const groupedRegions = useMemo(() => {
    const filtered = regions.filter((r) =>
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

  /** ✏️ Thêm/Sửa khu vực */
  const openRegionModal = (region = null) => {
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

  const handleRegionSubmit = async (values) => {
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
        toast.success("🎉 Đã thêm khu vực mới!");
      }
      setIsModalOpen(false);
      fetchRegions();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Lỗi khi lưu khu vực!");
    }
  };

  /** 🗑 Xóa khu vực */
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khu vực này?")) return;
    try {
      await axios.delete(`/api/regions/${id}`, config);
      toast.success("🗑️ Đã xóa khu vực!");
      fetchRegions();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Lỗi khi xóa khu vực!");
    }
  };

  /** 🖼 Upload ảnh khu vực */
  const handleUploadImage = async (id) => {
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.onchange = async (e) => {
      const fileData = e.target.files[0];
      if (!fileData) return;
      const fd = new FormData();
      fd.append("image", fileData);
      try {
        await axios.post(`/api/regions/${id}/image`, fd, {
          headers: { ...config.headers, "Content-Type": "multipart/form-data" },
        });
        toast.success("📸 Đã cập nhật ảnh khu vực!");
        fetchRegions();
      } catch {
        toast.error("Lỗi khi tải ảnh!");
      }
    };
    file.click();
  };

  /** ❌ Xóa ảnh */
  const handleDeleteImage = async (id) => {
    if (!window.confirm("Xóa ảnh này?")) return;
    try {
      await axios.delete(`/api/regions/${id}/image`, config);
      toast.success("🧹 Đã xóa ảnh khu vực!");
      fetchRegions();
    } catch {
      toast.error("❌ Lỗi khi xóa ảnh!");
    }
  };

  /** 🏙 Thêm thành phố */
  const handleAddCity = async () => {
    if (!newCity.trim()) return toast.error("Vui lòng nhập tên thành phố!");
    try {
      await axios.post(
        `/api/regions/${cityModal.region._id}/cities`,
        { name: newCity },
        config
      );
      toast.success("✅ Thêm thành phố thành công!");
      setCityModal({ open: false, region: null });
      setNewCity("");
      fetchRegions();
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Lỗi khi thêm thành phố!");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-72">
        <Spin size="large" />
      </div>
    );

  const renderRegionColumn = (title, list) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
        <FiMapPin /> {title}
      </h3>
      <Divider className="my-2" />
      {list.length === 0 ? (
        <Empty description="Không có khu vực" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        list.map((region) => (
          <div
            key={region._id}
            className="flex items-start gap-4 border-b last:border-0 py-3 hover:bg-gray-50 rounded-md transition"
          >
            <img
              src={region.imageUrl || "/images/placeholder.jpg"}
              alt={region.name}
              className="w-20 h-16 rounded-md object-cover border"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-slate-800">{region.name}</h4>
                <div className="flex gap-2">
                  <Tooltip title="Sửa">
                    <Button
                      size="small"
                      icon={<FiEdit />}
                      onClick={() => openRegionModal(region)}
                    />
                  </Tooltip>
                  <Tooltip title="Ảnh">
                    <Button
                      size="small"
                      icon={<FiImage />}
                      onClick={() => handleUploadImage(region._id)}
                    />
                  </Tooltip>
                  <Tooltip title="Xóa ảnh">
                    <Button
                      size="small"
                      danger
                      icon={<span>✕</span>}
                      onClick={() => handleDeleteImage(region._id)}
                    />
                  </Tooltip>
                  <Tooltip title="Xóa khu vực">
                    <Button
                      size="small"
                      danger
                      icon={<FiTrash2 />}
                      onClick={() => handleDelete(region._id)}
                    />
                  </Tooltip>
                </div>
              </div>

              {/* Thành phố */}
              {region.cities?.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {region.cities.map((c, i) => (
                    <Tag key={i} color="blue">
                      {c.name}
                    </Tag>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic mt-1">
                  Chưa có thành phố
                </p>
              )}
              <Button
                type="link"
                size="small"
                className="text-blue-600 p-0 mt-1"
                onClick={() => setCityModal({ open: true, region })}
              >
                + Thêm thành phố
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="p-5">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Quản lý Khu vực & Thành phố
        </h2>
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Quay lại Dashboard
          </Link>
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={() => openRegionModal()}
          >
            Thêm Khu vực
          </Button>
        </div>
      </div>

      {/* Search */}
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

      {/* Layout vùng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderRegionColumn("Miền Bắc", groupedRegions.north)}
        {renderRegionColumn("Miền Trung", groupedRegions.central)}
        {renderRegionColumn("Miền Nam", groupedRegions.south)}
      </div>

      {groupedRegions.other.length > 0 && (
        <div className="mt-8">{renderRegionColumn("Khác", groupedRegions.other)}</div>
      )}

      {/* Modal Khu vực */}
      <Modal
        title={isEditing ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegionSubmit}
          className="p-2"
        >
          <Form.Item
            label="Tên khu vực"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên khu vực!" }]}
          >
            <Input placeholder="VD: Khánh Hòa, TP.HCM..." />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (tuỳ chọn)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </Form.Item>
          <div className="text-right">
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
        onCancel={() => setCityModal({ open: false, region: null })}
        onOk={handleAddCity}
        okText="Thêm"
        cancelText="Hủy"
        centered
      >
        <Input
          placeholder="Nhập tên thành phố (VD: Quận 1, Nha Trang...)"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
        />
      </Modal>
    </div>
  );
}
