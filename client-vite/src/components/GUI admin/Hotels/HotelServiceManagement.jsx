import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { PlusCircle, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { iconForAmenity } from "../../../utils/amenityIcons";

const Pagination = ({ total, current, onChange, pageSize }) => {
   const totalPages = Math.ceil(total / pageSize);
   if (totalPages <= 1) return null;
   return (
      <div className="flex justify-center items-center gap-2 mt-4">
         <button
            onClick={() => onChange(Math.max(1, current - 1))}
            disabled={current === 1}
            className="p-2 border rounded-md text-[#0071c2] disabled:opacity-50"
         >
            <ChevronLeft className="w-4 h-4" />
         </button>
         {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
               key={p}
               onClick={() => onChange(p)}
               className={`px-3 py-1 rounded-md text-sm transition-colors ${p === current
                     ? "bg-[#0071c2] text-white font-bold"
                     : "border border-[#0071c2] text-[#0071c2] hover:bg-blue-50"
                  }`}
            >
               {p}
            </button>
         ))}
         <button
            onClick={() => onChange(Math.min(totalPages, current + 1))}
            disabled={current === totalPages}
            className="p-2 border rounded-md text-[#0071c2] disabled:opacity-50"
         >
            <ChevronRight className="w-4 h-4" />
         </button>
      </div>
   );
};

export default function HotelServiceManagement() {
   const [services, setServices] = useState([]);
   const [hotels, setHotels] = useState([]);
   const [form, setForm] = useState({
      name: "",
      description: "",
      price: 0,
      icon: "",
      hotelId: "",
   });
   const [query, setQuery] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [editing, setEditing] = useState(null);
   const pageSize = 6;

   const userInfo = JSON.parse(localStorage.getItem("userInfo"));
   const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

   useEffect(() => {
      fetchServices();
      fetchHotels();
   }, []);

   const fetchHotels = async () => {
      try {
         const { data } = await axios.get("/api/hotels");
         setHotels(data);
      } catch {
         toast.error("Không thể tải danh sách khách sạn.");
      }
   };

   const fetchServices = async () => {
      try {
         const { data } = await axios.get("/api/services?global=true", config);
         setServices(Array.isArray(data) ? data : []);
      } catch {
         toast.error("Không thể tải danh sách dịch vụ mẫu.");
      }
   };

   const handleAdd = async () => {
      if (!form.name.trim()) return toast.warn("Vui lòng nhập tên dịch vụ.");

      try {
         if (editing) {
            await axios.put(`/api/services/${editing}`, form, config);
            toast.success("Cập nhật dịch vụ mẫu thành công!");
         } else {
            await axios.post("/api/services", { ...form, hotelId: null }, config);
            toast.success("Thêm dịch vụ mẫu thành công!");
         }
         setForm({ name: "", description: "", price: 0, icon: "" });
         setEditing(null);
         fetchServices();
      } catch (err) {
         toast.error(err.response?.data?.message || "Lỗi khi lưu dịch vụ mẫu.");
      }
   };

   const handleDelete = async (id) => {
      if (!window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) return;
      try {
         await axios.delete(`/api/services/${id}`, config);
         setServices((prev) => prev.filter((s) => s._id !== id));
         toast.success("Đã xóa dịch vụ thành công");
      } catch {
         toast.error("Lỗi khi xóa dịch vụ");
      }
   };

   const handleEdit = (service) => {
      setEditing(service._id);
      setForm({
         name: service.name,
         description: service.description,
         price: service.price || 0,
         icon: service.icon || "",
         hotelId: service.hotelId?._id || "",
      });
      window.scrollTo(0, 0);
   };

   const filtered = useMemo(() => {
      return services.filter((s) => s.name?.toLowerCase().includes(query.toLowerCase()));
   }, [services, query]);

   const paginated = useMemo(() => {
      const start = (currentPage - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
   }, [filtered, currentPage]);

   return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10 border border-gray-200">
         <h1 className="text-3xl font-bold text-[#003580] mb-6 border-b pb-3">
            Quản lý Dịch vụ Khách sạn
         </h1>

         {/* Form thêm/sửa */}
         <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-[#003580] flex items-center mb-3">
               <PlusCircle className="w-5 h-5 mr-2" /> {editing ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
               <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tên dịch vụ (VD: Spa, Gym...)"
                  className="border rounded-lg px-3 py-2 w-full"
               />
               <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả (tùy chọn)"
                  className="border rounded-lg px-3 py-2 w-full"
               />
               <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Giá (VNĐ)"
                  className="border rounded-lg px-3 py-2 w-full"
               />
               <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="Tên icon Lucide (VD: Car)"
                  className="border rounded-lg px-3 py-2 w-full"
               />
               <select
                  value={form.hotelId}
                  onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-full"
               >
                  <option value="">Dịch vụ chung</option>
                  {hotels.map((hotel) => (
                     <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                     </option>
                  ))}
               </select>
            </div>
            <button
               onClick={handleAdd}
               className="mt-4 bg-[#003580] text-white px-6 py-2 rounded-lg hover:bg-[#002b66] transition"
            >
               {editing ? "Cập nhật" : "Thêm Dịch vụ"}
            </button>
            {editing && (
               <button
                  onClick={() => {
                     setEditing(null);
                     setForm({ name: "", description: "", price: 0, icon: "", hotelId: "" });
                  }}
                  className="ml-3 text-gray-600 hover:text-red-600"
               >
                  Hủy chỉnh sửa
               </button>
            )}
         </div>

         {/* Thanh tìm kiếm */}
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
               Danh sách dịch vụ ({filtered.length})
            </h3>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                     setQuery(e.target.value);
                     setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên..."
                  className="pl-9 border rounded-lg px-3 py-2 text-sm"
               />
            </div>
         </div>

         {/* Table */}
         <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
               <thead className="bg-gray-100 border-b">
                  <tr>
                     <th className="text-left px-4 py-2 font-semibold text-gray-700">Tên dịch vụ</th>
                     <th className="text-left px-4 py-2 font-semibold text-gray-700">Khách sạn</th>
                     <th className="text-left px-4 py-2 font-semibold text-gray-700">Giá (VNĐ)</th>
                     <th className="text-left px-4 py-2 font-semibold text-gray-700">Trạng thái</th>
                     <th className="text-right px-4 py-2 font-semibold text-gray-700">Thao tác</th>
                  </tr>
               </thead>
               <tbody>
                  {paginated.length > 0 ? (
                     paginated.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50 border-b">
                           <td className="px-4 py-2 flex items-center gap-2">
                              <span className="w-5 h-5">{iconForAmenity(s.name)}</span>
                              <span>{s.name}</span>
                           </td>
                           <td className="px-4 py-2 text-gray-700">
                              {s.hotelId?.name || <span className="text-gray-400 italic">Chung</span>}
                           </td>
                           <td className="px-4 py-2 text-gray-700">
                              {s.isFree ? "Miễn phí" : `${Number(s.price || 0).toLocaleString("vi-VN")} ₫`}
                           </td>
                           <td className="px-4 py-2">
                              <span
                                 className={`px-3 py-1 rounded-full text-xs font-semibold ${s.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}
                              >
                                 {s.isAvailable ? "Hoạt động" : "Tạm ngưng"}
                              </span>
                           </td>
                           <td className="px-4 py-2 text-right">
                              <button
                                 onClick={() => handleEdit(s)}
                                 className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                              >
                                 <Edit className="w-5 h-5" />
                              </button>
                              <button
                                 onClick={() => handleDelete(s._id)}
                                 className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-500">
                           Không có dịch vụ nào
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         <Pagination
            total={filtered.length}
            current={currentPage}
            onChange={setCurrentPage}
            pageSize={pageSize}
         />
      </div>
   );
}
