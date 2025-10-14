import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const Membership = () => {
  const [membershipData, setMembershipData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [accumulatedDiscounts, setAccumulatedDiscounts] = useState([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [rewards, setRewards] = useState([]); // Thêm state cho rewards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [showRewardHistory, setShowRewardHistory] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchMembershipData = async () => {
      try {
        const membershipResponse = await axios.get(`/api/users/membership/level/${userInfo._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const pointsResponse = await axios.get('/api/users/points', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const benefitsResponse = await axios.get(`/api/users/membership/benefits/${userInfo._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const accumulatedResponse = await axios.get('/api/discounts/accumulated', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const rewardsResponse = await axios.get('/api/rewards', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setMembershipData(membershipResponse.data);
        setPointsData(pointsResponse.data || { points: 0, recentTransactions: [] });
        setBenefits(benefitsResponse.data.benefits || []);
        setAccumulatedDiscounts(accumulatedResponse.data.discounts || []);
        setTotalSpending(accumulatedResponse.data.totalSpending || 0);
        setRewards(rewardsResponse.data.rewards || []); // Lưu danh sách rewards từ API
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thành viên');
        setLoading(false);
      }
    };

    fetchMembershipData();
  }, [navigate, userInfo]);

  const handleRedeemPoints = async (rewardId, pointsRequired) => {
    if (!userInfo) return;

    if (!pointsData || pointsData.points < pointsRequired) {
      alert('Bạn không đủ điểm để đổi thưởng này!');
      return;
    }

    try {
      const response = await axios.post(
        '/api/rewards/redeem',
        { rewardId, userId: userInfo._id },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      alert('Đổi thưởng thành công! Mã voucher: ' + response.data.voucherCode);
      const pointsResponse = await axios.get('/api/users/points', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setPointsData(pointsResponse.data || { points: 0, recentTransactions: [] });
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đổi thưởng');
    }
  };

  const handleApplyDiscount = async (discountId) => {
    try {
      const bookingId = 'YOUR_BOOKING_ID'; // Thay bằng logic lấy bookingId thực tế
      const response = await axios.post(
        '/api/discounts/apply',
        { bookingData: { bookingId }, identifiers: [discountId] },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      alert('Áp dụng ưu đãi thành công!');
      console.log(response.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi áp dụng ưu đãi');
    }
  };
  if (!userInfo) return null;
  if (loading) return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <h3>Đang tải thông tin thành viên...</h3>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    </div>
  );
  if (error) return (
    <div className="error-container">
      <div className="error-content">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Rất tiếc, đã có lỗi xảy ra</h3>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="membership-container">
      <h2>Chương Trình Thành Viên</h2>
      <div className="membership-info">
        <h3>Cấp Độ: {membershipData?.membershipLevel || 'N/A'}</h3>
        <p>Điểm Tích Lũy: {pointsData?.points || 0} điểm</p>
        <p>Tổng Chi Tiêu: {(totalSpending || 0).toLocaleString()} VNĐ</p>
      </div>

      <div className="benefits-section">
        <h4>Quyền Lợi Cấp Độ {membershipData?.membershipLevel || 'N/A'}</h4>
        {benefits.length > 0 ? (
          <ul>
            {benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        ) : (
          <p>Không có quyền lợi nào cho cấp độ này.</p>
        )}
      </div>

    {showRewardHistory && (
  <div className="modal-overlay" onClick={() => setShowRewardHistory(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Lịch sử giao dịch điểm</h3>
      <button className="modal-close" onClick={() => setShowRewardHistory(false)}>×</button>
      {pointsData?.recentTransactions?.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số Điểm</th>
              <th>Số Tiền</th>
              <th>Đặt Phòng</th>
            </tr>
          </thead>
          <tbody>
            {pointsData.recentTransactions.map((transaction) => (
              <tr key={transaction._id}>
                <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                <td>{transaction.points || 0} điểm</td>
                <td>{(transaction.amount || 0).toLocaleString()} VNĐ</td>
                <td>
                  {transaction.bookingId
                    ? `Từ ${new Date(transaction.bookingId.checkin).toLocaleDateString()} đến ${new Date(
                        transaction.bookingId.checkout
                      ).toLocaleDateString()}`
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Chưa có giao dịch nào.</p>
      )}
    </div>
    
  </div>
)}


      <div className="rewards-section">
        <div className="rewards-header">
          <h4>Đổi Điểm Lấy Voucher</h4>
          <button className="btn-history" onClick={() => setShowRewardHistory(true)}>
            Xem Lịch Sử Giao Dịch
          </button>
        </div>


        {rewards.length > 0 ? (
          <div className="rewards-list">
            {rewards.map((reward) => (
              <div key={reward._id} className="reward-item">
                <p>{reward.name} - {reward.pointsRequired} điểm</p>
                <p>Yêu cầu: {reward.membershipLevel}</p>
                <p>Mô tả: {reward.description || 'Không có mô tả'}</p>
                <button
                  className="btn btn-primary"
                  disabled={
                    !pointsData ||
                    pointsData.points < reward.pointsRequired ||
                    membershipData?.membershipLevel !== reward.membershipLevel
                  }
                  onClick={() => handleRedeemPoints(reward._id, reward.pointsRequired)}
                >
                  Đổi Ngay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Chưa có ưu đãi nào khả dụng.</p>
        )}
      </div>

      <div className="accumulated-discounts-section">
        <h4>Ưu Đãi Dựa Trên Chi Tiêu Tích Lũy</h4>
        {accumulatedDiscounts.length > 0 ? (
          <div className="discounts-list">
            {accumulatedDiscounts.map((discount) => (
              <div key={discount.id} className="discount-item">
                <p>
                  {discount.name} - Giảm{' '}
                  {discount.discountType === 'percentage'
                    ? `${discount.discountValue || 0}%`
                    : `${(discount.discountValue || 0).toLocaleString()} VNĐ`}
                </p>
                <p>Mô tả: {discount.description || 'Không có mô tả'}</p>
                <p>Số tiền đặt phòng tối thiểu: {(discount.minBookingAmount || 0).toLocaleString()} VNĐ</p>
                <p>
                  Hiệu lực: Từ {new Date(discount.startDate).toLocaleDateString()} đến{' '}
                  {new Date(discount.endDate).toLocaleDateString()}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleApplyDiscount(discount.id)}
                >
                  Áp Dụng
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Chưa có ưu đãi nào dựa trên chi tiêu tích lũy.</p>
        )}
      </div>
    </div>
  );
};

export default Membership;