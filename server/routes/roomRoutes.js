// roomRoutes.js
const express = require("express");
const router = express.Router();
const { protect, admin, restrictRoomManagement } = require("../middleware/auth");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const roomController = require("../controllers/roomController"); // Assume controllers folder

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer với kiểm tra định dạng và kích thước
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPEG, PNG hoặc GIF'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// GET /api/rooms/getallrooms - Lấy tất cả phòng
router.get('/getallrooms', roomController.getAllRooms);

// POST /api/rooms/getroombyid - Lấy phòng theo ID
router.post("/getroombyid", roomController.getRoomById);

// POST /api/rooms - Tạo phòng mới (chỉ admin)
router.post("/", protect, restrictRoomManagement, roomController.createRoom);

//  PATCH /api/rooms/:id - Cập nhật phòng
router.patch("/:id", protect, restrictRoomManagement, roomController.updateRoom);

//  POST /api/rooms/:id/images - Tải ảnh phòng
router.post("/:id/images", protect, restrictRoomManagement, upload.array('images', 5), roomController.uploadRoomImages);

//  DELETE /api/rooms/:id/images/:imgId - Xóa ảnh phòng
router.delete("/:id/images/:imgId", protect, restrictRoomManagement, roomController.deleteRoomImage);

//  GET /api/rooms/images/:id - Lấy danh sách ảnh của phòng
router.get("/images/:id", roomController.getRoomImages);
// DELETE /api/rooms/:id  - Xóa phòng
router.delete("/:id", roomController.deleteRoom);

module.exports = router;