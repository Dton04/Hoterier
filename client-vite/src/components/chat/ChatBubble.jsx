import { useEffect, useState, lazy, Suspense } from 'react';
import ChatWindow from './ChatWindow';
import { connectSocket, listConversations, createConversation, joinConversation } from '../../utils/chatApi';
const LazyAdminChatModal = lazy(() => import('../GUI admin/Chats/AdminChatModal.jsx'));

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
  const [errorText, setErrorText] = useState('');

  // Lưu ý: giữ nguyên cách bạn lấy token/userId (ví dụ decodeUserInfo nếu đã có sẵn)
  const { token, userId, role } = decodeUserInfo?.() || {};
  const defaultAdminId =
    localStorage.getItem('defaultAdminId') ||
    (import.meta.env && import.meta.env.VITE_DEFAULT_ADMIN_ID) ||
    null;

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
  async function ensureConversationForUser() {
    if (conversationId) return conversationId;
    if (role !== 'user') return null;
  
    if (!defaultAdminId) {
      setErrorText('Chưa cấu hình tài khoản admin hỗ trợ. Vui lòng thử lại sau.');
      return null;
    }
  
    try {
      const conv = await createConversation(defaultAdminId, token);
      const id = conv?._id || conv?.id;
      if (!id) {
        setErrorText('Không thể tạo hội thoại. Vui lòng thử lại sau.');
        return null;
      }
      setConversationId(id);
      setErrorText('');
      socket?.emit?.('conversation:join', { conversationId: id });
      try { await joinConversation(id, token); } catch { /* optional */ }
      return id;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setErrorText('Bạn không có quyền tạo hội thoại với admin này.');
      } else if (status === 400) {
        setErrorText('ID admin không hợp lệ hoặc chưa sẵn sàng.');
      } else {
        setErrorText('Lỗi tạo hội thoại. Vui lòng thử lại sau.');
      }
      return null;
    }
  }

  const openChat = async () => {
    clearUnread();
    if (role === 'user') {
      const id = await ensureConversationForUser();
      if (!id) return;
    }
    setOpen(true);
  };
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
          <Suspense fallback={null}>
            <LazyAdminChatModal
              token={token}
              userId={userId}
              socket={socket}
              onClose={closeChat}
            />
          </Suspense>
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
        ) : null
      )}
    </div>
  );
}

export default ChatBubble;
