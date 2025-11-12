import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAllUsers,
  searchUsers,
  createConversation,
  joinConversation,
} from '../../../utils/chatApi';
import ChatWindow from '../../chat/ChatWindow';

export default function AdminChatModal({ token, userId, socket, onClose }) {
  const [users, setUsers] = useState([]);
  const [displayCount, setDisplayCount] = useState(50); // hiển thị theo khối để mượt
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  const canUse = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!canUse) return;
    (async () => {
      try {
        setLoadingUsers(true);
        const data = await fetchAllUsers(token);
        setUsers((Array.isArray(data) ? data : []).filter((u) => u.role === 'user'));
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [token, canUse]);

  // Debounce tìm kiếm server-side
  useEffect(() => {
    if (!canUse) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (!search.trim()) {
          const data = await fetchAllUsers(token);
          setUsers((Array.isArray(data) ? data : []).filter((u) => u.role === 'user'));
          setDisplayCount(50);
        } else {
          const data = await searchUsers(search.trim(), token);
          setUsers((Array.isArray(data) ? data : []).filter((u) => u.role === 'user'));
          setDisplayCount(50);
        }
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, token, canUse]);

  const handleScrollList = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) {
      setDisplayCount((c) => Math.min(c + 50, users.length));
    }
  };

  // Rejoin room khi có conversationId và khi socket reconnect (tránh mất realtime)
  useEffect(() => {
    if (!socket || !conversationId) return;
    const rejoin = () => socket.emit('conversation:join', { conversationId });
    socket.on('connect', rejoin);
    rejoin();
    return () => socket.off('connect', rejoin);
  }, [socket, conversationId]);

  const handlePickUser = async (u) => {
    setSelectedUser(u);
    try {
      const conv = await createConversation(u._id, token);
      const id = conv?._id || conv?.id;
      if (id) {
        setConversationId(id);
        socket?.emit?.('conversation:join', { conversationId: id });
        try { await joinConversation(id, token); } catch { /* optional */ }
      }
    } catch {
      // có thể hiện toast
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div
        className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[80vh]
                   transition-transform duration-200 ease-out scale-100 overflow-hidden"
        role="dialog"
        aria-label="Chat hỗ trợ khách hàng - Staff/Admin"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold text-slate-800">Trung tâm chat hỗ trợ</div>
          <button
            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 active:scale-95 transition"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
          >
            Đóng
          </button>
        </div>

        {/* Body: 2 cột (cân chiều cao, không thụt) */}
        <div className="grid grid-cols-[20rem_1fr] h-[calc(80vh-52px)] items-stretch">
          {/* Cột trái */}
          <div className="border-r flex flex-col min-h-0">
            <div className="p-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm người dùng theo tên/email…"
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div
              ref={listRef}
              onScroll={handleScrollList}
              className="flex-1 overflow-y-auto"
            >
              {loadingUsers ? (
                <div className="p-3 text-sm text-slate-500">Đang tải danh sách…</div>
              ) : users.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">Không có người dùng</div>
              ) : (
                users.slice(0, displayCount).map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handlePickUser(u)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 border-b
                                ${selectedUser?._id === u._id ? 'bg-blue-50' : ''}`}
                    title={u.email}
                  >
                    <div className="text-sm font-medium text-slate-800">
                      {u.name || 'Không có tên'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {u.email}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cột phải */}
          <div className="flex-1 min-h-0">
            {conversationId ? (
              <ChatWindow
                token={token}
                userId={userId}
                socket={socket}
                conversationId={conversationId}
                minimized={false}
                onMinimize={() => {}}
                onClose={onClose}
                clearUnread={() => {}}
                embedded
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Chọn một người dùng ở cột trái để bắt đầu chat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}