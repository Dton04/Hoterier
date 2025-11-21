import { useEffect, useState, lazy, Suspense } from "react";
import ChatWindow from "./ChatWindow";
import ChatBot from "../chatbot/ChatBot";
import botAvatar from "../../assets/images/chatbot.png"
import {
   connectSocket,
   listConversations,
   createConversation,
   joinConversation
} from "../../utils/chatApi";

const LazyAdminChatModal = lazy(() =>
   import("../GUI admin/Chats/AdminChatModal.jsx")
);

function decodeUserInfo() {
   try {
      const raw = localStorage.getItem("userInfo");
      const info = raw ? JSON.parse(raw) : {};
      const user = info?.user || info || {};

      return {
         token: user?.token || info?.token || "",
         userId: user?._id || info?._id || null,
         role: user?.role || info?.role || null
      };
   } catch {
      return { token: "", userId: null, role: null };
   }
}

export default function UnifiedChat() {
   const { token, userId, role } = decodeUserInfo();

   const [socket, setSocket] = useState(null);
   const [conversationId, setConversationId] = useState(null);

   const [open, setOpen] = useState(false);
   const [tab, setTab] = useState("bot"); // bot | realtime
   const [unread, setUnread] = useState(0);

   const defaultAdminId =
      localStorage.getItem("defaultAdminId") ||
      (import.meta.env?.VITE_DEFAULT_ADMIN_ID ?? null);

   // --- SOCKET INIT ---
   useEffect(() => {
      if (!token) return;

      const s = connectSocket(token);
      setSocket(s);

      // Increase unread
      s.on("message:new", () => {
         if (!open) setUnread((u) => u + 1);
      });

      return () => s.disconnect();
   }, [token, open]);

   // --- GET OR CREATE CONVERSATION ---
   useEffect(() => {
      if (!token) return;

      (async () => {
         try {
            const list = await listConversations(token);
            if (list?.length) {
               setConversationId(list[0]._id);
            }
         } catch { }
      })();
   }, [token]);

   async function ensureConversation() {
      if (conversationId) return conversationId;
      if (role !== "user") return null;

      if (!defaultAdminId) {
         alert("Chưa cấu hình admin hỗ trợ!");
         return null;
      }

      try {
         const conv = await createConversation(defaultAdminId, token);
         const id = conv?._id ?? conv?.id;
         if (!id) return null;

         setConversationId(id);
         socket?.emit("conversation:join", { conversationId: id });
         await joinConversation(id, token);

         return id;
      } catch {
         return null;
      }
   }

   // --- When opening chat ---
   const handleOpen = async () => {
      setUnread(0);

      if (role === "user") {
         const ok = await ensureConversation();
         if (!ok) return;
      }

      setOpen(true);
   };

   // Auto set real time tab for admin/staff
   useEffect(() => {
      if (role === "admin" || role === "staff") {
         setTab("realtime");
      }
   }, [role]);

   return (
      <div className="fixed bottom-6 right-6 z-[9999]">

         {/* Single Chat Icon */}
         {!open && (
            <button
               onClick={handleOpen}
               className="w-16 h-16 rounded-full bg-[#0071c2] hover:bg-blue-700 shadow-xl flex items-center justify-center relative"
            >
               <img
                  src={botAvatar}
                  alt="Chatbot"
                  className="w-8 h-8 object-cover animate-bounce rounded-full"
               />

               {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full px-2 text-xs">
                     {unread}
                  </span>
               )}
            </button>
         )}


         {/* Popup */}
         {open && (
            <div className="w-[360px] h-[520px] bg-white shadow-2xl rounded-xl flex flex-col border">
               {/* Header */}
               <div className="p-2 bg-[#003580] text-white flex justify-between items-center rounded-t-xl">
                  <span className="font-semibold ml-2">
                     {role === "admin" || role === "staff"
                        ? "Chat với khách"
                        : "Trung tâm hỗ trợ"}
                  </span>

                  <button onClick={() => setOpen(false)} className="bg-[#003560]">✕</button>
               </div>

               {/* Tabs for USER ONLY */}
               {role !== "admin" && role !== "staff" && (
                  <div className="flex border-b">
                     <button
                        onClick={() => setTab("bot")}
                        className={`flex-1 py-2 font-semibold ${tab === "bot"
                              ? "border-b-2 border-blue-600 text-blue-600"
                              : "text-gray-500"
                           }`}
                     >
                        Trợ lý Hotelier
                     </button>

                     <button
                        onClick={() => setTab("realtime")}
                        className={`flex-1 py-2 font-semibold ${tab === "realtime"
                              ? "border-b-2 border-blue-600 text-blue-600"
                              : "text-gray-500"
                           }`}
                     >
                        Hỗ trợ khách hàng
                     </button>
                  </div>
               )}

               {/* CONTENT */}
               <div className="flex-1 overflow-hidden">
                  {role === "admin" || role === "staff" ? (
                     <Suspense fallback={null}>
                        <LazyAdminChatModal
                           token={token}
                           userId={userId}
                           socket={socket}
                           onClose={() => setOpen(false)}
                        />
                     </Suspense>
                  ) : tab === "bot" ? (
                     <ChatBot embedded />
                  ) : (
                     <ChatWindow
                        token={token}
                        userId={userId}
                        socket={socket}
                        conversationId={conversationId}
                        clearUnread={() => setUnread(0)}
                        embedded={true}
                     />
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
