import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function PointsPage() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token) {
      navigate('/login');
      return;
    }
    setUser(userInfo);
    fetchPoints(userInfo);
    fetchBookings(userInfo);
  }, [navigate]);

  const fetchPoints = async (userInfo) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const response = await axios.get('/api/users/points', config);
      setPoints(response.data.points);
      setTransactions(response.data.recentTransactions);
    } catch (error) {
      setError('Không thể tải thông tin điểm thưởng');
      console.error('Error fetching points:', error);
    }
  };

  const fetchBookings = async (userInfo) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const response = await axios.get(`/api/bookings/history/${userInfo._id}`, config);
      const eligibleBookings = response.data.filter(
        (booking) => booking.paymentStatus === 'pending' && booking.status !== 'canceled'
      );
      setBookings(eligibleBookings);
    } catch (error) {
      setError('Không thể tải danh sách đặt phòng');
      console.error('Error fetching bookings:', error);
    }
  };

  const handleCheckout = useCallback(async () => {
    if (!selectedBooking) {
      setError('Vui lòng chọn một đặt phòng để thanh toán');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      // Kiểm tra trạng thái booking trước khi checkout
      const bookingCheck = await axios.get(`/api/bookings/${selectedBooking}`, config);
      if (bookingCheck.data.status !== 'confirmed' || bookingCheck.data.paymentStatus !== 'paid') {
        setError('Đặt phòng chưa đủ điều kiện để tích điểm');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        '/api/bookings/checkout',
        { bookingId: selectedBooking },
        config
      );

      setSuccess(`Thanh toán thành công! Bạn đã nhận được ${response.data.points} điểm`);
      setPoints(response.data.totalPoints);
      setTransactions([response.data.transaction, ...transactions]);
      setBookings(bookings.filter((booking) => booking._id !== selectedBooking));
      setSelectedBooking('');

      // Tự động xóa thông báo thành công sau 5 giây
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi thực hiện thanh toán');
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBooking, user, bookings, transactions]);

  // Chuyển đổi paymentMethod sang tên hiển thị
  const getPaymentMethodDisplay = (method) => {
    switch (method) {
      case 'cash':
        return 'Tiền mặt';
      case 'credit_card':
        return 'Thẻ tín dụng';
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      case 'mobile_payment':
        return 'Thanh toán MoMo';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="points-page container my-5">
      <h2>Điểm thưởng của bạn</h2>
      {user && (
        <div className="points-summary card p-4 mb-4">
          <h3>Xin chào, {user.name}</h3>
          <p>Điểm hiện tại: <strong>{points.toLocaleString()}</strong></p>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="checkout-section card p-4 mb-4">
        <h4>Thanh toán và tích điểm</h4>
        <div className="form-group">
          <label htmlFor="bookingSelect">Chọn đặt phòng để thanh toán:</label>
          <select
            id="bookingSelect"
            className="form-control"
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
            disabled={loading}
          >
            <option value="">Chọn một đặt phòng</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                Đặt phòng #{booking._id} - {new Date(booking.checkin).toLocaleDateString('vi-VN')} đến{' '}
                {new Date(booking.checkout).toLocaleDateString('vi-VN')}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mt-3">
          <label htmlFor="paymentMethod">Phương thức thanh toán:</label>
          <select
            id="paymentMethod"
            className="form-control"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={loading}
          >
            <option value="cash">Tiền mặt</option>
            <option value="credit_card">Thẻ tín dụng</option>
            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
            <option value="mobile_payment">Thanh toán qua ứng dụng (MoMo)</option>
          </select>
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={handleCheckout}
          disabled={loading || !selectedBooking}
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán và tích điểm'}
        </button>
      </div>

      <div className="transactions-section card p-4">
        <h4>Lịch sử giao dịch</h4>
        {transactions.length > 0 ? (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Đặt phòng</th>
                <th>Số tiền</th>
                <th>Điểm nhận được</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{new Date(transaction.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    {transaction.bookingId
                      ? `Check-in: ${new Date(transaction.bookingId.checkin).toLocaleDateString(
                          'vi-VN'
                        )} - Check-out: ${new Date(transaction.bookingId.checkout).toLocaleDateString('vi-VN')}`
                      : 'N/A'}
                  </td>
                  <td>{transaction.amount ? transaction.amount.toLocaleString('vi-VN') + ' VND' : 'N/A'}</td>
                  <td>{transaction.points || 0}</td>
                  <td>{getPaymentMethodDisplay(transaction.paymentMethod)}</td>
                  <td>{transaction.status === 'completed' ? 'Hoàn tất' : transaction.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có giao dịch nào.</p>
        )}
      </div>
    </div>
  );
}

export default PointsPage;