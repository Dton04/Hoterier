import React, { useEffect, useState } from "react";
import axios from "axios";
import {
   FiUsers,
   FiMessageCircle,
   FiClock,
   FiTrendingUp,
   FiMapPin,
   FiStar,
   FiMail,
   FiUser,
   FiChevronRight,
   FiSearch
} from "react-icons/fi";

export default function ChatHistoryAdmin() {
   const [users, setUsers] = useState([]);
   const [selected, setSelected] = useState(null);
   const [topHotels, setTopHotels] = useState([]);
   const [topRegions, setTopRegions] = useState([]);
   const [stats, setStats] = useState(null);

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      const u = await axios.get("/api/chat-history/all");
      const h = await axios.get("/api/chat-history/stats/hotels");
      const r = await axios.get("/api/chat-history/stats/regions");
      const s = await axios.get("/api/chat-history/stats/overview");

      setUsers(u.data);
      setTopHotels(h.data);
      setTopRegions(r.data);
      setStats(s.data);
   };

   const loadUserHistory = async (id) => {
      const { data } = await axios.get(`/api/chat-history/${id}`);
      setSelected(data);
   };

   return (
      <div className="p-6 space-y-6">

         {/* === THỐNG KÊ NHANH === */}
         {stats && (
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-white shadow rounded-xl p-5 border flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                     <FiUsers size={26} />
                  </div>
                  <div>
                     <p className="text-gray-500 text-sm">Tổng người dùng đã chat</p>
                     <h1 className="text-3xl font-bold">{stats.totalUsers}</h1>
                  </div>
               </div>

               <div className="bg-white shadow rounded-xl p-5 border flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full">
                     <FiMessageCircle size={26} />
                  </div>
                  <div>
                     <p className="text-gray-500 text-sm">Tổng số tin nhắn</p>
                     <h1 className="text-3xl font-bold">{stats.totalMessages}</h1>
                  </div>
               </div>

               <div className="bg-white shadow rounded-xl p-5 border flex items-center gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                     <FiClock size={26} />
                  </div>
                  <div>
                     <p className="text-gray-500 text-sm">Tin nhắn hôm nay</p>
                     <h1 className="text-3xl font-bold">{stats.todayMessages}</h1>
                  </div>
               </div>
            </div>
         )}

         {/* === TOP KHÁCH SẠN === */}
         <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center gap-2 mb-4">
               <FiTrendingUp size={20} className="text-blue-600" />
               <h2 className="text-xl font-semibold">Top khách sạn được tìm kiếm</h2>
            </div>

            <table className="w-full text-sm">
               <thead>
                  <tr className="border-b font-semibold text-gray-600">
                     <td className="py-2">Khách sạn</td>
                     <td>Địa chỉ</td>
                     <td className="text-center">Số sao</td>
                     <td className="text-center">Lượt xem</td>
                  </tr>
               </thead>
               <tbody>
                  {topHotels.map((h) => (
                     <tr key={h._id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-2">{h.name}</td>
                        <td>{h.address}</td>
                        <td className="text-center">
                           <span className="flex items-center justify-center gap-1 text-yellow-500">
                              <FiStar /> {h.starRating}
                           </span>
                        </td>
                        <td className="text-center font-semibold text-blue-600">{h.count}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* === TOP KHU VỰC === */}
         <div className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center gap-2 mb-4">
               <FiMapPin size={20} className="text-red-500" />
               <h2 className="text-xl font-semibold">Top khu vực được tìm kiếm</h2>
            </div>

            <ul className="space-y-2">
               {topRegions.map((r) => (
                  <li
                     key={r._id}
                     className="flex justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                     <span className="font-medium">{r._id}</span>
                     <span className="text-blue-600">{r.count} lượt</span>
                  </li>
               ))}
            </ul>
         </div>

         {/* === DANH SÁCH USER + CHAT DETAIL === */}
         <div className="flex gap-6">

            {/* USER LIST */}
            <div className="w-1/3 bg-white rounded-xl shadow p-4 border h-[620px] overflow-y-auto">
               <div className="flex items-center gap-2 mb-3">
                  <FiUser size={20} className="text-gray-600" />
                  <h2 className="text-lg font-semibold">Người dùng</h2>
               </div>

               {users.map((u) => (
                  <div
                     key={u._id}
                     className="p-3 border-b cursor-pointer hover:bg-gray-100 rounded flex justify-between items-center"
                     onClick={() => loadUserHistory(u.userId._id)}
                  >
                     <div>
                        <p className="font-medium">{u.userId.name}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                           <FiMail /> {u.userId.email}
                        </p>
                     </div>

                     <FiChevronRight className="text-gray-400" />
                  </div>
               ))}
            </div>

            {/* CHAT DETAIL */}
            <div className="w-2/3 bg-white rounded-xl shadow p-4 border h-[620px]">
               {!selected ? (
                  <p className="text-gray-500">Chọn người dùng để xem lịch sử...</p>
               ) : (
                  <>
                     <div className="flex items-center gap-2 mb-3">
                        <FiMessageCircle size={20} className="text-blue-600" />
                        <h2 className="text-xl font-semibold">
                           Lịch sử chat — {selected.userId?.name}
                        </h2>
                     </div>

                     <div className="h-[540px] overflow-y-auto space-y-3 p-3 bg-gray-50 rounded">
                        {selected.messages.map((m, i) => (
                           <div
                              key={i}
                              className={`p-3 rounded-xl max-w-[70%] shadow-sm ${m.sender === "user"
                                 ? "bg-blue-600 text-white ml-auto"
                                 : "bg-white border text-gray-800"
                                 }`}
                           >
                              <p className="leading-relaxed">{m.text}</p>
                              <p className="text-[10px] text-gray-300 mt-1">
                                 {new Date(m.timestamp).toLocaleString()}
                              </p>
                           </div>
                        ))}
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
