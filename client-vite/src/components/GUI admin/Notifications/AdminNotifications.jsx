import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState('all');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sendResult, setSendResult] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('none'); // none | 15m | custom
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  // Helper function để lấy token từ localStorage
  const getAuthToken = () => {
    try {
      const storedRaw = localStorage.getItem('userInfo');
      if (!storedRaw) return null;
      const stored = JSON.parse(storedRaw);
      return stored?.user?.token || stored?.token || null;
    } catch (error) {
      console.error('Lỗi lấy token:', error);
      return null;
    }
  };

  // Lấy danh sách thông báo
  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await axios.get('/api/notifications/admin/list', config);
      const list = Array.isArray(res.data) ? res.data : res.data?.notifications || [];
      setNotifications(list.filter(n => !n.isSystem && n.category !== 'system'));
    } catch (err) {
      console.error('Lỗi lấy danh sách thông báo:', err);
      if (err.response?.status === 401) {
        console.error('Token hết hạn hoặc không hợp lệ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Gửi thông báo mới
  const submitNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSending(true);
    setSendResult(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setSendResult({ ok: false, msg: 'Bạn chưa đăng nhập hoặc token đã hết hạn!' });
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { audience, message, type };
      if (scheduleMode === '15m') {
        payload.durationMinutes = 15;
      } else if (scheduleMode === 'custom') {
        if (startsAt) payload.startsAt = startsAt;
        if (endsAt) payload.endsAt = endsAt;
      }
      
      console.log('Gửi thông báo với payload:', payload);
      console.log('Token:', token.substring(0, 20) + '...');
      
      await axios.post('/api/notifications/admin/send', payload, config);
      
      setSendResult({ ok: true, msg: 'Đã gửi thông báo thành công!' });
      setMessage('');
      setAudience('all');
      setType('info');
      setScheduleMode('none');
      setStartsAt('');
      setEndsAt('');
      
      // Refresh danh sách thông báo
      fetchNotifications();
    } catch (e) {
      console.error('Lỗi gửi thông báo:', e);
      const errorMsg = e.response?.data?.message || 'Gửi thông báo thất bại!';
      setSendResult({ ok: false, msg: errorMsg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý thông báo</h1>
        
        {/* Form tạo thông báo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tạo thông báo mới</h2>
          
          <form onSubmit={submitNotification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Đối tượng</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="radio" 
                    name="audience" 
                    value="all" 
                    checked={audience === 'all'} 
                    onChange={(e) => setAudience(e.target.value)} 
                    className="text-blue-600"
                  />
                  Tất cả mọi người
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="radio" 
                    name="audience" 
                    value="staff" 
                    checked={audience === 'staff'} 
                    onChange={(e) => setAudience(e.target.value)} 
                    className="text-blue-600"
                  />
                  Nhân viên (Staff)
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Loại thông báo</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={type} 
                onChange={(e) => setType(e.target.value)}
              >
                <option value="info">Thông tin</option>
                <option value="warning">Cảnh báo</option>
                <option value="error">Lỗi</option>
              </select>
            </div>
            
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Nội dung thông báo</label>
            <textarea 
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
            />
          </div>

            {/* Lịch hiển thị */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Thời gian hiển thị</label>
              <div className="flex flex-wrap gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="scheduleMode" value="none" checked={scheduleMode==='none'} onChange={(e)=>setScheduleMode(e.target.value)} />
                  Không giới hạn
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="scheduleMode" value="15m" checked={scheduleMode==='15m'} onChange={(e)=>setScheduleMode(e.target.value)} />
                  Trong 15 phút
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="scheduleMode" value="custom" checked={scheduleMode==='custom'} onChange={(e)=>setScheduleMode(e.target.value)} />
                  Khoảng thời gian tùy chọn
                </label>
              </div>
              {scheduleMode==='custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bắt đầu</label>
                    <input type="datetime-local" className="w-full rounded-md border border-gray-300 p-2 text-sm" value={startsAt} onChange={(e)=>setStartsAt(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kết thúc</label>
                    <input type="datetime-local" className="w-full rounded-md border border-gray-300 p-2 text-sm" value={endsAt} onChange={(e)=>setEndsAt(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <button 
                type="submit"
                disabled={sending || !message.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Đang gửi...' : 'Gửi thông báo'}
              </button>
            </div>
            
            {sendResult && (
              <p className={`text-sm ${sendResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                {sendResult.msg}
              </p>
            )}
          </form>
        </div>
        
        {/* Danh sách thông báo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Lịch sử thông báo</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notif.type === 'error' ? 'bg-red-100 text-red-800' :
                          notif.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notif.type === 'error' ? 'Lỗi' : notif.type === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {notif.audience === 'staff' ? 'Nhân viên' : 'Tất cả'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tạo: {new Date(notif.createdAt || notif.created_at || Date.now()).toLocaleString('vi-VN')}
                      </p>
                      {(notif.startsAt || notif.endsAt) && (
                        <p className="text-xs text-gray-500">Hiển thị: {notif.startsAt ? new Date(notif.startsAt).toLocaleString('vi-VN') : 'Ngay lập tức'} → {notif.endsAt ? new Date(notif.endsAt).toLocaleString('vi-VN') : 'Không giới hạn'}</p>
                      )}
                      {notif.isOutdated && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">Đã hết hạn</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;