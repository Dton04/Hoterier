import axios from 'axios';
import { io } from 'socket.io-client';
//Api helper tối ưu gọi socket và api giữ code gọn dễ tái sử dụng
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''; // để trống: axios dùng cùng origin (vite proxy) hoặc bạn điền http://localhost:5000

export function connectSocket(token) {
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
  const socket = io(SOCKET_URL || '/', {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    auth: { token },                         // server đọc handshake.auth
    query: { token },                        // dự phòng qua query
    extraHeaders: { Authorization: `Bearer ${token}` }, // dự phòng qua header
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionAttempts: Infinity,
    forceNew: true,                          // mỗi tab là 1 kết nối riêng
    timeout: 10000,
  });
  return socket;
}

export async function listConversations(token) {
  const res = await axios.get('/api/chats/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function fetchMessages(conversationId, token) {
  const res = await axios.get(`/api/chats/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function sendTextMessage(conversationId, content, token) {
  const res = await axios.post(
    `/api/chats/conversations/${conversationId}/messages`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function sendImageMessage(conversationId, file, caption, token) {
  const form = new FormData();
  form.append('image', file);
  if (caption) form.append('content', caption);

  const res = await axios.post(
    `/api/chats/conversations/${conversationId}/messages/image`,
    form,
    {
      headers: { Authorization: `Bearer ${token}` }, // KHÔNG đặt Content-Type
    }
  );
  return res.data;
}

// Lấy tất cả user (staff chỉ thấy user; admin thấy user + staff)
export async function fetchAllUsers(token) {
  const res = await axios.get('/api/users/allusers', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Tìm kiếm user theo tên/email
export async function searchUsers(q, token) {
  const res = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Tạo/ lấy hội thoại giữa người đang đăng nhập và user mục tiêu
export async function createConversation(targetUserId, token) {
  const res = await axios.post(
    '/api/chats/conversations',
    { targetUserId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function createHotelConversation(hotelId, token) {
  const res = await axios.post(
    '/api/chats/conversations',
    { hotelId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// Tham gia phòng hội thoại (socket phòng)
export async function joinConversation(conversationId, token) {
  const res = await axios.post(
    `/api/chats/conversations/${conversationId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}