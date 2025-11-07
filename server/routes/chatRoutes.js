const express = require('express');
const router = express.Router();
const { protect, adminOrStaff } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  cb(null, allowedTypes.includes(file.mimetype));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/conversations', protect, chatController.createConversation);
router.get('/conversations', protect, chatController.listConversations);
router.post('/conversations/:id/join', protect, chatController.joinConversation);

router.get('/conversations/:id/messages', protect, chatController.getMessages);
router.post('/conversations/:id/messages', protect, chatController.sendMessage);
router.post('/conversations/:id/messages/image', protect, upload.single('image'), chatController.sendImageMessage);

// chỉ admin hoặc staff được gán staff
router.patch('/conversations/:id/assign-staff', protect, adminOrStaff, chatController.assignStaff);

module.exports = router;