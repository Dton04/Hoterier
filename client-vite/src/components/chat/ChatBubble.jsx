import { useEffect, useMemo, useState } from 'react';
import ChatWindow from './ChatWindow';
import AdminChatModal from '../GUI admin/Chats/AdminChatModal';
import { connectSocket, listConversations } from '../../utils/chatApi';

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
      token: info?.token || localStorage.getItem('token') || '',
      userId: user?._id || null,
      role: user?.role || null,
    };
  } catch {
    return { token: '', userId: null, role: null };
  }
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const userId = useMemo(() => decodeJwtId(token), [token]);

  // Lấy role để quyết định hiển thị AdminChatModal
  const userRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('userInfo');
      const info = raw ? JSON.parse(raw) : {};
      const user = info?.user || info || {};
      if (user?.role) return user.role;
      if (info?.isAdmin || user?.isAdmin) return 'admin';
      return null;
    } catch {
      return null;
    }
  }, []);
  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    setSocket(s);

    s.on('connect', () => {
      // có thể join phòng hội thoại nếu có conversationId
      if (conversationId) s.emit('join', { conversationId });
    });
    s.on('message:new', (msg) => {
      if (!open || minimized) {
        setUnread((u) => u + 1);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [token, open, minimized, conversationId]);

  useEffect(() => {
    // Lấy hội thoại đầu tiên của user; có thể tùy biến chọn theo logic business
    (async () => {
      if (!token) return;
      try {
        const convs = await listConversations(token);
        if (Array.isArray(convs) && convs.length > 0) {
          setConversationId(convs[0]._id);
        }
      } catch {
        // bỏ qua lỗi để UI vẫn hoạt động; sẽ tạo hội thoại khi cần ở BE
      }
    })();
  }, [token]);

  const toggleOpen = () => {
    setOpen((v) => !v);
    setMinimized(false);
    setUnread(0);
  };

  return (
    <>
      {/* Bubble */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-transform"
        aria-label="Mở chat"
        title="Chat hỗ trợ"
      >
        {/* badge thông báo */}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
            {unread}
          </span>
        )}
        {/* icon bubble */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6m-6 4h10m-5 4l-4-4H7a5 5 0 01-5-5V7a5 5 0 015-5h10a5 5 0 015 5v6a5 5 0 01-5 5h-2l-4 4z" />
        </svg>
      </button>

      {/* Cửa sổ/Modal chat */}
      {open && (
        isStaffOrAdmin ? (
          <AdminChatModal
            token={token}
            userId={userId}
            socket={socket}
            onClose={() => setOpen(false)}
          />
        ) : (
          <ChatWindow
            token={token}
            userId={userId}
            socket={socket}
            conversationId={conversationId}
            onClose={() => setOpen(false)}
            onMinimize={() => setMinimized((m) => !m)}
            minimized={minimized}
            clearUnread={() => setUnread(0)}
          />
        )
      )}
    </>
  );
}