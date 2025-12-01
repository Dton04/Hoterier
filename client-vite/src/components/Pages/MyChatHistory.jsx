import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiMessageCircle, FiClock, FiUser, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function getUserId() {
   try {
      const saved = localStorage.getItem("userInfo");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed?.user?._id || parsed?._id || null;
   } catch {
      return null;
   }
}

export default function MyChatHistory() {
   const [history, setHistory] = useState(null);
   const navigate = useNavigate();

   useEffect(() => {
      const id = getUserId();
      if (!id) return;

      axios.get(`/api/chat-history/${id}`).then((res) => setHistory(res.data));
   }, []);

   if (!history) {
      return (
         <div className="p-6 text-center text-gray-500">
            Chưa có lịch sử chat với trợ lý Hotelier.
         </div>
      );
   }

   return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">

         {/* HEADER */}
         <div className="flex items-center gap-3 mb-4">
            <button
               onClick={() => navigate(-1)}
               className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
               <FiArrowLeft size={20} />
            </button>

            <FiMessageCircle size={28} className="text-blue-600" />
            <h1 className="text-2xl font-semibold">Lịch sử ChatBot</h1>
         </div>

         {/* USER INFO */}
         <div className="bg-white rounded-xl shadow p-4 border flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
               <FiUser size={20} />
            </div>
            <div>
               <p className="font-medium text-lg">{history.userId?.name}</p>
               <p className="text-gray-500 text-sm">{history.userId?.email}</p>
            </div>
         </div>

         {/* CHAT HISTORY */}
         <div className="bg-white shadow rounded-xl border p-4 h-[600px] overflow-y-auto">
            {history.messages.length === 0 ? (
               <p className="text-gray-500 text-center">Bạn chưa gửi tin nhắn nào.</p>
            ) : (
               <div className="space-y-3">
                  {history.messages.map((m, i) => (
                     <div
                        key={i}
                        className={`max-w-[70%] px-4 py-3 rounded-xl shadow-sm relative ${m.sender === "user"
                              ? "bg-blue-600 text-white ml-auto"
                              : "bg-gray-100 text-gray-800"
                           }`}
                     >
                        <p className="leading-relaxed text-[14px]">{m.text}</p>
                        <span className="absolute text-[10px] text-gray-400 bottom-1 right-3 flex items-center gap-1">
                           <FiClock /> {new Date(m.timestamp).toLocaleString()}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
