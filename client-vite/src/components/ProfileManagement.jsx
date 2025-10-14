import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Navbar from './Navbar';

import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/images/default-avatar.jpg';
import { Button, Alert, Spinner } from 'react-bootstrap';

function ProfileManagement() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    bookingsCount: 0,
  });
  const [newAvatar, setNewAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5000';
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // 🔹 Tự động logout nếu chưa login
  useEffect(() => {
    if (!userInfo || !userInfo.token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // 🔹 Lấy thông tin người dùng
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE_URL}/api/users/${userInfo._id}/profile`,
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        setUser({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.avatar || '',
          bookingsCount: data.bookingsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('userInfo');
          navigate('/login', { replace: true });
        } else {
          setError(error.response?.data?.message || 'Không thể tải thông tin hồ sơ');
        }
      } finally {
        setLoading(false);
      }
    };
    if (userInfo && userInfo.token) fetchProfile();
  }, [navigate]);

  // 🔹 Cập nhật thông tin cơ bản
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (newAvatar) {
        const formData = new FormData();
        formData.append('name', user.name);
        formData.append('phone', user.phone);
        formData.append('avatar', newAvatar);
        response = await axios.put(
          `${API_BASE_URL}/api/users/${userInfo._id}/profile`,
          formData,
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
      } else {
        response = await axios.put(
          `${API_BASE_URL}/api/users/${userInfo._id}/profile`,
          { name: user.name, phone: user.phone },
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      setUser((prev) => ({
        ...prev,
        name: response.data.name,
        phone: response.data.phone,
        avatar: response.data.avatar,
      }));

      // 🔹 Cập nhật lại localStorage (giống LoginScreen)
      const updatedUserInfo = {
        ...userInfo,
        name: response.data.name,
        phone: response.data.phone,
        avatar: response.data.avatar
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

      setSuccess('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setUploadLoading(false);
    }
  };

  // 🔹 Đổi mật khẩu
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu mới và xác nhận không khớp');
      setPasswordLoading(false);
      return;
    }

    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/${userInfo._id}/password`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess(data.message || 'Đổi mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setError('Vui lòng chọn ảnh JPG, PNG hoặc GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không vượt quá 5MB');
      return;
    }
    setNewAvatar(file);
    const reader = new FileReader();
    reader.onload = () => setUser((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <Navbar />
      <div className="profile-management" style={{ marginTop: '120px' }}>
        <h2>Quản lý hồ sơ</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="profile-container">
          <div className="avatar-section">
            <img
              src={
                user.avatar?.startsWith('data:')
                  ? user.avatar
                  : user.avatar
                    ? `${API_BASE_URL}/${user.avatar}`
                    : defaultAvatar
              }
              alt="Avatar"
              className="avatar-image"
            />
            <div className="avatar-actions">
              <label htmlFor="avatar-upload" className="upload-button">
                {uploadLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Cập nhật ảnh'
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user.email} disabled />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={user.phone || ''}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tổng số đặt phòng</label>
              <p className="disabled-field">{user.bookingsCount}</p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={uploadLoading}
            >
              {uploadLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Cập nhật hồ sơ'
              )}
            </Button>

            <hr />

            <Button
              variant="outline-primary"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              {showPasswordForm ? 'Hủy' : 'Đổi mật khẩu'}
            </Button>

            {showPasswordForm && (
              <div className="password-form">
                <input
                  type="password"
                  placeholder="Mật khẩu cũ"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <Button
                  variant="success"
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    'Cập nhật mật khẩu'
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileManagement;
