import React, { useState, useEffect } from "react";
import axios from "axios";
import { Rate, Input, Select, Button, Alert, Spin, Divider } from "antd";

const { Option } = Select;
const { TextArea } = Input;

const RatingForm = ({ hotels, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    rating: 0,
    comment: "",
    criteriaRatings: {
      cleanliness: 0,
      comfort: 0,
      staff: 0,
      location: 0,
      facilities: 0,
      value: 0,
    },
  });

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [ratingError, setRatingError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  /** 🏨 Khi chọn khách sạn -> lấy danh sách phòng */
  useEffect(() => {
    if (selectedHotel) {
      const fetchRooms = async () => {
        try {
          setFormLoading(true);
          const res = await axios.get(`/api/hotels/${selectedHotel}/rooms`);
          const roomsData = res.data.rooms || res.data || [];
          setRooms(Array.isArray(roomsData) ? roomsData : []);
        } catch (err) {
          console.error("Lỗi khi lấy phòng:", err);
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

  /** ✏️ Nhập text */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /** ⭐ Đánh giá tổng thể */
  const handleRatingChange = (value) => {
    setFormData({ ...formData, rating: value });
  };

  /** 🔢 Đánh giá từng tiêu chí */
  const handleCriteriaChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      criteriaRatings: { ...prev.criteriaRatings, [key]: value },
    }));
  };

  /** 🧾 Gửi đánh giá */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setRatingError(null);

      if (!selectedHotel) return setRatingError("Vui lòng chọn khách sạn!");
      if (!formData.userEmail)
        return setRatingError("Vui lòng nhập email đã dùng để đặt phòng!");
      if (!formData.comment.trim())
        return setRatingError("Vui lòng nhập bình luận!");

      const ratingValue = parseInt(formData.rating, 10);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5)
        return setRatingError("Điểm tổng thể phải từ 1 đến 5!");

      // ✅ Kiểm tra booking tồn tại & thanh toán thành công
      const check = await axios.get(`/api/bookings/check`, {
        params: {
          email: formData.userEmail.toLowerCase(),
          roomId: selectedRoom || undefined,
        },
      });

      if (
        !check.data.hasBooked ||
        check.data.paymentStatus !== "paid" ||
        check.data.booking.status !== "confirmed"
      ) {
        setRatingError(
          "Bạn cần có đặt phòng đã thanh toán thành công để gửi đánh giá."
        );
        return;
      }

      // ✅ Gửi dữ liệu BE
      const reviewData = {
        hotelId: selectedHotel,
        roomId: selectedRoom || null,
        userName: formData.userName || "Ẩn danh",
        rating: ratingValue,
        comment: formData.comment,
        email: formData.userEmail.toLowerCase(),
        criteriaRatings: formData.criteriaRatings, // 🆕 gửi 6 tiêu chí
      };

      console.log("🟦 Gửi dữ liệu đánh giá:", reviewData);
      await onSubmit(reviewData);
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      setRatingError(
        err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá."
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="rating-form bg-white p-5 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold mb-4 text-[#003580]">
        Gửi đánh giá của bạn
      </h3>

      {ratingError && (
        <Alert
          message={ratingError}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit}>
        {/* Chọn khách sạn */}
        <div className="form-group mb-3">
          <label>Khách sạn:</label>
          <Select
            placeholder="Chọn khách sạn"
            value={selectedHotel}
            onChange={(v) => setSelectedHotel(v)}
            style={{ width: "100%" }}
          >
            {hotels.map((hotel) => (
              <Option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Chọn phòng */}
        <div className="form-group mb-3">
          <label>Phòng (tùy chọn):</label>
          <Select
            placeholder="Chọn phòng"
            value={selectedRoom}
            onChange={(v) => setSelectedRoom(v)}
            style={{ width: "100%" }}
            disabled={!selectedHotel || formLoading}
            notFoundContent={
              formLoading ? <Spin size="small" /> : "Không có phòng nào"
            }
          >
            {rooms.map((room) => (
              <Option key={room._id} value={room._id}>
                {room.name} ({room.type})
              </Option>
            ))}
          </Select>
        </div>

        {/* Thông tin người dùng */}
        <div className="form-group mb-3">
          <label>Tên của bạn (tùy chọn):</label>
          <Input
            name="userName"
            value={formData.userName}
            onChange={handleInputChange}
            placeholder="Nhập tên hoặc để trống để ẩn danh"
          />
        </div>

        <div className="form-group mb-3">
          <label>Email của bạn:</label>
          <Input
            name="userEmail"
            type="email"
            value={formData.userEmail}
            onChange={handleInputChange}
            placeholder="Nhập email đã dùng để đặt phòng"
          />
        </div>

        {/* Đánh giá chi tiết */}
        <Divider orientation="left">Đánh giá chi tiết</Divider>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {Object.entries({
            cleanliness: "Sạch sẽ",
            comfort: "Thoải mái",
            staff: "Nhân viên",
            location: "Địa điểm",
            facilities: "Tiện nghi",
            value: "Đáng giá tiền",
          }).map(([key, label]) => (
            <div key={key} className="flex justify-between items-center">
              <span>{label}</span>
              <Rate
                value={formData.criteriaRatings[key]}
                onChange={(v) => handleCriteriaChange(key, v)}
              />
            </div>
          ))}
        </div>

        {/* Tổng thể */}
        <Divider orientation="left">Đánh giá tổng thể</Divider>
        <Rate
          value={formData.rating}
          onChange={handleRatingChange}
          className="mb-3"
        />

        {/* Bình luận */}
        <div className="form-group mb-4">
          <TextArea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            rows={4}
          />
        </div>

        {/* Nút */}
        <div className="form-actions flex gap-3">
          <Button type="primary" htmlType="submit" loading={formLoading}>
            Gửi đánh giá
          </Button>
          <Button onClick={onCancel}>Hủy</Button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;
