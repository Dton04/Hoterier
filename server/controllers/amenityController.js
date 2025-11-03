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

exports.getAmenities = (req, res) => {
  res.json(defaultAmenities);
};