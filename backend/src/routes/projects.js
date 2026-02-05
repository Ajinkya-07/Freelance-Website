const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const {
  acceptProposal,
  getMyProjects,
  getProjectById,
  updateProjectStatus,
  submitForReview,
  requestRevision,
  completeProject,
  cancelProject,
  getProjectActivity,
  getMyRecentActivity,
  getProjectProgress,
} = require("../controllers/projectController");

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Activity routes (must be before :id routes)
router.get("/activity/recent", getMyRecentActivity);

// Project list
router.get("/", getMyProjects);

// Create project from proposal
router.post("/accept/:proposalId", acceptProposal);

// Project details and management
router.get("/:id", getProjectById);
router.get("/:id/activity", getProjectActivity);
router.get("/:id/progress", getProjectProgress);

// Status management
router.put("/:id/status", updateProjectStatus);
router.post("/:id/submit-for-review", submitForReview);
router.post("/:id/request-revision", requestRevision);
router.post("/:id/complete", completeProject);
router.post("/:id/cancel", cancelProject);

module.exports = router;