import React, { useEffect, useState } from "react";
import { Card, Rate, Input, Button, List, message, Select, Spin, Empty } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";

const { TextArea } = Input;
const { Option } = Select;

const Review = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [paidBookings, setPaidBookings] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);

  const user = useSelector((state) => state.loginUserReducer.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy danh sách đặt phòng đã thanh toán và xác nhận
        const bookingsResponse = await axios.get(`/api/bookings`, {
          params: {
            email: user.email,
            status: "confirmed"
          }
        });

        const confirmedAndPaidBookings = bookingsResponse.data.filter(
          (b) => b.paymentStatus === "paid" && b.status === "confirmed"
        );

        setBookings(bookingsResponse.data);
        setPaidBookings(confirmedAndPaidBookings);

        // Lấy các đánh giá hiện có
        const reviewsResponse = await axios.get(`/api/reviews/by-email`, {
          params: { email: user.email }
        });
        setReviews(reviewsResponse.data);

      } catch (error) {
        message.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!selectedHotel || rating === 0) {
      return message.warning("Vui lòng chọn khách sạn và đánh giá sao");
    }

    if (!comment.trim()) {
      return message.warning("Vui lòng chia sẻ trải nghiệm của bạn");
    }

    try {
      setSubmitting(true);
      await axios.post(
        "/api/reviews",
        {
          hotelId: selectedHotel,
          rating,
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );


      message.success("Đánh giá thành công!");

      // Reset form
      setRating(0);
      setComment("");
      setSelectedHotel(null);

      // Refresh reviews
      const reviewsResponse = await axios.get(`/api/reviews/by-email`, {
        params: { email: user.email }
      });
      setReviews(reviewsResponse.data);
    } catch (err) {
      if (err.response?.status === 403) {
        message.error("Bạn cần đặt phòng và thanh toán trước khi đánh giá");
      } else {
        message.error(err.response?.data?.message || "Lỗi khi gửi đánh giá");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null; // Sẽ redirect sang trang login
  }

  return (
    <div className="review-page" style={{ maxWidth: 800, margin: "24px auto", padding: "0 16px" }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Form viết đánh giá */}
          <Card
            title={<h2 style={{ margin: 0 }}>Viết đánh giá khách sạn</h2>}
            style={{ marginBottom: 24 }}
          >
            {paidBookings.length > 0 ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ marginBottom: 8, fontWeight: 500 }}>Chọn khách sạn bạn đã trải nghiệm:</p>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Chọn khách sạn"
                    value={selectedHotel}
                    onChange={setSelectedHotel}
                    disabled={submitting}
                  >
                    {paidBookings.map((b) => {
                      const reviewExists = reviews.some(r => r.hotelId?._id === b.hotelId?._id);
                      return (
                        <Option
                          key={b._id}
                          value={b.hotelId?._id}
                          disabled={reviewExists}
                        >
                          {b.hotelId?.name || "Khách sạn"} - {b.roomType}
                          {reviewExists ? " (Đã đánh giá)" : ""}
                        </Option>
                      );
                    })}
                  </Select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ marginBottom: 8, fontWeight: 500 }}>Đánh giá của bạn:</p>
                  <Rate
                    value={rating}
                    onChange={setRating}
                    disabled={submitting}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ marginBottom: 8, fontWeight: 500 }}>Chia sẻ trải nghiệm:</p>
                  <TextArea
                    rows={4}
                    placeholder="Hãy chia sẻ những điều bạn thích về khách sạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  block
                >
                  Gửi đánh giá
                </Button>
              </>
            ) : (
              <Empty
                description={
                  <span>
                    Bạn chưa có đơn đặt phòng nào đã hoàn thành.
                    <br />
                    Hãy đặt phòng và trải nghiệm dịch vụ của chúng tôi!
                  </span>
                }
              />
            )}
          </Card>

          {/* Danh sách đánh giá */}
          <Card
            title={<h2 style={{ margin: 0 }}>Đánh giá của bạn</h2>}
            style={{ marginBottom: 24 }}
          >
            <List
              itemLayout="vertical"
              dataSource={reviews}
              locale={{
                emptyText: <Empty description="Bạn chưa có đánh giá nào" />
              }}
              renderItem={(review) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        {review.hotelId?.name || "Khách sạn"}
                      </div>
                    }
                    description={
                      <div>
                        <Rate disabled value={review.rating} />
                        <div style={{ color: "#8c8c8c", fontSize: "12px", marginTop: 4 }}>
                          Đánh giá vào: {moment(review.createdAt).locale("vi").format("DD/MM/YYYY HH:mm")}
                        </div>
                      </div>
                    }
                  />
                  <div style={{ whiteSpace: "pre-wrap" }}>{review.comment}</div>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default Review;
