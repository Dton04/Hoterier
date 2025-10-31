import React, {useEffect, useState, useRef} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ProfileDetails(){
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const storedUserInfo = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
  const userInfo = storedUserInfo ? JSON.parse(storedUserInfo) : null; // parse once per render
  const token = userInfo?.token;
  const userIdFromStorage = userInfo?._id || userInfo?.id;
  const API_BASE_URL = 'http://localhost:5000';

  useEffect(()=>{
    if(!token){
      navigate('/login', { replace: true });
      return;
    }
    const fetchProfile = async ()=>{
      try{
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        // try using full API URL first, then fallback to proxy '/api' if it fails
        let res;
        try {
          res = await axios.get(`${API_BASE_URL}/api/users/${userIdFromStorage}/profile`, { headers });
        } catch (err) {
          console.warn('Direct API call failed, trying proxied /api path', err.message || err);
          res = await axios.get(`/api/users/${userIdFromStorage}/profile`, { headers });
        }
        setProfile(res.data);
      }catch(err){
        console.error('fetchProfile error:', err);
        const serverMsg = err.response?.data?.message || err.message || String(err);
        setError(`Không thể tải thông tin người dùng: ${serverMsg}`);
      }finally{
        setLoading(false);
      }
    };
    fetchProfile();
  },[navigate, token, userIdFromStorage]);

  const handleChange = (e)=>{
    const {name, value} = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatar = (e)=>{
    if(e.target.files && e.target.files[0]){
      setProfile(prev => ({ ...prev, avatarFile: e.target.files[0]}));
    }
  };

  const handleSave = async (e)=>{
    e.preventDefault();
    if(!profile) return;
    setSaving(true);
    try{
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };
      const formData = new FormData();
      formData.append('name', profile.name || '');
      formData.append('phone', profile.phone || '');
      formData.append('dob', profile.dob || '');
      formData.append('nationality', profile.nationality || '');
      formData.append('gender', profile.gender || '');
      if(profile.avatarFile){
        formData.append('avatar', profile.avatarFile);
      }
  const userId = userIdFromStorage;
      const res = await axios.put(`${API_BASE_URL}/api/users/${userId}/profile`, formData, { headers });
      // NOTE: some userInfo object uses _id; handle both
      // Update local copy and UI
      setProfile(res.data);
      setEditing(false);
    }catch(err){
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }finally{
      setSaving(false);
    }
  };

  if(loading) return <div className="p-6">Đang tải...</div>;

  if(!loading && error && !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2 text-gray-700">Kiểm tra: 1) Backend đang chạy (port 5000), 2) Bạn đã đăng nhập (localStorage userInfo.token), 3) CORS hoặc proxy.</p>
          <div className="mt-3 flex gap-3">
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-gray-200 rounded">Tải lại trang</button>
            <button onClick={() => {
              // retry fetch by reloading component
              setError('');
              setLoading(true);
              const headers = { Authorization: `Bearer ${userInfo?.token}` };
              axios.get(`/api/users/${userInfo?._id || userInfo?.id}/profile`, { headers })
                .then(res => setProfile(res.data))
                .catch(err => setError(err.response?.data?.message || err.message || String(err)))
                .finally(() => setLoading(false));
            }} className="px-3 py-1 bg-blue-600 text-white rounded">Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
      <div className="flex items-start gap-6">
        <div className="w-28 text-center">
          <img
            src={profile?.avatar ? `${API_BASE_URL}/${profile.avatar.replace(/^\/+/, '')}` : '/images/default-avatar.png'}
            alt="avatar"
            className="w-28 h-28 rounded-full object-cover mx-auto border"
          />
          {editing && (
            <div className="mt-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">Thông tin cá nhân</h2>
              <p className="text-sm text-gray-500">Cập nhật thông tin của bạn để dễ dàng quản lý đặt phòng.</p>
            </div>
            <div>
              {!editing && (
                <button onClick={()=>setEditing(true)} className="text-blue-600 hover:underline">Chỉnh sửa</button>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">Tên</label>
              <input name="name" value={profile?.name || ''} onChange={handleChange} disabled={!editing} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="text-xs text-gray-600">Email</label>
              <input value={profile?.email || ''} disabled className="w-full border rounded px-3 py-2 bg-gray-50" />
            </div>

            <div>
              <label className="text-xs text-gray-600">Số điện thoại</label>
              <input name="phone" value={profile?.phone || ''} onChange={handleChange} disabled={!editing} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="text-xs text-gray-600">Ngày sinh</label>
              <input name="dob" type="date" value={profile?.dob ? profile.dob.split('T')[0] : ''} onChange={handleChange} disabled={!editing} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="text-xs text-gray-600">Quốc tịch</label>
              <input name="nationality" value={profile?.nationality || ''} onChange={handleChange} disabled={!editing} className="w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="text-xs text-gray-600">Giới tính</label>
              <select name="gender" value={profile?.gender || ''} onChange={handleChange} disabled={!editing} className="w-full border rounded px-3 py-2">
                <option value="">Không chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {editing && (
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={()=>setEditing(false)} className="px-4 py-2 border rounded">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            )}
          </form>

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}