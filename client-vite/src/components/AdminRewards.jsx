import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminRewards() {
  const [rewards, setRewards] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    membershipLevel: 'Bronze',
    pointsRequired: 0,
    voucherCode: '',
  });
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const response = await axios.get('/api/rewards/admin', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setRewards(response.data.rewards);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách ưu đãi:', error);
        setError('Không thể tải danh sách ưu đãi');
      }
    };
    fetchRewards();
  }, []);

  const handleCreate = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.post('/api/rewards', formData, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      alert('Tạo ưu đãi thành công');
      setFormData({
        name: '',
        description: '',
        membershipLevel: 'Bronze',
        pointsRequired: 0,
        voucherCode: '',
      });
      const response = await axios.get('/api/rewards/admin', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setRewards(response.data.rewards);
    } catch (error) {
      console.error('Lỗi khi tạo ưu đãi:', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể tạo ưu đãi'));
    }
  };

  const handleEdit = (reward) => {
    setFormData({
      name: reward.name,
      description: reward.description,
      membershipLevel: reward.membershipLevel,
      pointsRequired: reward.pointsRequired,
      voucherCode: reward.voucherCode,
    });
    setEditId(reward._id);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`/api/rewards/${editId}`, formData, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      alert('Cập nhật ưu đãi thành công');
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        membershipLevel: 'Bronze',
        pointsRequired: 0,
        voucherCode: '',
      });
      setEditId(null);
      const response = await axios.get('/api/rewards/admin', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setRewards(response.data.rewards);
    } catch (error) {
      console.error('Lỗi khi cập nhật ưu đãi:', error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể cập nhật ưu đãi'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ưu đãi này?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        await axios.delete(`/api/rewards/${id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        alert('Xóa ưu đãi thành công');
        setRewards(rewards.filter((reward) => reward._id !== id));
      } catch (error) {
        console.error('Lỗi khi xóa ưu đãi:', error);
        alert('Lỗi: ' + (error.response?.data?.message || 'Không thể xóa ưu đãi'));
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      description: '',
      membershipLevel: 'Bronze',
      pointsRequired: 0,
      voucherCode: '',
    });
    setEditId(null);
  };

  return (
    <div className="admin-rewards">
      <h2>Quản lý ưu đãi</h2>
      {error && <div className="error">{error}</div>}

      {/* Form tạo ưu đãi mới */}
      <div className="form-container">
        <h3>Tạo ưu đãi mới</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Tên ưu đãi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <select
              value={formData.membershipLevel}
              onChange={(e) => setFormData({ ...formData, membershipLevel: e.target.value })}
            >
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="number"
              placeholder="Điểm yêu cầu"
              value={formData.pointsRequired}
              onChange={(e) => setFormData({ ...formData, pointsRequired: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Mã voucher"
              value={formData.voucherCode}
              onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value })}
            />
          </div>
          <button type="submit">Tạo</button>
        </form>
      </div>

      {/* Danh sách ưu đãi */}
      <div className="rewards-list">
        <h3>Danh sách ưu đãi</h3>
        {rewards.length === 0 ? (
          <p>Chưa có ưu đãi nào</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Cấp độ</th>
                <th>Điểm yêu cầu</th>
                <th>Mã voucher</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward) => (
                <tr key={reward._id}>
                  <td>{reward.name}</td>
                  <td>{reward.description}</td>
                  <td>{reward.membershipLevel}</td>
                  <td>{reward.pointsRequired}</td>
                  <td>{reward.voucherCode}</td>
                  <td>
                    <button onClick={() => handleEdit(reward)}>Chỉnh sửa</button>
                    <button onClick={() => handleDelete(reward._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal chỉnh sửa ưu đãi */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Chỉnh sửa ưu đãi</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Tên ưu đãi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <select
                  value={formData.membershipLevel}
                  onChange={(e) => setFormData({ ...formData, membershipLevel: e.target.value })}
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Điểm yêu cầu"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({ ...formData, pointsRequired: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Mã voucher"
                  value={formData.voucherCode}
                  onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value })}
                />
              </div>
              <div className="modal-buttons">
                <button type="submit">Cập nhật</button>
                <button type="button" onClick={closeModal}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRewards;