import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [query, setQuery] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

  const fetchAmenities = async () => {
    try {
      const { data } = await axios.get("/api/amenities", config);
      setAmenities(Array.isArray(data) ? data : []);
    } catch {
      setAmenities([]);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const existingNames = amenities.map(a => (typeof a === "string" ? a : a.name));

  const handleAdd = async () => {
    const name = form.name?.trim();
    if (!name) return;

    // Chặn trùng tên tiện ích (không phân biệt hoa thường)
    if (existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
      alert("Tiện ích đã tồn tại");
      return;
    }

    try {
      const { data } = await axios.post(
        "/api/amenities",
        { name, description: form.description || "", icon: form.icon || "" },
        config
      );
      setAmenities((prev) => [...prev, data.amenity]);
      setForm({ name: "", description: "", icon: "" });
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi tạo tiện ích");
    }
  };

  const filtered = amenities.filter((a) => {
    const name = typeof a === "string" ? a : a.name;
    return name?.toLowerCase().includes(query.toLowerCase());
  });

  const handleDelete = async (amenityId) => {
    try {
      await axios.delete(`/api/amenities/${amenityId}`, config);
      setAmenities((prev) => prev.filter((a) => a._id !== amenityId));
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa tiện ích");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-[#003580] mt-20">Quản lý tiện nghi phòng</h2>

      {/* Form thêm tiện ích mới */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium">Tên tiện ích</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ví dụ: WiFi miễn phí"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">Icon (tùy chọn)</label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Ví dụ: fa-wifi"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">Mô tả (tùy chọn)</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn gọn"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={handleAdd}
            className="bg-[#0071c2] text-white px-4 py-2 rounded-md"
          >
            Thêm tiện ích
          </button>
        </div>
      </div>

      {/* Tìm kiếm + danh sách tiện ích */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Danh sách tiện ích</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên…"
          className="w-64 border rounded-md px-3 py-2"
        />
      </div>

      <ul className="divide-y divide-gray-200">
        {filtered.map((item, i) => {
          const name = typeof item === "string" ? item : item.name;
          const icon = typeof item === "string" ? "" : item.icon || "";
          const desc = typeof item === "string" ? "" : item.description || "";
          return (
            <li key={item._id || i} className="flex justify-between items-center py-2">
              <div>
                <div className="font-medium">{name}</div>
                {(desc || icon) && (
                  <div className="text-sm text-gray-500">
                    {desc ? `Mô tả: ${desc}` : ""} {icon ? `(Icon: ${icon})` : ""}
                  </div>
                )}
              </div>
              {item._id && (
                <button
                  onClick={() => handleDelete(item._id)}
                  className="text-red-500 hover:underline"
                >
                  Xóa
                </button>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-3 text-sm text-gray-500">Không có tiện ích phù hợp</li>
        )}
      </ul>
    </div>
  );
}

export default AdminAmenities;
