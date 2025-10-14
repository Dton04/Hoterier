import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import axios from "axios";
import {
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
  Form,
  InputGroup,
  Dropdown,
  Pagination,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaFilter } from "react-icons/fa";


function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) {
          throw new Error("Bạn cần đăng nhập để xem danh sách đặt phòng");
        }

        const response = await axios.get("/api/bookings", {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        setBookings(response.data);
        setFilteredBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err.response?.data, err.message);
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  // Lọc và tìm kiếm
  useEffect(() => {
    let result = bookings;
    if (statusFilter !== "all") {
      result = result.filter((booking) => booking.status === statusFilter);
    }
    if (searchTerm) {
      result = result.filter(
        (booking) =>
          booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredBookings(result);
    setCurrentPage(1); // Reset về trang đầu khi lọc
  }, [searchTerm, statusFilter, bookings]);

  // Phân trang
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const handleConfirm = async (bookingId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        throw new Error("Bạn cần đăng nhập để thực hiện hành động này");
      }

      await axios.put(
        `/api/bookings/${bookingId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "confirmed" }
            : booking
        )
      );
    } catch (err) {
      console.error("Error confirming booking:", err.response?.data, err.message);
      setError(err.response?.data?.message || "Lỗi khi xác nhận đặt phòng");
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        throw new Error("Bạn cần đăng nhập để thực hiện hành động này");
      }

      const response = await axios.delete(`/api/bookings/${bookingId}`, { // SỬA: Thay PUT thành DELETE
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        data: { cancelReason: "Hủy bởi admin" }, // Gửi body trong DELETE (nếu server hỗ trợ)
      });

      // Cập nhật state dựa trên response từ server
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "canceled", cancelDate: new Date() }
            : booking
        )
      );
      setError(null); // Xóa lỗi nếu hủy thành công
    } catch (err) {
      console.error("Error canceling booking:", err.response?.data, err.message);
      setError(
        err.response?.data?.message ||
        err.response?.status === 400
          ? "Không thể hủy đặt phòng: " + err.response?.data?.message
          : "Lỗi khi hủy đặt phòng"
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Chờ xác nhận</Badge>;
      case "confirmed":
        return <Badge bg="success">Đã xác nhận</Badge>;
      case "canceled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  return (
    <section className="admin-bookings">
      <Banner />
      <div className="container">
        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="filter-section">
          <InputGroup className="mb-3 search-bar">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Dropdown className="status-filter">
            <Dropdown.Toggle variant="outline-primary">
              <FaFilter /> {statusFilter === "all" ? "Tất cả trạng thái" : statusFilter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setStatusFilter("all")}>
                Tất cả trạng thái
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter("pending")}>
                Chờ xác nhận
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter("confirmed")}>
                Đã xác nhận
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter("canceled")}>
                Đã hủy
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Trạng thái tải */}
        {loading ? (
          <div className="loading">
            <Spinner animation="border" variant="primary" />
            <span>Đang tải danh sách đặt phòng...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Alert variant="info">Không có đặt phòng nào trong hệ thống.</Alert>
        ) : (
          <>
            {/* Bảng dữ liệu */}
            <Table striped bordered hover responsive className="bookings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách sạn</th>

                  <th>Khách hàng</th>
                  <th>Ngày nhận phòng</th>
                  <th>Ngày trả phòng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.map((booking, index) => (
                  <tr key={booking._id}>
                    <td>{indexOfFirstBooking + index + 1}</td>
                   <td>{booking.hotelId?.name || booking.roomid?.hotelId?.name || "Không xác định"}</td>
                    <td>
                      {booking.name} <br />
                      <small>{booking.email}</small>
                    </td>
                    <td>
                      {new Date(booking.checkin).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      {new Date(booking.checkout).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      {booking.status === "pending" && (
                        <div className="action-buttons">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConfirm(booking._id)}
                            className="me-2"
                          >
                            Xác nhận
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancel(booking._id)}
                          >
                            Hủy
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Phân trang */}
            <Pagination className="justify-content-center">
              <Pagination.Prev
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages).keys()].map((page) => (
                <Pagination.Item
                  key={page + 1}
                  active={page + 1 === currentPage}
                  onClick={() => setCurrentPage(page + 1)}
                >
                  {page + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </>
        )}
      </div>
    </section>
  );
}

export default AdminBookings;