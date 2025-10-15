import React, { useState, useEffect } from "react";
import axiosInstance from "./axiosInstance";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🟢 Fetch data
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

  const handleEdit = async (room) => {
    try {
      const roomRes = await axiosInstance.post("/rooms/getroombyid", { roomid: room._id });
      const imgRes = await axiosInstance.get(`/rooms/images/${room._id}`);

      setFormData({
        ...roomRes.data,
        imageurls: imgRes.data.images || [],
        amenities: roomRes.data.amenities || [],
      });
      setIsEditing(true);
      setEditId(room._id);
      setNewImages([]);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lấy thông tin phòng");
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm("Xóa ảnh này?")) return;
    try {
      const imgId = imageUrl.split("/").pop();
      await axiosInstance.delete(`/rooms/${editId}/images/${imgId}`);
      setFormData({
        ...formData,
        imageurls: formData.imageurls.filter((url) => url !== imageUrl),
      });
      setSuccess("Xóa ảnh thành công");
    } catch {
      setError("Lỗi khi xóa ảnh");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = { ...formData, hotelId };
      let savedRoom;

      if (isEditing) {
        const res = await axiosInstance.patch(`/rooms/${editId}`, payload);
        savedRoom = res.data.room;
        setSuccess("Cập nhật phòng thành công !");
      } else {
        const res = await axiosInstance.post("/rooms", payload);
        savedRoom = res.data.room;
        setSuccess("Thêm phòng thành công !");
      }

      // Upload ảnh mới
      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach((img) => formDataImages.append("images", img));
        await axiosInstance.post(`/rooms/${savedRoom._id}/images`, formDataImages, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Reset form
      setFormData({
        name: "",
        maxcount: "",
        beds: "",
        baths: "",
        phonenumber: "",
        quantity: "",
        rentperday: "",
        type: "",
        description: "",
        amenities: [],
        availabilityStatus: "available",
        imageurls: [],
      });
      setIsEditing(false);
      setEditId(null);
      setNewImages([]);
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

        {/* 📋 Description */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-1">Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#0071c2]"
            rows="3"
          ></textarea>
        </div>

        {/* 🛋️ Tiện nghi */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-2">Tiện nghi phòng</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {amenitiesList.map((item) => (
              <label key={item} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(item)}
                  onChange={() => handleAmenityToggle(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 📷 Image Upload */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium mb-1">Ảnh phòng</label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={(e) => setNewImages(Array.from(e.target.files))}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>

        {/* Hiện ảnh cũ */}
        {isEditing && formData.imageurls.length > 0 && (
          <div className="mt-4">
            <label className="block text-gray-700 font-medium mb-1">Ảnh hiện tại</label>
            <div className="flex flex-wrap gap-3">
              {formData.imageurls.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`Room ${i}`}
                    className="w-28 h-20 object-cover rounded-lg shadow"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(url)}
                    className="absolute top-0 right-0 bg-red-600 text-white px-2 rounded-bl-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
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
