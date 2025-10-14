import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function FacebookCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const userDataParam = query.get('user');
    const errorParam = query.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (userDataParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataParam));
        // Lưu thông tin người dùng
        localStorage.setItem('userInfo', JSON.stringify(userData));
        // Lưu token riêng
        localStorage.setItem('token', userData.token);
        setSuccess('Đăng nhập Facebook thành công!');
        setLoading(false);

        // Chuyển hướng dựa trên vai trò
        setTimeout(() => {
          if (userData.isAdmin) {
            navigate('/home');
          } else if (userData.role === 'staff') {
            navigate('/home');
          } else {
            navigate('/home');
          }
        }, 2000);
      } catch (err) {
        setError('Lỗi xử lý dữ liệu xác thực Facebook');
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError('Không nhận được dữ liệu xác thực từ Facebook');
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate]);

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Đang xử lý xác thực</h1>
        {loading && <p>Đang xử lý đăng nhập Facebook...</p>}
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
}

export default FacebookCallback;