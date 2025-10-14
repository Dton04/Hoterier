import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    hotelId: '',
    email: '',
    status: 'active',
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);

  // Lấy danh sách đánh giá
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const params = {
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status,
      };

      const response = await axios.get('/api/reviews', { params, ...config });
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  // Chuyển trang
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Bật/tắt hiển thị đánh giá
  const toggleVisibility = async (reviewId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const response = await axios.patch(`/api/reviews/${reviewId}/toggle-hidden`, {}, config);
      toast.success(response.data.message);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái hiển thị');
    }
  };

  // Xóa mềm đánh giá
  const deleteReview = async (reviewId) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const response = await axios.delete(`/api/reviews/${reviewId}`, config);
        toast.success(response.data.message);
        fetchReviews();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh giá');
      }
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">Quản lý đánh giá</h2>
      {error && <div className="error-alert">{error}</div>}

      {/* Form lọc */}
      <div className="filter-form">
        <div className="form-group">
          <label htmlFor="hotelId">ID khách sạn</label>
          <input
            type="text"
            id="hotelId"
            name="hotelId"
            value={filters.hotelId}
            onChange={handleFilterChange}
            placeholder="Nhập ID khách sạn"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="Nhập email"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Trạng thái</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-select"
          >
            <option value="active">Đang hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="deleted">Đã xóa</option>
            <option value="all">Tất cả</option>
          </select>
        </div>
      </div>

      {/* Bảng đánh giá */}
      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="review-table">
              <thead>
                <tr>
                  <th>Khách sạn</th>
                  <th>Phòng</th>
                  <th>Người dùng</th>
                  <th className="text-center">Điểm</th>
                  <th>Bình luận</th>
                  <th>Email</th>
                  <th>Ngày</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id} className="table-row">
                    <td>{review.hotelId?.name || 'N/A'}</td>
                    <td>{review.roomId?.name || 'N/A'}</td>
                    <td>{review.userName}</td>
                    <td className="text-center">{review.rating}</td>
                    <td>{review.comment}</td>
                    <td>{review.email}</td>
                    <td>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="text-center">
                      <span
                        className={`status-badge ${
                          review.isDeleted
                            ? 'status-deleted'
                            : review.isVisible
                            ? 'status-visible'
                            : 'status-hidden'
                        }`}
                      >
                        {review.isDeleted
                          ? 'Đã xóa'
                          : review.isVisible
                          ? 'Hiển thị'
                          : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="text-center action-buttons">
                      <button
                        className={`action-btn ${
                          review.isVisible ? 'btn-warning' : 'btn-success'
                        } ${review.isDeleted ? 'btn-disabled' : ''}`}
                        onClick={() => toggleVisibility(review._id)}
                        disabled={review.isDeleted}
                      >
                        {review.isVisible ? 'Ẩn' : 'Hiển thị'}
                      </button>
                      <button
                        className={`action-btn btn-danger ${
                          review.isDeleted ? 'btn-disabled' : ''
                        }`}
                        onClick={() => deleteReview(review._id)}
                        disabled={review.isDeleted}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="pagination">
            <button
              className={`pagination-btn ${filters.page === 1 ? 'btn-disabled' : ''}`}
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              Trang trước
            </button>
            <span className="pagination-info">Trang {filters.page} / {totalPages}</span>
            <button
              className={`pagination-btn ${filters.page === totalPages ? 'btn-disabled' : ''}`}
              disabled={filters.page === totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewManagement;