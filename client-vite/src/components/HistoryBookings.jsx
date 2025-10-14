import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Modal, Button, Form, Alert } from "react-bootstrap";


function HistoryBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBooking, setEditBooking] = useState({
    checkin: "",
    checkout: "",
    adults: "",
    children: "",
  });
  const [editError, setEditError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(10); // Số đặt phòng mỗi trang
  const navigate = useNavigate();

  // Lấy email người dùng từ localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userEmail = userInfo?.email;

  // Hàm lấy danh sách đặt phòng
  const fetchBookings = async () => {
    if (!userEmail) {
      setError("Bạn cần đăng nhập để xem lịch sử đặt phòng.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/bookings?email=${userEmail}`);
      const userBookings = response.data.filter(
        (booking) => booking.email === userEmail
      );
      setBookings(userBookings);
      setFilteredBookings(userBookings);
      setCurrentPage(1); // Reset về trang đầu khi lấy dữ liệu mới
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Lỗi khi tải lịch sử đặt phòng. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách đặt phòng khi component mount
  useEffect(() => {
    fetchBookings();
  }, [userEmail]);

  // Xử lý lọc theo trạng thái
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(
        (booking) => booking.status === filterStatus
      );
      setFilteredBookings(filtered);
    }
    setCurrentPage(1); // Reset về trang đầu khi thay đổi bộ lọc
  }, [filterStatus, bookings]);

  // Tính toán dữ liệu phân trang
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  // Hàm chuyển trang
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Mở modal xác nhận hủy
  const handleOpenCancelModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCancelReason("");
    setCancelError(null);
    setShowCancelModal(true);
  };

  // Đóng modal xác nhận hủy
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedBookingId(null);
    setCancelReason("");
    setCancelError(null);
  };

  // Xử lý hủy đặt phòng
  // Xử lý hủy đặt phòng
  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy.");
      return;
    }

    try {
      setLoading(true);
      setCancelError(null);

      // 1. Hủy booking
      await axios.delete(`/api/bookings/${selectedBookingId}`);

      // 2. Gửi lý do hủy
      await axios.post(`/api/bookings/cancel-reason`, {
        bookingId: selectedBookingId,
        reason: cancelReason,
      });

      // 3. Refresh danh sách
      await fetchBookings();
      handleCloseCancelModal();
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
        "Lỗi khi hủy đặt phòng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };


  // Mở modal chỉnh sửa
  const handleOpenEditModal = (booking) => {
    const createdAt = new Date(booking.createdAt);
    const currentTime = new Date();
    const timeDiff = (currentTime - createdAt) / (1000 * 60); // Tính thời gian chênh lệch (phút)
    if (timeDiff > 60) {
      setEditError("Không thể chỉnh sửa đặt phòng vì đã quá 60 phút kể từ khi tạo.");
      return;
    }
    setSelectedBookingId(booking._id);
    setEditBooking({
      checkin: new Date(booking.checkin).toISOString().split("T")[0],
      checkout: new Date(booking.checkout).toISOString().split("T")[0],
      adults: booking.adults,
      children: booking.children,
    });
    setEditError(null);
    setShowEditModal(true);
  };

  // Đóng modal chỉnh sửa
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedBookingId(null);
    setEditBooking({ checkin: "", checkout: "", adults: "", children: "" });
    setEditError(null);
  };

  // Xử lý chỉnh sửa đặt phòng
  const handleEditBooking = async () => {
  try {
    setLoading(true);
    setEditError(null);

    // Convert dates to proper timezone
    const checkinDate = new Date(editBooking.checkin);
    const checkoutDate = new Date(editBooking.checkout);

    // Set hours for check-in and check-out
    checkinDate.setHours(0, 0, 0, 0);
    checkoutDate.setHours(23, 59, 59, 999);

    // Adjust for timezone offset
    const adjustedCheckin = new Date(checkinDate.getTime() - checkinDate.getTimezoneOffset() * 60000).toISOString();
    const adjustedCheckout = new Date(checkoutDate.getTime() - checkoutDate.getTimezoneOffset() * 60000).toISOString();

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime()) || checkinDate >= checkoutDate) {
      setEditError("Ngày nhận phòng và trả phòng không hợp lệ.");
      return;
    }
    if (!editBooking.adults || editBooking.adults < 1) {
      setEditError("Số người lớn phải lớn hơn 0.");
      return;
    }
    if (editBooking.children < 0) {
      setEditError("Số trẻ em không được âm.");
      return;
    }

    await axios.put(`/api/bookings/${selectedBookingId}/update`, {
      checkin: adjustedCheckin,
      checkout: adjustedCheckout,
      adults: Number(editBooking.adults),
      children: Number(editBooking.children),
    });

    await fetchBookings();
    handleCloseEditModal();
  } catch (err) {
    setEditError(
      err.response?.data?.message ||
      "Lỗi khi chỉnh sửa đặt phòng. Vui lòng thử lại."
    );
  } finally {
    setLoading(false);
  }
};

  // Xem lý do hủy
  const handleViewCancelReason = async (bookingId) => {
    try {
      const response = await axios.get(
        `/api/bookings/cancel-reason?bookingId=${bookingId}`
      );
      alert(`Lý do hủy: ${response.data.cancelReason}`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Lỗi khi lấy lý do hủy. Vui lòng thử lại."
      );
    }
  };

  if (!userEmail) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="alert alert-warning text-center">
          Bạn cần <Link to="/login">đăng nhập</Link> để xem lịch sử đặt phòng.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="container bookings-page mt-5">
      <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>

      {/* Bộ lọc trạng thái và nút làm mới */}
      <div className="filter-section mb-4 d-flex justify-content-between align-items-center">
        <div>
          <label htmlFor="statusFilter" className="me-2">
            Lọc theo trạng thái:
          </label>
          <select
            id="statusFilter"
            className="form-control d-inline-block w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="canceled">Đã hủy</option>
          </select>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchBookings}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      {/* Thông báo lỗi chỉnh sửa */}
      {editError && (
        <div className="alert alert-danger text-center">{editError}</div>
      )}

      {/* Bảng lịch sử đặt phòng */}
      {filteredBookings.length === 0 ? (
        <div className="alert alert-info text-center">
          {filterStatus === "all"
            ? "Bạn chưa có đặt phòng nào."
            : `Không có đặt phòng nào với trạng thái "${filterStatus === "pending"
              ? "Chờ xác nhận"
              : filterStatus === "confirmed"
                ? "Đã xác nhận"
                : "Đã hủy"
            }".`}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Tên khách sạn</th>
                  <th>Tên phòng</th>
                  <th>Ngày nhận phòng</th>
                  <th>Ngày trả phòng</th>
                  <th>Số người lớn</th>
                  <th>Số trẻ em</th>
                  <th>Loại phòng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.map((booking) => (
                  <tr key={booking._id}>
                  <td>{booking.hotelId?.name || booking.roomid?.hotelId?.name || "Không xác định"}</td>

                    <td>{booking.roomid?.name || "Không xác định"}</td>
                  <td>
      {new Date(new Date(booking.checkin).getTime() + new Date(booking.checkin).getTimezoneOffset() * 60000)
        .toLocaleDateString("vi-VN")}
    </td>
                  <td>
      {new Date(new Date(booking.checkout).getTime() + new Date(booking.checkout).getTimezoneOffset() * 60000)
        .toLocaleDateString("vi-VN")}
    </td>
                    <td>{booking.adults}</td>
                    <td>{booking.children}</td>
                    <td>{booking.roomType || "Không xác định"}</td>
                    <td>
                      <span
                        className={`badge ${booking.status === "confirmed"
                            ? "bg-success"
                            : booking.status === "pending"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                      >
                        {booking.status === "pending"
                          ? "Chờ xác nhận"
                          : booking.status === "confirmed"
                            ? "Đã xác nhận"
                            : "Đã hủy"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {booking.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOpenCancelModal(booking._id)}
                              disabled={loading}
                            >
                              Hủy
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenEditModal(booking)}
                              disabled={loading}
                            >
                              Chỉnh sửa
                            </button>
                          </>
                        ) : booking.status === "confirmed" ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenEditModal(booking)}
                            disabled={loading}
                          >
                            Chỉnh sửa
                          </button>
                        ) : (
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewCancelReason(booking._id)}
                          >
                            Xem lý do hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="pagination-section mt-4 d-flex justify-content-center align-items-center">
              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-outline-primary btn-sm ms-2"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal xác nhận hủy */}
      <Modal show={showCancelModal} onHide={handleCloseCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy đặt phòng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelError && <Alert variant="danger">{cancelError}</Alert>}
          <p>Bạn có chắc chắn muốn hủy đặt phòng này?</p>
          <Form.Group controlId="cancelReason">
            <Form.Label>Lý do hủy (bắt buộc):</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy (ví dụ: Thay đổi kế hoạch)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCancelModal}>
            Đóng
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelBooking}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Hủy đặt phòng"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal chỉnh sửa đặt phòng */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa đặt phòng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Form>
            <Form.Group controlId="checkin">
              <Form.Label>Ngày nhận phòng:</Form.Label>
              <Form.Control
                type="date"
                value={editBooking.checkin}
                onChange={(e) =>
                  setEditBooking({ ...editBooking, checkin: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="checkout" className="mt-3">
              <Form.Label>Ngày trả phòng:</Form.Label>
              <Form.Control
                type="date"
                value={editBooking.checkout}
                onChange={(e) =>
                  setEditBooking({ ...editBooking, checkout: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group controlId="adults" className="mt-3">
              <Form.Label>Số người lớn:</Form.Label>
              <Form.Control
                type="number"
                value={editBooking.adults}
                onChange={(e) =>
                  setEditBooking({ ...editBooking, adults: e.target.value })
                }
                min="1"
              />
            </Form.Group>
            <Form.Group controlId="children" className="mt-3">
              <Form.Label>Số trẻ em:</Form.Label>
              <Form.Control
                type="number"
                value={editBooking.children}
                onChange={(e) =>
                  setEditBooking({ ...editBooking, children: e.target.value })
                }
                min="0"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleEditBooking}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Lưu thay đổi"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default HistoryBookings;