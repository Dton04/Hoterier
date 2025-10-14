const express = require("express");
const router = express.Router();
const { protect } = require('../middleware/auth');

const reviewController = require('../controllers/reviewController')
// POST /api/reviews
router.post("/", protect, reviewController.createReview);

// GET /api/reviews
router.get("/", reviewController.getReviews);

// GET /api/reviews/average
router.get("/average", reviewController.getAverageRating);

// GET /api/reviews/by-email
router.get("/by-email", reviewController.getReviewsByEmail);

// PATCH /api/reviews/:id/toggle-hidden
router.patch("/:id/toggle-hidden", protect, reviewController.toggleReviewVisibility);

// DELETE /api/reviews/:id
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
