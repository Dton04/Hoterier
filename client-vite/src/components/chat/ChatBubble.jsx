import { useEffect, useState } from 'react';
import ChatWindow from './ChatWindow';
import { connectSocket, listConversations } from '../../utils/chatApi';
import AdminChatModal from '../GUI admin/Chats/AdminChatModal.jsx';

function decodeJwtId(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.id || payload?._id || null;
  } catch {
    return null;
  }
}

function decodeUserInfo() {
  try {
    const raw = localStorage.getItem('userInfo');
    const info = raw ? JSON.parse(raw) : {};
    const user = info?.user || info || {};
    return {
      token: user?.token || info?.token || '', // ƯU TIÊN token trong user
      userId: user?._id || info?._id || null,
      role: user?.role || info?.role || null,
    };
  } catch {
    return { token: '', userId: null, role: null };
  }
}

function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // Lưu ý: giữ nguyên cách bạn lấy token/userId (ví dụ decodeUserInfo nếu đã có sẵn)
  const { token, userId, role } = decodeUserInfo?.() || {};

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    setSocket(s);

    const onNew = (msg) => {
      if (!open) setUnread((u) => u + 1);
    };
    s.on('message:new', onNew);

    return () => {
      s.off('message:new', onNew);
      s.disconnect();
    };
  }, [token, open]);

  // Tham gia room cho phía user mỗi khi có socket + conversationId, và rejoin khi reconnect
  useEffect(() => {
    if (!socket || !conversationId) return;
    const rejoin = () => socket.emit('conversation:join', { conversationId });
    socket.on('connect', rejoin);
    rejoin();
    return () => socket.off('connect', rejoin);
  }, [socket, conversationId]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const list = await listConversations(token);
        if (list?.length) setConversationId(list[0]?._id);
      } catch {}
    })();
  }, [token]);

  const clearUnread = () => setUnread(0);
  const openChat = () => { setOpen(true); clearUnread(); };
  const closeChat = () => setOpen(false);

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 md:bottom-32 md:right-8 z-[9999]">
      {!open && (
        <button
          onClick={openChat}
          className="bg-[#0071c2] hover:bg-blue-700 w-16 h-16 rounded-full shadow-xl flex items-center justify-center relative active:scale-95"
          aria-label="Mở chat"
          title="Mở chat"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
            <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4V6z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        (role === 'admin' || role === 'staff') ? (
          <AdminChatModal
            token={token}
            userId={userId}
            socket={socket}
            onClose={closeChat}
          />
        ) : conversationId ? (
          <ChatWindow
            token={token}
            userId={userId}
            socket={socket}
            conversationId={conversationId}
            onClose={closeChat}
            clearUnread={clearUnread}
            embedded={false}
          />
        ) : (
          <div className="bg-white w-80 sm:w-96 h-[520px] shadow-2xl rounded-xl flex flex-col border border-gray-200">
            <div className="bg-[#003580] text-white font-semibold p-3 rounded-t-xl flex justify-between items-center">
              <span>💬 Hỗ trợ khách hàng</span>
              <button onClick={closeChat} className="text-black hover:text-red-300 text-lg">✕</button>
            </div>
            <div className="flex-1 flex items-center justify-center text-sm text-gray-600">
              Đang khởi tạo cuộc trò chuyện…
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default ChatBubble;