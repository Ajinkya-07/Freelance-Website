// src/controllers/reviewController.js
const Review = require("../models/Review");
const { asyncHandler } = require("../middleware/errorHandler");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors");

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         reviewer_id:
 *           type: integer
 *         reviewee_id:
 *           type: integer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *         comment:
 *           type: string
 *         category:
 *           type: string
 *           enum: [general, communication, quality, timeliness, professionalism]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - revieweeId
 *               - rating
 *             properties:
 *               projectId:
 *                 type: integer
 *               revieweeId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               category:
 *                 type: string
 */
const createReview = asyncHandler(async (req, res) => {
  const { projectId, revieweeId, rating, title, comment, category } = req.body;
  const reviewerId = req.user.id;

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new ValidationError("Rating must be between 1 and 5");
  }

  // Check if user can review (has completed project with reviewee)
  const canReview = Review.canReview(reviewerId, revieweeId, projectId);
  if (!canReview) {
    throw new ForbiddenError("You can only review users you have completed projects with");
  }

  // Check if already reviewed
  const existingReview = Review.findByProjectAndReviewer(projectId, reviewerId);
  if (existingReview) {
    throw new ValidationError("You have already reviewed this project");
  }

  const result = Review.create({
    projectId,
    reviewerId,
    revieweeId,
    rating,
    title,
    comment,
    category
  });

  const review = Review.findById(result.id);

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    review
  });
});

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get all reviews for a user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 */
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0, minRating } = req.query;

  const reviews = Review.findByUserId(userId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    minRating: minRating ? parseInt(minRating) : null
  });

  const stats = Review.getUserStats(userId);
  const categoryStats = Review.getCategoryStats(userId);

  res.json({
    success: true,
    stats,
    categoryStats,
    count: reviews.length,
    reviews
  });
});

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get reviews given by the current user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
const getMyGivenReviews = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const reviews = Review.findByReviewerId(req.user.id, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    count: reviews.length,
    reviews
  });
});

/**
 * @swagger
 * /api/reviews/my-received:
 *   get:
 *     summary: Get reviews received by the current user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
const getMyReceivedReviews = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const reviews = Review.findByUserId(req.user.id, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const stats = Review.getUserStats(req.user.id);
  const categoryStats = Review.getCategoryStats(req.user.id);

  res.json({
    success: true,
    stats,
    categoryStats,
    count: reviews.length,
    reviews
  });
});

/**
 * @swagger
 * /api/reviews/top-editors:
 *   get:
 *     summary: Get top rated editors
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 */
const getTopRatedEditors = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const editors = Review.getTopRatedEditors(parseInt(limit));

  res.json({
    success: true,
    count: editors.length,
    editors
  });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Reviews]
 */
const getReviewById = asyncHandler(async (req, res) => {
  const review = Review.findById(req.params.id);
  
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  res.json({
    success: true,
    review
  });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const review = Review.findById(id);
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.reviewer_id !== req.user.id) {
    throw new ForbiddenError("You can only update your own reviews");
  }

  if (rating && (rating < 1 || rating > 5)) {
    throw new ValidationError("Rating must be between 1 and 5");
  }

  Review.update(id, { rating, title, comment });

  const updatedReview = Review.findById(id);

  res.json({
    success: true,
    message: "Review updated successfully",
    review: updatedReview
  });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = Review.findById(id);
  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') {
    throw new ForbiddenError("You can only delete your own reviews");
  }

  Review.delete(id);

  res.json({
    success: true,
    message: "Review deleted successfully"
  });
});

module.exports = {
  createReview,
  getUserReviews,
  getMyGivenReviews,
  getMyReceivedReviews,
  getTopRatedEditors,
  getReviewById,
  updateReview,
  deleteReview
};
