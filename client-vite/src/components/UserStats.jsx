import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Đăng ký các thành phần của Chart.js
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const UserStats = () => {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Lấy danh sách đặt phòng và đánh giá của người dùng hiện tại
  const fetchData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.email) {
        console.error('Không tìm thấy userInfo hoặc email trong localStorage:', userInfo);
        navigate('/login');
        return;
      }

      console.log('Gửi yêu cầu API với email:', userInfo.email);

      // Gọi đồng thời API để lấy đặt phòng và đánh giá
      const [bookingResponse, reviewResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/bookings', {
          params: { email: userInfo.email.toLowerCase() },
        }),
        axios.get('http://localhost:5000/api/reviews/by-email', {
          params: { email: userInfo.email.toLowerCase() },
        }),
      ]);

      console.log('Dữ liệu bookings:', bookingResponse.data);
      console.log('Dữ liệu reviews:', reviewResponse.data);

      setBookings(bookingResponse.data);
      setReviews(reviewResponse.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi lấy dữ liệu thống kê người dùng';
      console.error('Lỗi trong fetchData:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        email: JSON.parse(localStorage.getItem('userInfo'))?.email,
      });
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tính toán thống kê
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const canceledBookings = bookings.filter((b) => b.status === 'canceled').length;
  const totalReviews = reviews.length; // Số lượt đánh giá của người dùng hiện tại

  // Dữ liệu cho biểu đồ cột (đặt phòng theo trạng thái)
  const barData = {
    labels: ['Đang chờ', 'Đã xác nhận', 'Đã hủy'],
    datasets: [
      {
        label: 'Số lượng đặt phòng',
        data: [pendingBookings, confirmedBookings, canceledBookings],
        backgroundColor: ['#007bff', '#28a745', '#dc3545'],
        borderColor: ['#0056b3', '#218838', '#c82333'],
        borderWidth: 1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ tròn (phân bố loại phòng)
  const roomTypes = [...new Set(bookings.map((b) => b.roomType))];
  const roomTypeCounts = roomTypes.map((type) =>
    bookings.filter((b) => b.roomType === type).length
  );

  const pieData = {
    labels: roomTypes.length ? roomTypes : ['Không có dữ liệu'],
    datasets: [
      {
        label: 'Phân bố loại phòng',
        data: roomTypes.length ? roomTypeCounts : [1],
        backgroundColor: ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'],
        hoverOffset: 4,
      },
    ],
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="user-stats-container">
      <h2>Thống Kê Người Dùng</h2>
      <div className="stats-summary">
        <div className="stat-card">
          <h3>Tổng Số Đặt Phòng</h3>
          <p>{totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Lượt Đánh Giá</h3>
          <p>{totalReviews}</p>
        </div>
        <div className="stat-card">
          <h3>Đặt Phòng Đang Chờ</h3>
          <p>{pendingBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Đặt Phòng Đã Xác Nhận</h3>
          <p>{confirmedBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Đặt Phòng Đã Hủy</h3>
          <p>{canceledBookings}</p>
        </div>
      </div>
      <div className="charts-container">
        <div className="chart">
          <h3>Đặt Phòng Theo Trạng Thái</h3>
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
            }}
          />
        </div>
        <div className="chart">
          <h3>Phân Bố Loại Phòng</h3>
          <Pie
            data={pieData}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
            }}
          />
        </div>
      </div>
    </div>
  );
};
 
export default UserStats;