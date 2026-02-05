// src/routes/reviews.js
const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/authMiddleware");
const {
  createReview,
  getUserReviews,
  getMyGivenReviews,
  getMyReceivedReviews,
  getTopRatedEditors,
  getReviewById,
  updateReview,
  deleteReview
} = require("../controllers/reviewController");

// Public routes
router.get("/top-editors", getTopRatedEditors);
router.get("/user/:userId", getUserReviews);
router.get("/:id", getReviewById);

// Protected routes
router.use(authRequired);
router.post("/", createReview);
router.get("/my/given", getMyGivenReviews);
router.get("/my/received", getMyReceivedReviews);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;
