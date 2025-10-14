// Room.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Carousel, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Rating from "react-rating";
import ReviewChart from "./ReviewChart";
import SuggestionCard from "./SuggestionCard";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Room({ room }) {
  const [show, setShow] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false); // Trạng thái yêu thích
  const reviewsPerPage = 5;
  const navigate = useNavigate();

  // Kiểm tra vai trò người dùng
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const isAdminOrStaff = userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff');

  const handleClose = () => setShow(false);
  const handleImageClick = async () => {
    setShow(true);
    setReviewPage(1);
    await Promise.all([fetchReviews(), fetchSuggestions()]);
  };

  const handleBooking = () => {
    navigate(`/book/${room._id}`);
  };

  const handleViewAllReviews = () => {
    navigate(`/testimonial?hotelId=${room.hotelId}&roomId=${room._id}`);
  };

  // Kiểm tra phòng có trong danh sách yêu thích
  const checkFavoriteStatus = async () => {
    if (!userInfo || !userInfo.token) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const response = await axios.get('/api/favorites', config);
      const isFav = response.data.some((favRoom) => favRoom._id.toString() === room._id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
    }
  };

  // Thêm/xóa phòng khỏi danh sách yêu thích
  const toggleFavorite = async () => {
    if (!userInfo || !userInfo.token) {
      toast.error('Vui lòng đăng nhập để thêm phòng vào danh sách yêu thích');
      navigate('/login');
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      if (isFavorite) {
        await axios.delete(`/api/favorites/${room._id}`, config);
        toast.success('Đã xóa phòng khỏi danh sách yêu thích');
        setIsFavorite(false);
      } else {
        await axios.post('/api/favorites', { roomId: room._id }, config);
        toast.success('Đã thêm phòng vào danh sách yêu thích');
        setIsFavorite(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật danh sách yêu thích');
    }
  };

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const config = {
        params: { 
          hotelId: room.hotelId, 
          roomId: room._id, 
          limit: 50,
          status: isAdminOrStaff ? undefined : "active"
        },
      };
      if (isAdminOrStaff) {
        config.headers = { Authorization: `Bearer ${userInfo.token}` };
      }
      const response = await axios.get("/api/reviews", config);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error("Lỗi khi lấy đánh giá:", error);
      toast.error(error.response?.data?.message || 'Không thể tải đánh giá');
    } finally {
      setLoadingReviews(false);
    }
  };

  const toggleReviewVisibility = async (reviewId, isVisible) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const response = await axios.patch(`/api/reviews/${reviewId}/toggle-hidden`, {}, config);
      toast.success(response.data.message);
      fetchReviews();
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái hiển thị:', error);
      toast.error(error.response?.data?.message || 'Không thể thay đổi trạng thái hiển thị');
    }
  };

  useEffect(() => {
    fetchReviews();
    checkFavoriteStatus();
  }, [room._id, room.hotelId]);

  const fetchSuggestions = async () => {
    if (room.availabilityStatus !== "available") {
      try {
        setLoadingSuggestions(true);
        const response = await axios.get("/api/rooms/suggestions", {
          params: { roomId: room._id, roomType: room.type },
        });
        setSuggestions(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy phòng gợi ý:", {
          message: error.message,
          response: error.response?.data,
        });
      } finally {
        setLoadingSuggestions(false);
      }
    }
  };

  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const response = await axios.get("/api/reviews/average", {
          params: { hotelId: room.hotelId },
        });
        setAverageRating(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy điểm đánh giá trung bình:", {
          message: error.message,
          response: error.response?.data,
        });
        setAverageRating({ average: 0, totalReviews: 0 });
      }
    };

    fetchAverageRating();
  }, [room.hotelId]);

  const getRoomStatus = () => {
    switch (room.availabilityStatus) {
      case "maintenance":
        return {
          variant: "warning",
          message: "Phòng đang bảo trì",
          bookable: false,
        };
      case "busy":
        return {
          variant: "danger",
          message: "Phòng đã hết",
          bookable: false,
        };
      case "available":
        return {
          variant: "success",
          message: "Còn phòng",
          bookable: true,
        };
      default:
        return {
          variant: "success",
          message: "Còn phòng",
          bookable: true,
        };
    }
  };

  const status = getRoomStatus();

  const totalReviewPages = Math.ceil(reviews.length / reviewsPerPage);
  const displayedReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  );

  return (
    <div className="room-card">
      <div className="room-image" onClick={handleImageClick} style={{ cursor: "pointer" }}>
        <img
          src={room.imageurls?.[0] || "/images/default-room.jpg"}
          alt={room.name}
          className="img-fluid"
          onError={(e) => {
            e.target.src = "/images/default-room.jpg";
          }}
        />
        <div className="room-badge">{room.type}</div>
        <div className="room-price-tag">{formatPriceVND(room.rentperday)}</div>
        <Alert variant={status.variant} className="room-status-alert">
          {status.message}
        </Alert>
        <Button
          variant={isFavorite ? "danger" : "outline-primary"}
          className="favorite-btn"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click ảnh
            toggleFavorite();
          }}
        >
          <i className={isFavorite ? "fas fa-heart" : "far fa-heart"}></i>
        </Button>
      </div>

      <div className="room-content">
        <h3 className="room-title">{room.name}</h3>
        <div className="room-features">
          <span>
            <i className="fas fa-bed"></i> {room.beds || "3"} Giường
          </span>
          <span>
            <i className="fas fa-bath"></i> {room.baths || "1"} Phòng tắm
          </span>
          <span>
            <i className="fas fa-wifi"></i> WiFi
          </span>
        </div>
        <p className="room-description">
          {room.description?.substring(0, 100) ||
            "Erat Ipsum justo amet duo et elit dolor, est duo duo eos lorem sed diam atet diam sed siet lorem."}
          ...
        </p>
        <div className="room-footer">
     
          <div className="room-actions">
            <button
              className="btn-book"
              onClick={handleBooking}
              disabled={!status.bookable}
            >
              Đặt ngay
            </button>
          </div>
        </div>
      </div>

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{room.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel fade indicators={false}>
            {room.imageurls.map((url, index) => (
              <Carousel.Item key={index}>
                <img
                  className="d-block w-100"
                  src={url}
                  alt={`slide-${index}`}
                  style={{ height: "400px", objectFit: "cover" }}
                />
              </Carousel.Item>
            ))}
          </Carousel>
          <div className="room-modal-content">
            <div className="room-highlights">
              <div>
                <i className="fas fa-bed"></i> {room.beds || "3"} Giường
              </div>
              <div>
                <i className="fas fa-bath"></i> {room.baths || "2"} Phòng tắm
              </div>
              <div>
                <i className="fas fa-wifi"></i> WiFi
              </div>
              <div>
                <i className="fas fa-users"></i> Tối đa: {room.maxcount} người
              </div>
            </div>
            <div className="room-modal-description">
              <h5>Mô tả</h5>
              <p>{room.description || "Không có mô tả chi tiết."}</p>
            </div>
            <div className="room-modal-price">
              <h5>Giá phòng</h5>
              <div className="price">
                {formatPriceVND(room.rentperday)} <span>/ đêm</span>
              </div>
            </div>
            <div className="room-modal-status">
              <h5>Trạng thái phòng</h5>
              <Alert variant={status.variant}>{status.message}</Alert>
            </div>
            <div className="room-reviews">
              <h5>Đánh giá ({averageRating.totalReviews})</h5>
              <ReviewChart hotelId={room.hotelId} />
              {loadingReviews ? (
                <p>Đang tải đánh giá...</p>
              ) : reviews.length > 0 ? (
                <>
                  <div className="review-list">
                    {displayedReviews.map((review) => (
                      <div key={review._id} className="review-item" style={{ borderBottom: "1px solid #ddd", padding: "10px 0" }}>
                        <div className="review-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <Rating
                              readonly
                              initialRating={review.rating}
                              emptySymbol={<i className="far fa-star"></i>}
                              fullSymbol={<i className="fas fa-star"></i>}
                            />
                            <span style={{ marginLeft: "10px" }}>{review.userName || "Khách ẩn danh"}</span>
                          </div>
                          <span style={{ fontSize: "0.9em", color: "#666" }}>
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <p className="review-text">{review.comment}</p>
                        {review.image && (
                          <div className="review-image-container">
                            <img
                              src={review.image}
                              alt="Review"
                              className="review-image"
                              style={{ maxWidth: "200px", marginTop: "10px" }}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/400";
                              }}
                            />
                          </div>
                        )}
                        {isAdminOrStaff && (
                          <div className="review-actions" style={{ marginTop: "10px" }}>
                            <Button
                              variant={review.isVisible ? "warning" : "success"}
                              size="sm"
                              onClick={() => toggleReviewVisibility(review._id, review.isVisible)}
                            >
                              {review.isVisible ? "Ẩn" : "Hiển Thị"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {reviews.length > reviewsPerPage && (
                    <div className="review-pagination" style={{ display: "flex", justifyContent: "center", marginTop: "15px" }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reviewPage === 1}
                        style={{ marginRight: "10px" }}
                      >
                        Trước
                      </Button>
                      <span style={{ alignSelf: "center" }}>
                        Trang {reviewPage} / {totalReviewPages}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setReviewPage((prev) => Math.min(prev + 1, totalReviewPages))}
                        disabled={reviewPage === totalReviewPages}
                        style={{ marginLeft: "10px" }}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                  {averageRating.totalReviews > reviewsPerPage && (
                    <div style={{ textAlign: "center", marginTop: "15px" }}>
                      <Button
                        variant="link"
                        onClick={handleViewAllReviews}
                      >
                        Xem tất cả {averageRating.totalReviews} đánh giá
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p>Chưa có đánh giá nào cho phòng này.</p>
              )}
            </div>
            {room.availabilityStatus !== "available" && (
              <div className="room-suggestions">
                <h5>Phòng tương tự</h5>
                {loadingSuggestions ? (
                  <p>Đang tải phòng gợi ý...</p>
                ) : suggestions.length > 0 ? (
                  <Carousel indicators={false} controls={true} interval={null}>
                    {suggestions.reduce((acc, suggestion, index) => {
                      if (index % 2 === 0) {
                        acc.push(
                          <Carousel.Item key={index}>
                            <div className="d-flex justify-content-center">
                              <SuggestionCard room={suggestions[index]} />
                              {suggestions[index + 1] && (
                                <SuggestionCard room={suggestions[index + 1]} />
                              )}
                            </div>
                          </Carousel.Item>
                        );
                      }
                      return acc;
                    }, [])}
                  </Carousel>
                ) : (
                  <p>Không tìm thấy phòng tương tự.</p>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleBooking}
            disabled={!status.bookable}
          >
            Đặt phòng ngay
          </Button>
          <Button
            variant={isFavorite ? "danger" : "outline-primary"}
            onClick={toggleFavorite}
          >
            {isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Room;