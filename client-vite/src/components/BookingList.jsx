import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Spinner } from 'react-bootstrap';
import CancelConfirmationModal from './CancelConfirmationModal';


function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem('userEmail');
        if (!email) {
          setError('Vui lòng cung cấp email để xem lịch sử đặt phòng.');
          return;
        }
        const response = await axios.get('/api/bookings', { params: { email } });
        setBookings(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải danh sách đặt phòng.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleOpenCancelModal = (booking) => {
    setSelectedBooking({
      id: booking._id,
      roomName: booking.roomid?.name || 'Phòng không xác định',
      checkin: booking.checkin,
      checkout: booking.checkout
    });
    setShowCancelModal(true);
  };

  const handleConfirmSuccess = () => {
    setShowCancelModal(false);
    setBookings(bookings.filter((booking) => booking._id !== selectedBooking.id));
  };

  return (
    <div className="booking-list-page container">
      <div className="booking-header text-center">
        <h2 className="subtitle">
          <span className="line"></span>
          LỊCH SỬ ĐẶT PHÒNG
          <span className="line"></span>
        </h2>
        <h1 className="title">
          Quản lý <span>ĐẶT PHÒNG</span>
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
      ) : bookings.length === 0 ? (
        <Alert variant="info" className="text-center">
          Bạn chưa có đặt phòng nào.
        </Alert>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-item card mb-3">
              <div className="card-body">
                <h5 className="card-title">{booking.roomid?.name || 'Phòng không xác định'}</h5>
                <p><strong>Trạng thái:</strong> {booking.status === 'pending' ? 'Chờ xác nhận' : booking.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy'}</p>
                <p><strong>Ngày nhận phòng:</strong> {new Date(booking.checkin).toLocaleDateString('vi-VN')}</p>
                <p><strong>Ngày trả phòng:</strong> {new Date(booking.checkout).toLocaleDateString('vi-VN')}</p>
                <p><strong>Người lớn:</strong> {booking.adults}</p>
                <p><strong>Trẻ em:</strong> {booking.children || 0}</p>
                {booking.status !== 'canceled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleOpenCancelModal(booking)}
                  >
                    Hủy đặt phòng
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <CancelConfirmationModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmSuccess={handleConfirmSuccess}
        bookingId={selectedBooking?.id}
        bookingDetails={selectedBooking}
      />
    </div>
  );
}

export default BookingList;