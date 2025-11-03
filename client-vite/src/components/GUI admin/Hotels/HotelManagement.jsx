import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiMail,
  FiPhone,
  FiEdit,
  FiTrash2,
  FiSettings,
  FiSearch,
} from "react-icons/fi";

const HotelManagement = () => {
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
    district: "",
    city: "",
    contactNumber: "",
    email: "",
    description: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = {
    headers: { Authorization: `Bearer ${userInfo?.token}` },
  };

  /** 🔹 Lấy danh sách khách sạn và khu vực */
  const fetchHotels = async () => {
    try {
      const { data } = await axios.get("/api/hotels", config);
      setHotels(data);
    } catch {
      toast.error("Lỗi khi lấy danh sách khách sạn");
    }
  };

  const fetchRegions = async () => {
    try {
      const { data } = await axios.get("/api/regions", config);
      setRegions(data);
    } catch {
      toast.error("Lỗi khi lấy danh sách khu vực");
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchRegions();
  }, []);

  /** 🔹 Xử lý thay đổi input */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  /** 🔹 Reset form */
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      region: "",
      district: "",
      city: "",
      contactNumber: "",
      email: "",
      description: "",
    });
    setNewImages([]);
    setIsEditing(false);
    setEditId(null);
    const imgInput = document.getElementById("image-upload");
    if (imgInput) imgInput.value = null;
  };

  /** 🔹 Thêm hoặc cập nhật khách sạn */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedHotelId;

      const payload = { ...formData, district: formData.city };

      if (isEditing) {
        await axios.put(`/api/hotels/${editId}`, payload, config);
        savedHotelId = editId;
        toast.success("Cập nhật thông tin khách sạn thành công!");
      } else {
        const { data } = await axios.post("/api/hotels", payload, config);
        savedHotelId = data.hotel._id;
        toast.success("Thêm khách sạn thành công!");
      }

      /** 🖼 Upload ảnh nếu có */
      if (newImages.length > 0) {
        const imagePayload = new FormData();
        newImages.forEach((image) => {
          imagePayload.append("images", image);
        });
        await axios.post(`/api/hotels/${savedHotelId}/images`, imagePayload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        toast.success("Tải ảnh lên thành công!");
      }

      resetForm();
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  /** 🔹 Chỉnh sửa khách sạn */
  const handleEdit = (hotel) => {
    window.scrollTo(0, 0);
    setFormData({
      name: hotel.name,
      address: hotel.address,
      region: hotel.region?._id || "",
      city: hotel.district || "",
      contactNumber: hotel.contactNumber,
      email: hotel.email,
      description: hotel.description,
    });
    setIsEditing(true);
    setEditId(hotel._id);
  };

  /** 🔹 Xóa khách sạn */
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa khách sạn này?")) {
      try {
        await axios.delete(`/api/hotels/${id}`, config);
        toast.success("Xóa khách sạn thành công!");
        fetchHotels();
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa khách sạn");
      }
    }
  };

  /** 🔹 Tìm kiếm khách sạn */
  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">
          Quản lý Khách sạn
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/admin/dashboard" className="font-medium">
                Dashboard /
              </Link>
            </li>
            <li className="font-medium text-blue-600">Hotels</li>
          </ol>
        </nav>
      </div>

      {/* Form thêm/sửa */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-gray-200 pb-4">
          {isEditing
            ? "Chỉnh sửa thông tin khách sạn"
            : "Thêm khách sạn mới"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột 1 */}
            <div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Tên khách sạn
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Khu vực / Thành phố
                </label>
                <select
                  name="region"
                  value={
                    formData.region
                      ? `${formData.region}|${formData.city}`
                      : ""
                  }
                  onChange={(e) => {
                    const [regionId, cityName] = e.target.value.split("|");
                    setFormData((prev) => ({
                      ...prev,
                      region: regionId,
                      city: cityName || "",
                    }));
                  }}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Chọn khu vực</option>
                  {regions.map((region) => (
                    <optgroup key={region._id} label={region.name}>
                      {region.cities?.map((city, i) => (
                        <option key={i} value={`${region._id}|${city.name}`}>
                          {city.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            {/* Cột 2 */}
            <div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiMail className="text-gray-400" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiPhone className="text-gray-400" />
                  </span>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Ảnh khách sạn
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {isEditing ? "Cập nhật" : "Thêm Khách Sạn"}
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách khách sạn */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm">
        <div className="mb-4 relative w-full md:w-1/2">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc địa chỉ khách sạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white pl-11 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Khách sạn</th>
                <th className="py-4 px-4 font-medium text-slate-800">Liên hệ</th>
                <th className="py-4 px-4 font-medium text-slate-800">Khu vực</th>
                <th className="py-4 px-4 font-medium text-slate-800">Phòng</th>
                <th className="py-4 px-4 font-medium text-slate-800 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.map((hotel) => (
                <tr key={hotel._id}>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={hotel.imageurls?.[0]}
                        alt={hotel.name}
                        className="h-12 w-16 rounded object-cover"
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
                      {hotel.region?.name || "N/A"}{" "}
                      {hotel.district ? `- ${hotel.district}` : ""}
                    </p>
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <p className="text-slate-800">{hotel.rooms.length} phòng</p>
                  </td>
                  <td className="border-b border-gray-200 py-4 px-4">
                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={() => handleEdit(hotel)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Sửa"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(hotel._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      <Link
                        to={`/admin/hotel/${hotel._id}/rooms`}
                        className="text-green-600 hover:text-green-800"
                        title="Quản lý phòng"
                      >
                        <FiSettings size={18} />
                      </Link>
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

export default HotelManagement;
