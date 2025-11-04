import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

function HotelRoomManagement() {
  const { hotelId } = useParams();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  const toAmenityName = (a) => (typeof a === "string" ? a : a?.name || "");

  const filteredAmenities = amenities.filter((a) =>
    toAmenityName(a).toLowerCase().includes(amenityQuery.toLowerCase())
  );

  const addAmenity = (name) => {
    const normalized = (name || "").trim();
    if (!normalized) return;
    setSelectedAmenities((prev) => {
      const has = prev.some(
        (a) => toAmenityName(a).toLowerCase() === normalized.toLowerCase()
      );
      return has ? prev : [...prev, normalized];
    });
    setAmenityQuery("");
    setShowAmenityDropdown(false);
  };

  const removeAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.filter((a) => toAmenityName(a) !== name)
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  const fetchHotelAndRooms = async () => {
    try {
      const response = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
      setHotel(response.data.hotel);
      setRooms(response.data.rooms);
    } catch {
      setError("Lỗi khi lấy thông tin khách sạn hoặc danh sách phòng");
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      const hotelRes = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
      setHotel(hotelRes.data.hotel);
      setRooms(hotelRes.data.rooms);

      // ⚙️ Lấy danh sách tiện ích
      const amenityRes = await axiosInstance.get("/amenities", config);
      setAmenities(Array.isArray(amenityRes.data) ? amenityRes.data : []);
      console.log("Amenities fetched:", amenityRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast.error("Không thể tải dữ liệu khách sạn hoặc tiện ích");
    }
  };

  fetchData();
}, [hotelId]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      amenities: [],
      imageurls: [],
    });
    setNewImages([]);
    setIsEditing(false);
    setEditId(null);
    setSelectedAmenities([]);
    setAmenityQuery("");
    setShowAmenityDropdown(false);
    if (document.getElementById("image-upload-room")) {
      document.getElementById("image-upload-room").value = null;
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
    const amenityNames = Array.isArray(room.amenities)
      ? room.amenities.map((a) => (typeof a === "string" ? a : a?.name)).filter(Boolean)
      : [];
    setSelectedAmenities(amenityNames);
    setIsEditing(true);
    setEditId(room._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      hotelId,
      amenities: selectedAmenities,
    };
    try {
      let roomId;
      if (isEditing) {
        await axiosInstance.patch(`/rooms/${editId}`, payload, config);
        roomId = editId;
        toast.success("Cập nhật phòng thành công!");
      } else {
        const { data } = await axiosInstance.post("/rooms", payload, config);
        roomId = data.room?._id;
        toast.success("Thêm phòng thành công!");
      }

      if (newImages.length > 0 && roomId) {
        const imageForm = new FormData();
        newImages.forEach((img) => imageForm.append("images", img));
        await axiosInstance.post(`/rooms/${roomId}/images`, imageForm, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        toast.success("Tải ảnh phòng lên thành công!");
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
        Quản Lý Phòng – {hotel ? hotel.name : "Đang tải..."}
      </h2>

      {hotel && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
          <p><strong>Địa chỉ:</strong> {hotel.address}</p>
          <p><strong>Khu vực:</strong> {hotel.region?.name}</p>
        </div>
      )}

      {/* Form thêm/sửa phòng */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 border border-gray-200 mb-8">
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

         <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-700">Trạng thái</label>
              <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="available">Có sẵn</option>
                <option value="maintenance">Bảo trì</option>
                <option value="busy">Đang sử dụng</option>
              </select>
            </div>

        {/* Tiện ích và ảnh */}
        <div className="mt-4">
          <label className="block mb-2 font-medium">Tiện ích</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedAmenities.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full text-sm text-blue-700">
                {a}
                <button type="button" onClick={() => removeAmenity(a)}>×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Tìm tiện ích..."
            value={amenityQuery}
            onChange={(e) => {
              setAmenityQuery(e.target.value);
              setShowAmenityDropdown(true);
            }}
            onFocus={() => setShowAmenityDropdown(true)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
          {showAmenityDropdown && (
            <div className="border rounded-md mt-1 bg-white max-h-40 overflow-auto">
              {filteredAmenities.length > 0 ? (
                filteredAmenities.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addAmenity(item.name)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">Không có tiện ích phù hợp</div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block mb-2 font-medium">Ảnh phòng</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} id="image-upload-room" />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" className="bg-[#0071c2] text-white px-6 py-2 rounded-md hover:bg-[#005fa3]">
            {isEditing ? "Cập nhật phòng" : "Thêm phòng"}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded-md">
              Hủy
            </button>
          )}
        </div>
      </form>

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
            {rooms.map((room) => (
              <tr key={room._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{room.name}</td>
                <td className="px-4 py-2">{room.beds}</td>
                <td className="px-4 py-2">{room.rentperday.toLocaleString()}₫</td>
                <td className="px-4 py-2">{room.type}</td>
                <td className="px-4 py-2">{room.amenities?.slice(0, 3).join(", ") || "—"}</td>
                <td className="px-4 py-2 capitalize">{room.availabilityStatus}</td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => handleEdit(room)} className="bg-yellow-400 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-500">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(room._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
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
