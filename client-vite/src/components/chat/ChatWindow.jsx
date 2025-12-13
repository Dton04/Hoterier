import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchMessages, sendTextMessage, sendImageMessage } from '../../utils/chatApi';

export default function ChatWindow({
  token,
  userId,
  socket,
  conversationId,
  onClose,
  clearUnread,
  embedded, // thêm prop cho chế độ modal
  customHeader, // thêm prop custom header
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    if (!conversationId || !token) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMessages(conversationId, token);
        setMessages(data || []);
      } catch {
        // giữ UI silent
      } finally {
        setLoading(false);
        clearUnread?.();
        // scroll cuối
        setTimeout(() => scrollToBottom(), 100);
      }
    })();
  }, [conversationId, token]);

  const isAtBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      if (msg.conversation?.toString() === conversationId?.toString()) {
        const stick = isAtBottom();
        setMessages((prev) => [...prev, msg]);
        clearUnread?.();
        if (stick) scrollToBottom();
      }
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversationId]);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    setIsTyping(true);
    if (socket?.connected && conversationId) {
      socket.emit('typing', { conversationId });
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 800);
  };

  const handleSend = async () => {
    if (!canSend || !conversationId) return;
    setSending(true);
    try {
      if (socket?.connected) {
        socket.emit('message:send', { conversationId, content: input.trim() });
      } else {
        const msg = await sendTextMessage(conversationId, input.trim(), token);
        setMessages((prev) => [...prev, msg]);
      }
      setInput('');
      scrollToBottom();
    } catch {
      // có thể hiển thị toast lỗi sau
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    setSending(true);
    try {
      const msg = await sendImageMessage(conversationId, file, input.trim(), token);
      setMessages((prev) => [...prev, msg]);
      setInput('');
      scrollToBottom();
    } catch {
      // giữ UI silent; có thể bổ sung toast nếu cần
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  // Style responsive: nếu embedded → chiếm toàn bộ cột phải trong modal
  return (
    <div
      className={
        embedded
          ? "w-full h-full bg-white flex flex-col min-h-0"
          : // Nâng cửa sổ lên và tránh chồng lên chatbot (ở góc dưới phải)
          "fixed bottom-28 right-6 md:right-10 z-[1000] bg-white shadow-2xl rounded-xl border border-slate-200 w-[92vw] max-w-[360px] md:max-w-[420px] h-[58vh] md:h-[62vh]"
      }
      role="dialog"
      aria-label="Cửa sổ chat hỗ trợ"
    >
      {/* Header */}
      {customHeader ? customHeader : (
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">H</div>
          <div className="font-semibold">Hỗ trợ khách hàng</div>
        </div>
        {!embedded && (
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded hover:bg-slate-100 active:scale-95 transition"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Body luôn hiển thị */}
      <div className={embedded ? "flex flex-col flex-1 min-h-0" : "flex flex-col h-[calc(58vh-48px)] md:h-[calc(62vh-48px)]"}>
        {/* Danh sách tin nhắn */}
        <div
          ref={listRef}
          // Sắp xếp thành 1 cột thẳng đứng, neo về đáy, khoảng cách đều
          className="flex-1 min-h-0 overflow-y-auto p-3 bg-slate-50 flex flex-col space-y-3 pb-4"
        >
          {loading ? (
            <div className="text-sm text-slate-500">Đang tải lịch sử…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-slate-500">Hãy bắt đầu cuộc trò chuyện</div>
          ) : (
            messages.map((m) => {
              let senderId = m.sender;
              if (senderId && typeof senderId === 'object') {
                  senderId = senderId._id || senderId;
              }
              const isMe = userId && String(senderId) === String(userId);

              return (
                // Neo bubble theo cột: bên trái cho người khác, bên phải cho user
                // items-end đảm bảo bubble bám đáy hàng, không “lơ lửng”
                <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 shadow ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border'
                      }`}
                  >
                    {m.type === 'image' ? (
                      <div className="space-y-1">
                        {m.content && <div className="text-sm">{m.content}</div>}
                        <img
                          src={m.imageUrl}
                          alt="image"
                          className="rounded-md max-h-56 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="text-sm">{m.content}</div>
                    )}
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Typing */}
        {isTyping && (
          <div className="px-3 py-1 text-xs text-slate-500">Bạn đang nhập…</div>
        )}

        {/* Input */}
        <div className="p-2 border-t bg-white flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={openFilePicker}
            disabled={sending}
            className="rounded-md border px-3 py-2 text-sm bg-white text-blue-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Gửi ảnh"
            title="Gửi ảnh"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l5-6 4 5 3-4 4 5" stroke="currentColor" strokeWidth="2" />
              <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => e.key === 'Enter' && canSend && handleSend()}
            placeholder="Nhập tin nhắn…"
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50 hover:bg-blue-700 active:scale-95 transition"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}