import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Input, Select, Modal } from 'antd';

const { Option } = Select;

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [reviewToToggle, setReviewToToggle] = useState(null);
  const [toggleAction, setToggleAction] = useState(''); // 'hide' or 'show'
  const navigate = useNavigate();

  // --- LOGIC (Không thay đổi) ---
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
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const handleFilterInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const showToggleConfirm = (reviewId, isVisible) => {
    setReviewToToggle(reviewId);
    setToggleAction(isVisible ? 'hide' : 'show');
    setToggleModalVisible(true);
  };

  const handleToggleOk = async () => {
    if (reviewToToggle) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const response = await axios.patch(`/api/reviews/${reviewToToggle}/toggle-hidden`, {}, config);
        toast.success(response.data.message);
        fetchReviews();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái hiển thị');
      }
    }
    setToggleModalVisible(false);
    setReviewToToggle(null);
    setToggleAction('');
  };

  const handleToggleCancel = () => {
    setToggleModalVisible(false);
    setReviewToToggle(null);
    setToggleAction('');
  };

  const showDeleteConfirm = (reviewId) => {
    setReviewToDelete(reviewId);
    setDeleteModalVisible(true);
  };

  const handleDeleteOk = async () => {
    if (reviewToDelete) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const response = await axios.delete(`/api/reviews/${reviewToDelete}`, config);
        toast.success(response.data.message);
        fetchReviews();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh giá');
      }
    }
    setDeleteModalVisible(false);
    setReviewToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setReviewToDelete(null);
  };

  // --- GIAO DIỆN ---

  const getStatusBadge = (review) => {
    if (review.isDeleted) {
      return <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">Đã xóa</p>;
    }
    if (review.isVisible) {
      return <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">Hiển thị</p>;
    }
    return <p className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-600">Đã ẩn</p>;
  };
  
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ));
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Quản lý Đánh giá</h2>
        <nav>
          <ol className="flex items-center gap-2">
            <li><Link to="/admin/dashboard" className="font-medium">Dashboard /</Link></li>
            <li className="font-medium text-blue-600">Reviews</li>
          </ol>
        </nav>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white px-5 pt-6 pb-4 shadow-sm sm:px-7.5">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-6">
          <Input
            name="hotelId"
            value={filters.hotelId}
            onChange={handleFilterInputChange}
            placeholder="Tìm theo ID khách sạn..."
            prefix={<Search className="text-gray-400" size={16} />}
            className="w-full md:w-1/3 mb-2 md:mb-0"
          />
          <Input
            name="email"
            value={filters.email}
            onChange={handleFilterInputChange}
            placeholder="Tìm theo email..."
            prefix={<Search className="text-gray-400" size={16} />}
            className="w-full md:w-1/3 mb-2 md:mb-0"
          />
          <Select
            value={filters.status}
            onChange={handleStatusFilterChange}
            style={{ width: '100%' }}
            className="md:w-1/3"
          >
            <Option value="active">Đang hoạt động</Option>
            <Option value="hidden">Đã ẩn</Option>
            <Option value="deleted">Đã xóa</Option>
            <Option value="all">Tất cả</Option>
          </Select>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-4 px-4 font-medium text-slate-800">Người dùng</th>
                <th className="py-4 px-4 font-medium text-slate-800">Khách sạn / Phòng</th>
                <th className="py-4 px-4 font-medium text-slate-800">Đánh giá</th>
                <th className="py-4 px-4 font-medium text-slate-800">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-slate-800 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <p className="font-medium text-slate-800">{review.userName}</p>
                    <p className="text-sm text-gray-500">{review.email}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <p className="font-medium text-slate-800">{review.hotelId?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{review.roomId?.name || 'N/A'}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <div className="flex items-center">{renderStars(review.rating)}</div>
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    {getStatusBadge(review)}
                  </td>
                  <td className="border-b border-gray-200 py-5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Icon button: Ẩn/Hiện */}
                      <button
                        onClick={() => showToggleConfirm(review._id, review.isVisible)}
                        disabled={review.isDeleted}
                        className={`p-2 rounded-lg transition-colors ${
                          review.isVisible
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={review.isVisible ? 'Ẩn đánh giá' : 'Hiển thị đánh giá'}
                      >
                        {review.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      
                      {/* Icon button: Xóa */}
                      <button
                        onClick={() => showDeleteConfirm(review._id)}
                        disabled={review.isDeleted}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa đánh giá"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Trang {filters.page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={`Xác nhận ${toggleAction === 'hide' ? 'ẩn' : 'hiển thị'}`}
        open={toggleModalVisible}
        onOk={handleToggleOk}
        onCancel={handleToggleCancel}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>Bạn có chắc muốn {toggleAction === 'hide' ? 'ẩn' : 'hiển thị'} đánh giá này?</p>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={deleteModalVisible}
        onOk={handleDeleteOk}
        onCancel={handleDeleteCancel}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc muốn xóa đánh giá này?</p>
      </Modal>
    </div>
  );
};

export default ReviewManagement;