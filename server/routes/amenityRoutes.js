const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');


const defaultAmenities = [
  "WiFi miễn phí",
  "Máy lạnh",
  "TV màn hình phẳng",
  "Ban công",
  "Phòng tắm riêng",
  "Bữa sáng miễn phí",
  "Máy sấy tóc",
  "Tủ lạnh nhỏ",
  "Két sắt",
  "Bồn tắm",
  "View thành phố",
  "Bàn làm việc",
  "Dịch vụ phòng",
  "Điều hòa nhiệt độ",
];

// GET /api/amenities
router.get('/', (req, res) => {
  res.json(defaultAmenities);
});

module.exports = router;
