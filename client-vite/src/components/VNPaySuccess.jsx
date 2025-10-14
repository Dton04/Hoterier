import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Spinner } from 'react-bootstrap';


const VNPaySuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const bookingId = new URLSearchParams(location.search).get('bookingId');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!bookingId) {
          setError('Không tìm thấy ID đặt phòng.');
          return;
        }

        setLoading(true);
        const response = await axios.get(`/api/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải thông tin đặt phòng.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (error || !booking) return; // Không chuyển hướng nếu có lỗi hoặc chưa có dữ liệu

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
      if (countdown <= 0) {
        clearInterval(timer);
        navigate('/bookings', { state: { newBooking: booking } }); // Truyền booking qua state
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, countdown, booking, error]);

  return (
    <div className="booking-list-page container">
      <div className="booking-header text-center">
        <h2 className="subtitle">
          <span className="line"></span>
          THÔNG BÁO THANH TOÁN
          <span className="line"></span>
        </h2>
        <h1 className="title">
          KẾT QUẢ <span>THANH TOÁN</span>
        </h1>
      </div>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      ) : (
        <div className="booking-item card mb-3">
          <div className="card-body text-center">
            <h5 className="card-title">Thanh toán thành công!</h5>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
            <p>
              Đặt phòng của bạn (ID: <strong>{bookingId}</strong>) đã được xác nhận.
            </p>
            <p>
              Trang sẽ tự động chuyển hướng sau <span className="countdown">{countdown}</span> giây...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VNPaySuccess;