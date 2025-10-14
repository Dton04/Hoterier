// usersRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { protect, admin, staff } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const usersController = require('../controllers/usersController');
const User = require('../models/user');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
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

// Middleware kiểm tra admin hoặc staff
const adminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin or staff' });
  }
};

// Cấu hình Passport cho Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  // Giữ nguyên logic này vì nó là setup, không phải handler
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        await user.save();
      } else {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          role: 'user',
          isAdmin: false,
          isDeleted: false
        });
        await user.save();
      }
    }
    if (user.isDeleted) {
      return done(null, false, { message: 'Tài khoản của bạn đã bị xóa' });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Cấu hình Passport cho Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_REDIRECT_URI,
  profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
  // Giữ nguyên logic này
  try {
    let user = await User.findOne({ facebookId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.emails?.[0]?.value });
      if (user) {
        user.facebookId = profile.id;
        await user.save();
      } else {
        user = new User({
          name: profile.displayName,
          email: profile.emails?.[0]?.value?.toLowerCase() || `${profile.id}@facebook.com`,
          facebookId: profile.id,
          role: 'user',
          isAdmin: false,
          isDeleted: false
        });
        await user.save();
      }
    }
    if (user.isDeleted) {
      return done(null, false, { message: 'Tài khoản của bạn đã bị xóa' });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize và deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.post('/google/send-otp', usersController.sendGoogleOTP);
router.post('/verify-otp', usersController.verifyOTP);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3000/login?error=Google authentication failed' }), usersController.googleCallback);
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: 'http://localhost:3000/login?error=Facebook authentication failed' }), usersController.facebookCallback);
router.get('/points', protect, usersController.getPoints);
router.get('/:id/points/history', protect, usersController.getPointsHistory);
router.get('/membership/level/:userId', usersController.getMembershipLevel);
router.post('/points/accumulate', protect, usersController.accumulatePoints);
router.put('/:id', protect, admin, usersController.updateUser);
router.post('/staff', protect, admin, usersController.createStaff);
router.get('/staff', protect, admin, usersController.getStaff);
router.put('/staff/:id', protect, admin, usersController.updateStaff);
router.delete('/staff/:id', protect, adminOrStaff, usersController.deleteStaff);
router.get('/:id/bookings', protect, usersController.getUserBookings);
router.put('/:id/profile', protect, upload.single('avatar'), usersController.updateUserProfile);
router.get('/:id/profile', protect, usersController.getUserProfile);

router.put('/:id/password', protect, usersController.changePassword);
router.get('/:id/reviews', protect, usersController.getUserReviews);
router.get('/stats', protect, admin, usersController.getUserStats);
router.post('/ban', protect, admin, usersController.banUser);
router.patch('/:id/role', protect, admin, usersController.updateUserRole);
router.get('/recent', protect, adminOrStaff, usersController.getRecentUsers);
router.get('/frequent', protect, adminOrStaff, usersController.getFrequentUsers);
router.get('/search', protect, adminOrStaff, usersController.searchUsers);
router.get('/:id/notifications', protect, usersController.getNotifications);
router.post('/:id/notifications', protect, adminOrStaff, usersController.sendNotification);
router.post('/regions/assign-admin', protect, admin, usersController.assignRegionAdmin);
router.get('/membership/benefits/:userId', protect, usersController.getMembershipBenefits);




module.exports = router;