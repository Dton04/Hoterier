// src/screens/HotelRoomManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axiosInstance";

// ====== InputField tái sử dụng ======
function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  min,
  step,
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-[#0071c2] focus:ring-[#0071c2]"
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
      />
    </div>
  );
}

// ====== Helper chuyển amenity về tên ======
const amenityToName = (a) =>
  typeof a === "string" ? a : a?.name ? a.name : "";

export default function HotelRoomManagement() {
  const { hotelId } = useParams();

  // ====== State chính ======
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [amenities, setAmenities] = useState([]); // [{_id,name}]
  const [selectedAmenities, setSelectedAmenities] = useState([]); // [string]
  const [amenityQuery, setAmenityQuery] = useState("");
  const [showAmenityDropdown, setShowAmenityDropdown] = useState(false);

  const [newImages, setNewImages] = useState([]); // File[]
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    maxcount: "",
    beds: "",
    baths: "",
    quantity: "",
    rentperday: "",
    type: "",
    description: "",
    availabilityStatus: "available",
  });

  // ====== Lọc amenity theo ô tìm kiếm ======
  const filteredAmenities = useMemo(() => {
    const q = amenityQuery.trim().toLowerCase();
    if (!q) return amenities;
    return amenities.filter((a) => amenityToName(a).toLowerCase().includes(q));
  }, [amenities, amenityQuery]);

  // ====== Fetch dữ liệu ======
  const fetchHotelAndRooms = async () => {
    try {
      setError("");
      const { data } = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
      setHotel(data?.hotel || null);
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch (e) {
      setError("Lỗi khi tải khách sạn/phòng.");
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      setError("");
      const { data } = await axiosInstance.get("/amenities");
      // Đảm bảo dạng [{_id,name}]
      const arr = Array.isArray(data) ? data : [];
      setAmenities(
        arr.map((x) =>
          typeof x === "string" ? { _id: x, name: x } : { _id: x._id, name: x.name }
        )
      );
    } catch (e) {
      setAmenities([]);
    }
  };

  useEffect(() => {
    fetchHotelAndRooms();
    fetchAmenities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  // ====== Handlers ======
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const addAmenity = (name) => {
    const normalized = String(name || "").trim();
    if (!normalized) return;
    setSelectedAmenities((prev) => {
      const has = prev.some((x) => x.toLowerCase() === normalized.toLowerCase());
      return has ? prev : [...prev, normalized];
    });
    setAmenityQuery("");
    setShowAmenityDropdown(false);
  };

  const removeAmenity = (name) => {
    setSelectedAmenities((prev) => prev.filter((x) => x !== name));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      maxcount: "",
      beds: "",
      baths: "",
      quantity: "",
      rentperday: "",
      type: "",
      description: "",
      availabilityStatus: "available",
    });
    setSelectedAmenities([]);
    setNewImages([]);
    setIsEditing(false);
    setEditId(null);
    setAmenityQuery("");
    setShowAmenityDropdown(false);
    const el = document.getElementById("image-upload-room");
    if (el) el.value = null;
  };

  const handleEdit = (room) => {
    window.scrollTo(0, 0);
    setIsEditing(true);
    setEditId(room._id);
    setFormData({
      name: room.name ?? "",
      maxcount: room.maxcount ?? "",
      beds: room.beds ?? "",
      baths: room.baths ?? "",
      quantity: room.quantity ?? "",
      rentperday: room.rentperday ?? "",
      type: room.type ?? "",
      description: room.description ?? "",
      availabilityStatus: room.availabilityStatus ?? "available",
    });
    const amenityNames = Array.isArray(room.amenities)
      ? room.amenities
          .map((a) => amenityToName(a))
          .filter((x) => !!x)
      : [];
    setSelectedAmenities(amenityNames);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng này?")) return;
    try {
      setError("");
      await axiosInstance.delete(`/rooms/${id}?hotelId=${hotelId}`);
      setSuccess("Xóa phòng thành công.");
      await fetchHotelAndRooms();
    } catch (e) {
      setError("Lỗi khi xóa phòng.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const payload = {
      ...formData,
      hotelId,
      amenities: selectedAmenities, // luôn là mảng tên
    };
    try {
      let roomId = null;

      if (isEditing) {
        await axiosInstance.patch(`/rooms/${editId}`, payload);
        roomId = editId;
        setSuccess("Cập nhật phòng thành công.");
      } else {
        const { data } = await axiosInstance.post(`/rooms`, payload);
        roomId = data?.room?._id;
        setSuccess("Thêm phòng thành công.");
      }

      // Upload ảnh (nếu có)
      if (roomId && newImages.length > 0) {
        const form = new FormData();
        newImages.forEach((f) => form.append("images", f));
        await axiosInstance.post(`/rooms/${roomId}/images`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess((s) => (s ? s + " Tải ảnh thành công." : "Tải ảnh thành công."));
      }

      resetForm();
      await fetchHotelAndRooms();
    } catch (e) {
      setError(e?.response?.data?.message || "Lỗi khi lưu phòng.");
    }
  };

  // ====== Render ======
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-[#003580] mb-4">
        Quản Lý Phòng – {hotel ? hotel.name : "Đang tải..."}
      </h2>

      {/* Hotel Info */}
      {hotel && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
          <p>
            <strong>Địa chỉ:</strong> {hotel.address || "—"}
          </p>
          <p>
            <strong>Khu vực:</strong> {hotel?.region?.name || "—"}
          </p>
        </div>
      )}

      {/* Form thêm/sửa phòng */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm mb-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 border-b border-gray-200 pb-4">
          {isEditing ? "Chỉnh sửa thông tin phòng" : "Thêm phòng mới"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField
              label="Tên phòng"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <InputField
              label="Số người tối đa"
              name="maxcount"
              type="number"
              value={formData.maxcount}
              onChange={handleInputChange}
              required
              min={0}
            />
            <InputField
              label="Số giường"
              name="beds"
              type="number"
              value={formData.beds}
              onChange={handleInputChange}
              required
              min={0}
            />
            <InputField
              label="Số phòng tắm"
              name="baths"
              type="number"
              value={formData.baths}
              onChange={handleInputChange}
              required
              min={0}
            />
            <InputField
              label="Số lượng phòng"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min={0}
            />
            <InputField
              label="Giá mỗi ngày (VNĐ)"
              name="rentperday"
              type="number"
              value={formData.rentperday}
              onChange={handleInputChange}
              required
              min={0}
              step="1000"
            />
            <InputField
              label="Loại phòng"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            />

            {/* Trạng thái */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Trạng thái
              </label>
              <select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-[#0071c2] focus:ring-[#0071c2]"
              >
                <option value="available">Có sẵn</option>
                <option value="maintenance">Bảo trì</option>
                <option value="busy">Đang sử dụng</option>
              </select>
            </div>

            {/* Tiện ích */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tiện ích phòng
              </label>

              {/* Chips tiện ích đã chọn */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedAmenities.length === 0 && (
                  <span className="text-sm text-gray-500">
                    Chưa chọn tiện ích nào
                  </span>
                )}
                {selectedAmenities.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeAmenity(name)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Search + dropdown */}
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
                  className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-[#0071c2] focus:ring-[#0071c2]"
                />
                {showAmenityDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                    {filteredAmenities.length > 0 ? (
                      filteredAmenities.map((it) => (
                        <button
                          key={it._id}
                          type="button"
                          onClick={() => addAmenity(amenityToName(it))}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          {amenityToName(it)}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Không tìm thấy tiện ích phù hợp
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

            {/* Mô tả */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-[#0071c2] focus:ring-[#0071c2]"
                placeholder="Thông tin thêm về phòng…"
              />
            </div>

            {/* Ảnh */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ảnh phòng
              </label>
              <input
                id="image-upload-room"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {newImages.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Đã chọn {newImages.length} ảnh
                </p>
              )}
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              className="bg-[#0071c2] text-white px-6 py-2 rounded-md hover:bg-[#005fa3]"
            >
              {isEditing ? "Cập nhật phòng" : "Thêm phòng"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                onClick={resetForm}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Bảng phòng */}
      <div className="bg-white border border-gray-200 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-[#003580] text-white">
            <tr>
              <th className="px-4 py-2">Tên phòng</th>
              <th className="px-4 py-2">Giường</th>
              <th className="px-4 py-2">Giá/ngày</th>
              <th className="px-4 py-2">Loại</th>
              <th className="px-4 py-2">Tiện nghi</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-slate-500" colSpan={7}>
                  Chưa có phòng nào.
                </td>
              </tr>
            )}
            {rooms.map((room) => {
              const amenStr = Array.isArray(room.amenities)
                ? room.amenities
                    .map((a) => amenityToName(a))
                    .filter((x) => !!x)
                    .slice(0, 3)
                    .join(", ")
                : "—";

              return (
                <tr key={room._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{room.name}</td>
                  <td className="px-4 py-2">{room.beds ?? "—"}</td>
                  <td className="px-4 py-2">
                    {Number(room.rentperday || 0).toLocaleString()}₫
                  </td>
                  <td className="px-4 py-2">{room.type || "—"}</td>
                  <td className="px-4 py-2 truncate">{amenStr || "—"}</td>
                  <td className="px-4 py-2 capitalize">
                    {room.availabilityStatus || "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleEdit(room)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded-md mr-2 hover:bg-yellow-500"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
