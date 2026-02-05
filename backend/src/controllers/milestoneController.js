// src/controllers/milestoneController.js
const Milestone = require("../models/Milestone");
const Project = require("../models/Project");
const { asyncHandler } = require("../middleware/errorHandler");
const { NotFoundError, ForbiddenError, ValidationError } = require("../utils/errors");

// Helper to log activity (lazy import to avoid circular dependency)
const logMilestoneActivity = (projectId, userId, activityType, description, metadata = {}) => {
  try {
    const ProjectActivity = require("../models/ProjectActivity");
    ProjectActivity.create({ projectId, userId, activityType, description, metadata });
  } catch (err) {
    console.error('Failed to log milestone activity:', err);
  }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Milestone:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         project_id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *         due_date:
 *           type: string
 *           format: date
 *         display_order:
 *           type: integer
 *         completed_at:
 *           type: string
 *           format: date-time
 */

/**
 * Helper to check project access
 */
const checkProjectAccess = (project, userId) => {
  if (!project) {
    throw new NotFoundError("Project not found");
  }
  if (project.client_id !== userId && project.editor_id !== userId) {
    throw new ForbiddenError("You don't have access to this project");
  }
};

/**
 * @swagger
 * /api/milestones/project/{projectId}:
 *   get:
 *     summary: Get all milestones for a project
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const getProjectMilestones = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = Project.findById(projectId);
  checkProjectAccess(project, req.user.id);

  const milestones = Milestone.findByProjectId(projectId);
  const progress = Milestone.getProjectProgress(projectId);

  res.json({
    success: true,
    progress,
    count: milestones.length,
    milestones
  });
});

/**
 * @swagger
 * /api/milestones/project/{projectId}:
 *   post:
 *     summary: Create a new milestone
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const createMilestone = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, dueDate, order } = req.body;

  const project = Project.findById(projectId);
  checkProjectAccess(project, req.user.id);

  if (!title) {
    throw new ValidationError("Title is required");
  }

  const result = Milestone.create({
    projectId: parseInt(projectId),
    title,
    description,
    dueDate,
    order
  });

  const milestone = Milestone.findById(result.id);

  // Log activity
  logMilestoneActivity(parseInt(projectId), req.user.id, 'milestone_added',
    `Milestone added: ${title}`,
    { milestoneId: result.id, title }
  );

  res.status(201).json({
    success: true,
    message: "Milestone created successfully",
    milestone
  });
});

/**
 * @swagger
 * /api/milestones/project/{projectId}/defaults:
 *   post:
 *     summary: Create default milestones for a project
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const createDefaultMilestones = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = Project.findById(projectId);
  checkProjectAccess(project, req.user.id);

  // Check if milestones already exist
  const existing = Milestone.findByProjectId(projectId);
  if (existing.length > 0) {
    throw new ValidationError("Project already has milestones");
  }

  Milestone.createDefaultMilestones(parseInt(projectId));
  const milestones = Milestone.findByProjectId(projectId);

  res.status(201).json({
    success: true,
    message: "Default milestones created successfully",
    count: milestones.length,
    milestones
  });
});

/**
 * @swagger
 * /api/milestones/{id}:
 *   get:
 *     summary: Get milestone by ID
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const getMilestoneById = asyncHandler(async (req, res) => {
  const milestone = Milestone.findById(req.params.id);
  
  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  const project = Project.findById(milestone.project_id);
  checkProjectAccess(project, req.user.id);

  res.json({
    success: true,
    milestone
  });
});

/**
 * @swagger
 * /api/milestones/{id}:
 *   put:
 *     summary: Update a milestone
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const updateMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, order, status } = req.body;

  const milestone = Milestone.findById(id);
  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  const project = Project.findById(milestone.project_id);
  checkProjectAccess(project, req.user.id);

  Milestone.update(id, { title, description, dueDate, order, status });
  const updatedMilestone = Milestone.findById(id);

  res.json({
    success: true,
    message: "Milestone updated successfully",
    milestone: updatedMilestone
  });
});

/**
 * @swagger
 * /api/milestones/{id}/complete:
 *   post:
 *     summary: Mark milestone as complete
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const completeMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const milestone = Milestone.findById(id);
  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  const project = Project.findById(milestone.project_id);
  checkProjectAccess(project, req.user.id);

  Milestone.complete(id);
  const updatedMilestone = Milestone.findById(id);
  const progress = Milestone.getProjectProgress(milestone.project_id);

  // Log activity
  logMilestoneActivity(milestone.project_id, req.user.id, 'milestone_completed',
    `Milestone completed: ${milestone.title}`,
    { milestoneId: id, title: milestone.title, progress }
  );

  res.json({
    success: true,
    message: "Milestone completed",
    milestone: updatedMilestone,
    projectProgress: progress
  });
});

/**
 * @swagger
 * /api/milestones/{id}:
 *   delete:
 *     summary: Delete a milestone
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const deleteMilestone = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const milestone = Milestone.findById(id);
  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  const project = Project.findById(milestone.project_id);
  checkProjectAccess(project, req.user.id);

  Milestone.delete(id);

  res.json({
    success: true,
    message: "Milestone deleted successfully"
  });
});

/**
 * @swagger
 * /api/milestones/overdue:
 *   get:
 *     summary: Get overdue milestones for current user
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const getOverdueMilestones = asyncHandler(async (req, res) => {
  const milestones = Milestone.getOverdueMilestones(req.user.id);

  res.json({
    success: true,
    count: milestones.length,
    milestones
  });
});

/**
 * @swagger
 * /api/milestones/upcoming:
 *   get:
 *     summary: Get upcoming milestones for current user
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const getUpcomingMilestones = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const milestones = Milestone.getUpcomingMilestones(req.user.id, parseInt(days));

  res.json({
    success: true,
    count: milestones.length,
    milestones
  });
});

/**
 * @swagger
 * /api/milestones/project/{projectId}/reorder:
 *   put:
 *     summary: Reorder milestones in a project
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
const reorderMilestones = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { orders } = req.body; // Array of { id, order }

  const project = Project.findById(projectId);
  checkProjectAccess(project, req.user.id);

  if (!Array.isArray(orders)) {
    throw new ValidationError("Orders must be an array");
  }

  Milestone.reorder(parseInt(projectId), orders);
  const milestones = Milestone.findByProjectId(projectId);

  res.json({
    success: true,
    message: "Milestones reordered successfully",
    milestones
  });
});

module.exports = {
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
};
