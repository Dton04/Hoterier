import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listConversations, connectSocket } from '../../utils/chatApi';
import ChatWindow from '../chat/ChatWindow';
import { FiMessageSquare, FiUser, FiMapPin } from 'react-icons/fi';

export default function UserChatPage() {
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
     
     // Listen for new messages to update last message snippet (optional enhancement)
     
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
     navigate(`/chat?conversationId=${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-10">
      <div className="max-w-6xl mx-auto px-4 h-[85vh]">
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden flex h-full">
            {/* Sidebar */}
            <div className="w-1/3 border-r flex flex-col">
                <div className="p-4 border-b bg-blue-50">
                    <h2 className="font-semibold text-lg text-blue-800 flex items-center gap-2">
                        <FiMessageSquare /> Tin nhắn của bạn
                    </h2>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Chưa có cuộc trò chuyện nào.
                        </div>
                    ) : (
                        conversations.map(c => {
                            // Determine name/avatar to show
                            const isStaff = userInfo?.user?.role === 'staff';
                            const other = c.participants.find(p => p.user && p.user._id !== userId)?.user;
                            const hotel = c.hotelId;
                            
                            let displayName, displayImg;

                            if (isStaff) {
                                // Staff sees User (and maybe which hotel they are asking about)
                                displayName = other?.name || "Khách hàng";
                                displayImg = other?.avatar || "https://via.placeholder.com/40";
                                if (hotel) displayName += ` (${hotel.name})`; 
                            } else {
                                // User sees Hotel (if linked) or Staff
                                if (hotel) {
                                    displayName = hotel.name;
                                    displayImg = hotel.imageurls?.[0];
                                } else {
                                    displayName = other?.name || "Hỗ trợ";
                                    displayImg = other?.avatar;
                                }
                            }
                            
                            displayImg = displayImg || "https://via.placeholder.com/40";
                            const isActive = selectedId === c._id;

                            return (
                                <div 
                                    key={c._id}
                                    onClick={() => handleSelect(c._id)}
                                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition flex items-center gap-3 ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <img src={displayImg} alt="avt" className="w-12 h-12 rounded-full object-cover border" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{displayName}</p>
                                        {!isStaff && hotel && <p className="text-xs text-gray-500 flex items-center gap-1"><FiMapPin size={10}/> Chat với khách sạn</p>}
                                        {isStaff && hotel && <p className="text-xs text-gray-500 flex items-center gap-1"><FiMapPin size={10}/> {hotel.name}</p>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 relative">
                {selectedId ? (
                    <ChatWindow 
                        token={token}
                        userId={userId}
                        socket={socket}
                        conversationId={selectedId}
                        embedded={true}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
                        <FiMessageSquare size={48} />
                        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
