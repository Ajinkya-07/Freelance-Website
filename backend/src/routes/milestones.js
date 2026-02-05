// src/routes/milestones.js
const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/authMiddleware");
const {
  getProjectMilestones,
  createMilestone,
  createDefaultMilestones,
  getMilestoneById,
  updateMilestone,
  completeMilestone,
  deleteMilestone,
  getOverdueMilestones,
  getUpcomingMilestones,
  reorderMilestones
} = require("../controllers/milestoneController");

// All routes require authentication
router.use(authRequired);

// User's milestone overview
router.get("/overdue", getOverdueMilestones);
router.get("/upcoming", getUpcomingMilestones);

// Project-specific milestone routes
router.get("/project/:projectId", getProjectMilestones);
router.post("/project/:projectId", createMilestone);
router.post("/project/:projectId/defaults", createDefaultMilestones);
router.put("/project/:projectId/reorder", reorderMilestones);

// Individual milestone routes
router.get("/:id", getMilestoneById);
router.put("/:id", updateMilestone);
router.post("/:id/complete", completeMilestone);
router.delete("/:id", deleteMilestone);

module.exports = router;
