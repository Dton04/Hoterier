import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listConversations, connectSocket } from '../../utils/chatApi';
import ChatWindow from '../chat/ChatWindow';
import { FiMessageSquare, FiUser, FiMapPin, FiClock } from 'react-icons/fi';

export default function StaffChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = userInfo?.token;
  const userObj = userInfo?.user || userInfo;
  const userId = userObj?._id;

  useEffect(() => {
     if (!token) {
        navigate('/login');
        return;
     }
     const s = connectSocket(token);
     setSocket(s);
     return () => s.disconnect();
  }, [token, navigate]);

  useEffect(() => {
     if (!token) return;
     listConversations(token).then(data => {
         setConversations(data);
     }).catch(console.error);
  }, [token]);

  useEffect(() => {
     const idFromUrl = searchParams.get('conversationId');
     if (idFromUrl) {
        setSelectedId(idFromUrl);
        if (socket) {
            socket.emit('conversation:join', { conversationId: idFromUrl });
        }
     }
  }, [searchParams, socket]);

  const handleSelect = (id) => {
     setSelectedId(id);
     navigate(`/staff/chat?conversationId=${id}`);
  };

  const selectedConversation = conversations.find(c => c._id === selectedId);
  const selectedUser = selectedConversation?.participants.find(p => p.user._id !== userId)?.user;
  const selectedHotel = selectedConversation?.hotelId;

  return (
    <div className="h-[85vh] flex flex-col bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiMessageSquare /> Quản lý tin nhắn
          </h1>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden flex border border-gray-200">
            {/* Sidebar List */}
            <div className="w-1/4 min-w-[250px] max-w-[300px] border-r bg-white flex flex-col">
                <div className="p-4 border-b">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm..." 
                        className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            Hộp thư trống.
                        </div>
                    ) : (
                        conversations.map(c => {
                            const other = c.participants.find(p => p.user && p.user._id !== userId)?.user;
                            const hotel = c.hotelId;
                            const isActive = selectedId === c._id;
                            
                            return (
                                <div 
                                    key={c._id}
                                    onClick={() => handleSelect(c._id)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition flex flex-col gap-1 ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <p className="font-bold text-gray-900 truncate text-base">{other?.name || "Khách hàng"}</p>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(c.updatedAt).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                                        </span>
                                    </div>
                                    {hotel && (
                                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                            <FiMapPin size={10}/> {hotel.name}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 relative">
                {selectedId ? (
                    <ChatWindow 
                        token={token}
                        userId={userId}
                        socket={socket}
                        conversationId={selectedId}
                        embedded={true}
                        customHeader={
                            <div className="px-6 py-4 border-b bg-white flex items-center justify-between shadow-sm z-10">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-800">{selectedUser?.name || "Khách hàng"}</h3>
                                    <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                                </div>
                                {selectedHotel && (
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs text-gray-400 uppercase font-semibold">Khách sạn quan tâm</p>
                                        <p className="text-base font-medium text-blue-700">{selectedHotel.name}</p>
                                    </div>
                                )}
                            </div>
                        }
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-6">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <FiMessageSquare size={48} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-medium text-gray-600">Chào mừng trở lại!</p>
                            <p className="text-base mt-2">Chọn một cuộc hội thoại từ danh sách để bắt đầu phản hồi khách hàng.</p>
                        </div>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
}
