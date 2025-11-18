const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { protect, admin } = require('../middleware/auth');

// Admin routes
router.get('/admin/list', protect, admin, notificationsController.getAdminNotifications);
router.post('/admin/send', protect, admin, notificationsController.sendNotification);

// User routes
router.get('/feed', protect, notificationsController.getUserNotifications);
router.get('/public/latest', notificationsController.getLatestPublicNotification);

module.exports = router;