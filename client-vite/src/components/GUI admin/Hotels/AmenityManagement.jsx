import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
// Import các icon cần thiết từ lucide-react
import {
  Wifi,
  SquareParking,
  Dumbbell,
  Soup,
  BedDouble,
  ShowerHead,
  Tv,
  Trash2,
  Edit,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Waves, // Thay thế cho Pool
  Aperture, // Icon mặc định
} from "lucide-react";

// Ánh xạ tên tiện ích (không phân biệt hoa thường) với icon Lucide
const amenityIconMap = {
  "wifi": Wifi,
  "internet": Wifi,
  "đỗ xe": SquareParking,
  "bãi đỗ xe": SquareParking,
  "parking": SquareParking,
  "gym": Dumbbell,
  "phòng tập": Dumbbell,
  "ăn sáng": Soup,
  "bữa sáng": Soup,
  "giường": BedDouble,
  "hồ bơi": Waves,
  "bể bơi": Waves,
  "pool": Waves,
  "máy lạnh": Sun, // Điều hòa
  "điều hòa": Sun,
  "phòng tắm": ShowerHead,
  "shower": ShowerHead,
  "tv": Tv,
  "truyền hình": Tv,
  "delete": Trash2,
  "edit": Edit,
  "add": PlusCircle
};

// Hàm lấy icon từ map, nếu không có sẽ trả về Aperture
const getLucideIcon = (name) => {
  const normalizedName = name?.toLowerCase().replace(/\s/g, "") || "";
  const IconComponent = amenityIconMap[normalizedName] || Aperture;
  return IconComponent;
};

// Component Pagination
const Pagination = ({ total, current, onChange, pageSize }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 my-4">
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        className="p-2 border rounded-md text-[#0071c2] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            page === current
              ? "bg-[#0071c2] text-white font-bold"
              : "bg-white text-[#0071c2] border border-[#0071c2] hover:bg-blue-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, current + 1))}
        disabled={current === totalPages}
        className="p-2 border rounded-md text-[#0071c2] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Số lượng tiện ích trên mỗi trang

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

  const existingNames = useMemo(() => amenities.map(a => (typeof a === "string" ? a : a.name)), [amenities]);

  const handleAdd = async () => {
    const name = form.name?.trim();
    if (!name) return;

    // Chặn trùng tên tiện ích (không phân biệt hoa thường)
    if (existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
      alert("Tiện ích đã tồn tại");
      return;
    }

    try {
      // Tự động gán icon nếu người dùng không nhập
      const autoIconName = form.icon || getLucideIcon(name).displayName || 'Aperture';

      const { data } = await axios.post(
        "/api/amenities",
        { 
          name, 
          description: form.description || "", 
          icon: autoIconName
        },
        config
      );
      setAmenities((prev) => [...prev, data.amenity]);
      setForm({ name: "", description: "", icon: "" });
      setCurrentPage(1); // Quay về trang đầu sau khi thêm
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi tạo tiện ích");
    }
  };

  const filteredAmenities = useMemo(() => {
    return amenities.filter((a) => {
      const name = typeof a === "string" ? a : a.name;
      return name?.toLowerCase().includes(query.toLowerCase());
    });
  }, [amenities, query]);

  // Logic phân trang cho danh sách đã lọc
  const paginatedAmenities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAmenities.slice(start, end);
  }, [filteredAmenities, currentPage, pageSize]);

  // Xử lý khi xóa
  const handleDelete = async (amenityId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tiện ích này?")) return;
    try {
      await axios.delete(`/api/amenities/${amenityId}`, config);
      setAmenities((prev) => {
        const newAmenities = prev.filter((a) => a._id !== amenityId);
        // Đảm bảo trang hiện tại hợp lệ sau khi xóa
        const newTotalPages = Math.ceil(newAmenities.length / pageSize);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newAmenities.length === 0) {
          setCurrentPage(1);
        }
        return newAmenities;
      });
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa tiện ích");
    }
  };
  
  // Placeholder cho chức năng chỉnh sửa
  const handleEdit = (item) => {
    alert(`Chức năng chỉnh sửa tiện ích: ${item.name} sẽ được phát triển.`);
    // Logic chỉnh sửa (ví dụ: mở modal hoặc form inline) sẽ được đặt ở đây.
  };
  
  // Icon Component cho item danh sách
  const AmenityIcon = ({ iconName, ...props }) => {
    const IconComponent = amenityIconMap[iconName?.toLowerCase()] || Aperture;
    return <IconComponent {...props} />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-2xl mt-10 mb-10 border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-6 text-[#003580] border-b pb-4">
        Quản lý Tiện nghi Phòng 
      </h2>

      {/* Form thêm tiện ích mới - Thiết kế chuyên nghiệp hơn */}
      <div className="p-4 mb-6 border border-[#0071c2] rounded-lg bg-blue-50">
        <h3 className="text-xl font-semibold mb-3 text-[#0071c2] flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" /> Thêm Tiện ích Mới
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tên tiện ích (Bắt buộc)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0071c2] focus:border-transparent transition"
          />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn gọn (Tùy chọn)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0071c2] focus:border-transparent transition"
          />
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="Icon Lucide (Ví dụ: wifi). Nếu trống sẽ tự động điền"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#0071c2] focus:border-transparent transition"
          />
        </div>
        <div className="mt-4">
          <button
            onClick={handleAdd}
            className="bg-[#0071c2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#005f9c] transition duration-300 shadow-md"
          >
            Thêm Tiện ích
          </button>
        </div>
      </div>

      {/* Tìm kiếm + danh sách tiện ích */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700 mb-2 md:mb-0">
          Danh sách Tiện ích Hiện có ({filteredAmenities.length})
        </h3>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
            }}
            placeholder="Tìm theo tên tiện ích..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-1 focus:ring-gray-500 transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <ul className="divide-y divide-gray-200 border rounded-lg">
          {paginatedAmenities.map((item, i) => {
            const name = typeof item === "string" ? item : item.name;
            const desc = typeof item === "string" ? "" : item.description || "";
            const iconName = (typeof item === "string" ? "" : item.icon) || name;
            const IconComponent = getLucideIcon(iconName);
            
            return (
              <li key={item._id || i} className="flex justify-between items-center p-4 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center space-x-4">
                  <IconComponent className="w-6 h-6 text-[#0071c2] flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-800 text-base">{name}</div>
                    {(desc) && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{desc}</div>
                    )}
                  </div>
                </div>
                
                {item._id && (
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-gray-600 p-2 rounded-full hover:bg-yellow-100 hover:text-yellow-600 transition"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-gray-600 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {paginatedAmenities.length === 0 && (
            <li className="py-8 text-center text-gray-500 text-lg">Không có tiện ích phù hợp</li>
          )}
        </ul>
      </div>

      {/* Component Phân trang */}
      <Pagination
        total={filteredAmenities.length}
        current={currentPage}
        onChange={setCurrentPage}
        pageSize={pageSize}
      />
    </div>
  );
}

export default AdminAmenities;