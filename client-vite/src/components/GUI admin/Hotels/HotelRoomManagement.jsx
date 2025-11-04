import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import { useParams } from "react-router-dom";

function HotelRoomManagement() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    maxcount: "",
    beds: "",
    baths: "",
    phonenumber: "",
    quantity: "",
    rentperday: "",
    type: "",
    description: "",
    availabilityStatus: "available",
    amenities: [],
    imageurls: [],
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
      const response = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
      setHotel(response.data.hotel);
      setRooms(response.data.rooms);
    } catch {
      setError("Lỗi khi lấy thông tin khách sạn hoặc danh sách phòng");
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await axiosInstance.get("/amenities");
      setAmenitiesList(res.data);
    } catch {
      setAmenitiesList([]);
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

  // 🔄 Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Toggle tiện nghi
  const handleAmenityToggle = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item],
    }));
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
      setError(err.response?.data?.message || "Lỗi khi lưu phòng ❌");
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa phòng này?")) {
      try {
        await axiosInstance.delete(`/rooms/${id}?hotelId=${hotelId}`);
        setSuccess("Xóa phòng thành công");
        fetchHotelAndRooms();
      } catch {
        setError("Lỗi khi xóa phòng");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-[#003580] mb-4">
        Quản Lý Phòng – {hotel ? `${hotel.name}` : "Đang tải..."}
      </h2>




      {/* 🏨 Hotel info */}
      {hotel && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
          <p><strong>Địa chỉ:</strong> {hotel.address}</p>
          <p><strong>Khu vực:</strong> {hotel.region?.name}</p>
        </div>
      )}

      {/* 🧾 Room Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Tên phòng", name: "name", type: "text" },
            { label: "Số người tối đa", name: "maxcount", type: "number" },
            { label: "Số giường", name: "beds", type: "number" },
            { label: "Số phòng tắm", name: "baths", type: "number" },
            { label: "Số lượng phòng", name: "quantity", type: "number" },
            { label: "Giá mỗi ngày (VNĐ)", name: "rentperday", type: "number" },
            { label: "Loại phòng", name: "type", type: "text" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-gray-700 font-medium mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#0071c2]"
                required
              />
            </div>
          ))}
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
        )}

        {success && (
          <div className="mt-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded animate-fade-in">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded animate-fade-in">
            {error}
          </div>
        )}
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
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: "",
                  maxcount: "",
                  beds: "",
                  baths: "",
                  quantity: "",
                  rentperday: "",
                  type: "",
                  description: "",
                  amenities: [],
                  availabilityStatus: "available",
                  imageurls: [],
                });
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* 📋 Rooms Table */}
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
            {rooms.map((room) => (
              <tr
                key={room._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-2 font-medium">{room.name}</td>
                <td className="px-4 py-2">{room.beds}</td>
                <td className="px-4 py-2">{room.rentperday.toLocaleString()}₫</td>
                <td className="px-4 py-2">{room.type}</td>
                <td className="px-4 py-2 truncate">
                  {room.amenities?.slice(0, 3).join(", ") || "—"}
                </td>
                <td className="px-4 py-2 capitalize">{room.availabilityStatus}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HotelRoomManagement;
