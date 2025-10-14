import React, { useState, useEffect } from "react";
import axios from "axios";
import { Rate, Input, Select, Button, Alert, Spin } from "antd";

const { Option } = Select;
const { TextArea } = Input;

const RatingForm = ({ hotels, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    userName: "",
    rating: 0,
    comment: "",
    userEmail: "",
  });
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [ratingError, setRatingError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (selectedHotel) {
      const fetchRooms = async () => {
        try {
          setFormLoading(true);
          const response = await axios.get(`/api/hotels/${selectedHotel}/rooms`);
          const roomsData = response.data.rooms || response.data || [];
          if (Array.isArray(roomsData)) {
            setRooms(roomsData);
          } else {
            console.warn("Dữ liệu phòng không phải là mảng:", roomsData);
            setRooms([]);
          }
        } catch (error) {
          console.error("Lỗi khi lấy danh sách phòng:", error);
          setRatingError("Không thể tải danh sách phòng. Vui lòng thử lại!");
          setRooms([]);
        } finally {
          setFormLoading(false);
        }
      };
      fetchRooms();
    } else {
      setRooms([]);
      setSelectedRoom(null);
    }
  }, [selectedHotel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRatingChange = (value) => {
    setFormData({ ...formData, rating: value });
  };

  const handleHotelChange = (value) => {
    setSelectedHotel(value);
    setSelectedRoom(null);
  };

  const handleRoomChange = (value) => {
    setSelectedRoom(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setRatingError(null);

      if (!selectedHotel) {
        setRatingError("Vui lòng chọn một khách sạn để đánh giá!");
        return;
      }

      if (!formData.userEmail) {
        setRatingError("Vui lòng nhập email đã dùng để đặt phòng.");
        return;
      }

      const ratingValue = parseInt(formData.rating, 10);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setRatingError("Điểm đánh giá phải từ 1 đến 5!");
        return;
      }

      if (!formData.comment || formData.comment.trim() === "") {
        setRatingError("Bình luận không được để trống!");
        return;
      }

      const hotel = hotels.find((h) => h._id === selectedHotel);
      if (!hotel) {
        setRatingError("Không tìm thấy khách sạn được chọn!");
        return;
      }

      let roomIds = hotel.rooms || [];
      if (selectedRoom) {
        roomIds = [selectedRoom];
      }

      const bookingCheckResponse = await axios.get(`/api/bookings/check`, {
  params: {
    email: formData.userEmail.toLowerCase(),
    roomId: selectedRoom || undefined, // truyền roomId trực tiếp
  },
});


      if (
        !bookingCheckResponse.data.hasBooked ||
        bookingCheckResponse.data.paymentStatus !== "paid" ||
        bookingCheckResponse.data.booking.status !== "confirmed"
      ) {
        setRatingError(
          "Bạn phải có đặt phòng đã thanh toán thành công tại khách sạn này để gửi đánh giá."
        );
        return;
      }

      const reviewData = {
        hotelId: selectedHotel,
        roomId: selectedRoom || null,
        userName: formData.userName || "Ẩn danh",
        rating: ratingValue,
        comment: formData.comment,
        email: formData.userEmail.toLowerCase(),
      };

      console.log("Gửi dữ liệu đánh giá:", reviewData);

      await onSubmit(reviewData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.";
      setRatingError(errorMessage);
      console.error("Lỗi khi gửi đánh giá:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="rating-form">
      <h3>Gửi đánh giá của bạn</h3>
      {ratingError && (
        <Alert
          message={ratingError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Khách sạn:</label>
          <Select
            placeholder="Chọn khách sạn"
            value={selectedHotel}
            onChange={handleHotelChange}
            style={{ width: "100%" }}
          >
            {hotels.map((hotel) => (
              <Option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Phòng (tùy chọn):</label>
          <Select
            placeholder="Chọn phòng"
            value={selectedRoom}
            onChange={handleRoomChange}
            style={{ width: "100%" }}
            disabled={!selectedHotel || formLoading}
            notFoundContent={formLoading ? <Spin size="small" /> : "Không có phòng nào"}
          >
            {rooms.map((room) => (
              <Option key={room._id} value={room._id}>
                {room.name} ({room.type})
              </Option>
            ))}
          </Select>
        </div>
        <div className="form-group">
          <label>Tên của bạn (tùy chọn):</label>
          <Input
            name="userName"
            value={formData.userName}
            onChange={handleInputChange}
            placeholder="Nhập tên hoặc để trống để ẩn danh"
          />
        </div>
        <div className="form-group">
          <label>Email của bạn:</label>
          <Input
            name="userEmail"
            value={formData.userEmail}
            onChange={handleInputChange}
            placeholder="Nhập email đã dùng để đặt phòng"
            type="email"
          />
        </div>
        <div className="form-group">
          <label>Điểm đánh giá:</label>
          <Rate value={formData.rating} onChange={handleRatingChange} />
        </div>
        <div className="form-group">
          <label>Bình luận:</label>
          <TextArea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Chia sẻ trải nghiệm của bạn"
            rows={4}
          />
        </div>
        <div className="form-actions">
          <Button type="primary" htmlType="submit" loading={formLoading}>
            Gửi đánh giá
          </Button>
          <Button onClick={onCancel} style={{ marginLeft: 8 }}>
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;