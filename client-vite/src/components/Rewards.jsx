import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaGift, FaHistory, FaTicketAlt } from 'react-icons/fa';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [membershipLevel, setMembershipLevel] = useState('');
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [showVouchers, setShowVouchers] = useState(false);

  // Lấy danh sách ưu đãi
  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) throw new Error('Vui lòng đăng nhập để xem ưu đãi');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards', config);
      setRewards(data.rewards);
      setUserPoints(data.userPoints);
      setMembershipLevel(data.membershipLevel);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải ưu đãi');
      setLoading(false);
    }
  };

  // Lấy lịch sử đổi thưởng
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards/history', config);
      setHistory(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải lịch sử đổi thưởng');
    }
  };

  // Lấy danh sách voucher đã đổi
  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards/vouchers', config);
      setVouchers(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách voucher');
    }
  };

  // Xử lý đổi ưu đãi
  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) throw new Error('Vui lòng đăng nhập để đổi ưu đãi');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post('/api/rewards/redeem', { rewardId }, config);
      const reward = rewards.find(r => r._id === rewardId);
      
      // Thông báo thành công nâng cao
      toast.success(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FaGift className="text-2xl text-[#43a047]" />
            <h3 className="font-bold text-lg">Đổi Ưu Đãi Thành Công!</h3>
          </div>
          <div className="border-t border-white/30 pt-2">
            <p><span className="font-semibold">Tên ưu đãi:</span> {reward.name}</p>
            <p><span className="font-semibold">Mô tả:</span> {reward.description}</p>
            <p><span className="font-semibold">Mã Voucher:</span> <span className="font-mono bg-white/20 px-2 py-1 rounded">{data.voucherCode}</span></p>
            <p><span className="font-semibold">Hạn sử dụng:</span> {new Date(data.expiryDate).toLocaleDateString('vi-VN')}</p>
            <p><span className="font-semibold">Điểm đã dùng:</span> -{reward.pointsRequired}</p>
            <p><span className="font-semibold">Điểm còn lại:</span> {data.remainingPoints}</p>
            <p className="mt-2 italic text-[#e0f7fa]">Kiểm tra mã của bạn trong mục "Voucher Đã Đổi"</p>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: 'linear-gradient(to right, #4ade80, #1e88e5)',
            color: 'white',
            fontSize: '14px',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }
        }
      );
      
      setUserPoints(data.remainingPoints);
      fetchRewards();
      fetchHistory();
      fetchVouchers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra khi đổi ưu đãi';
      const reward = rewards.find(r => r._id === rewardId);
      
      // Thông báo lỗi nâng cao
      let displayMessage;
      if (errorMessage === 'Bạn đã đổi ưu đãi này rồi') {
        displayMessage = (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaTicketAlt className="text-2xl text-[#d32f2f]" />
              <h3 className="font-bold text-lg">Không Thể Đổi Ưu Đãi</h3>
            </div>
            <div className="border-t border-white/30 pt-2">
              <p>Bạn đã đổi ưu đãi "<strong>{reward?.name}</strong>" rồi.</p>
              <p className="mt-2 italic text-[#f6f9fc]">Vui lòng kiểm tra mục "Voucher Đã Đổi" hoặc chọn ưu đãi khác.</p>
            </div>
          </div>
        );
      } else if (errorMessage === 'Không đủ điểm để đổi ưu đãi này') {
        displayMessage = (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaStar className="text-2xl text-[#d32f2f]" />
              <h3 className="font-bold text-lg">Không Đủ Điểm</h3>
            </div>
            <div className="border-t border-white/30 pt-2">
              <p><span className="font-semibold">Ưu đãi:</span> {reward?.name}</p>
              <p><span className="font-semibold">Điểm cần:</span> {reward?.pointsRequired}</p>
              <p><span className="font-semibold">Điểm hiện có:</span> {userPoints}</p>
              <p><span className="font-semibold">Còn thiếu:</span> {reward?.pointsRequired - userPoints} điểm</p>
              <p className="mt-2 italic text-[#f6f9fc]">Hãy tích thêm điểm qua các đơn đặt phòng!</p>
            </div>
          </div>
        );
      } else if (errorMessage === 'Cấp độ thành viên không đủ để đổi ưu đãi này') {
        displayMessage = (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaStar className="text-2xl text-[#d32f2f]" />
              <h3 className="font-bold text-lg">Cấp Độ Không Đủ</h3>
            </div>
            <div className="border-t border-white/30 pt-2">
              <p><span className="font-semibold">Ưu đãi:</span> {reward?.name}</p>
              <p><span className="font-semibold">Cấp độ yêu cầu:</span> {reward?.membershipLevel}</p>
              <p><span className="font-semibold">Cấp độ hiện tại:</span> {membershipLevel}</p>
              <p className="mt-2 italic text-[#f6f9fc]">Hãy tích điểm để nâng cấp thành viên!</p>
            </div>
          </div>
        );
      } else {
        displayMessage = (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaTicketAlt className="text-2xl text-[#d32f2f]" />
              <h3 className="font-bold text-lg">Lỗi Đổi Ưu Đãi</h3>
            </div>
            <div className="border-t border-white/30 pt-2">
              <p>{errorMessage}</p>
            </div>
          </div>
        );
      }

      toast.error(displayMessage, {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          background: 'linear-gradient(to right, #ef4444, #d32f2f)',
          color: 'white',
          fontSize: '14px',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        }
      });
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchHistory();
    fetchVouchers();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <h3>Đang tải thông tin ưu đãi...</h3>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-container">
      <h1 className="rewards-title">
        <FaGift className="icon" /> Ưu Đãi Thành Viên
      </h1>

      <div className="user-info-box">
        <p><FaStar className="icon star" /> Cấp độ: <strong>{membershipLevel}</strong></p>
        <p>💰 Điểm hiện có: <strong>{userPoints}</strong></p>
        <button className="voucher-toggle-btn" onClick={() => setShowVouchers(!showVouchers)}>
          <FaTicketAlt className="icon" />
          {showVouchers ? 'Ẩn Voucher' : 'Xem Voucher Đã Đổi'}
        </button>
      </div>

      {showVouchers && (
        <div className="voucher-section">
          <h2><FaTicketAlt className="icon blue" /> Voucher Đã Đổi</h2>
          {vouchers.length === 0 ? (
            <p>Chưa có voucher nào</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Mã Voucher</th>
                  <th>Tên Ưu Đãi</th>
                  <th>Hạn</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v._id}>
                    <td>{v.voucherCode}</td>
                    <td>{v.rewardId.name}</td>
                    <td>{new Date(v.expiryDate).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="rewards-grid">
        {rewards.map(reward => (
          <div className="reward-card" key={reward._id}>
            <h3>{reward.name}</h3>
            <p className="desc">{reward.description}</p>
            <p>Cấp độ: <span className="highlight">{reward.membershipLevel}</span></p>
            <p>Điểm cần: <span className="highlight green">{reward.pointsRequired}</span></p>
            <button
              onClick={() => handleRedeem(reward._id)}
              disabled={redeeming === reward._id || userPoints < reward.pointsRequired}
              className={`redeem-btn ${redeeming === reward._id || userPoints < reward.pointsRequired ? 'disabled' : ''}`}
              title={`Điểm hiện tại: ${userPoints}\nĐiểm cần: ${reward.pointsRequired}\n${reward.description}`}
            >
              {redeeming === reward._id ? 'Đang xử lý...' : '🎁 Đổi Ngay'}
            </button>
          </div>
        ))}
      </div>

      <div className="history-section">
        <h2><FaHistory className="icon blue" /> Lịch Sử Đổi Thưởng</h2>
        {history.length === 0 ? (
          <p>Chưa có giao dịch nào</p>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Mô tả</th>
                <th>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h._id}>
                  <td>{new Date(h.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{h.description || `Đổi ưu đãi: ${h.rewardId?.name || 'Không xác định'}`}</td>
                  <td className="red">{h.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Rewards;