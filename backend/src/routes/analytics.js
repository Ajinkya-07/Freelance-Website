// src/routes/analytics.js
const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/authMiddleware");
const {
  getPlatformOverview,
  getUserGrowth,
  getJobStats,
  getProjectStats,
  getEditorLeaderboard,
  getMyStats,
  getRevenueStats,
  getCategoryBreakdown
} = require("../controllers/analyticsController");

// Public routes
router.get("/editor-leaderboard", getEditorLeaderboard);
router.get("/category-breakdown", getCategoryBreakdown);

// Protected routes (require authentication)
router.use(authRequired);
router.get("/overview", getPlatformOverview);
router.get("/user-growth", getUserGrowth);
router.get("/job-stats", getJobStats);
router.get("/project-stats", getProjectStats);
router.get("/my-stats", getMyStats);
router.get("/revenue", getRevenueStats);

module.exports = router;
