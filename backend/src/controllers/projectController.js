const Proposal = require("../models/Proposal");
const Job = require("../models/Job");
const Project = require("../models/Project");
const ProjectActivity = require("../models/ProjectActivity");
const Milestone = require("../models/Milestone");
const { asyncHandler } = require("../middleware/errorHandler");
const { NotFoundError, ForbiddenError, ValidationError } = require("../utils/errors");

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
  return project.client_id === userId ? 'client' : 'editor';
};

/**
 * Log project activity
 */
const logActivity = (projectId, userId, activityType, description, metadata = {}) => {
  try {
    ProjectActivity.create({ projectId, userId, activityType, description, metadata });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ===============================
// ACCEPT PROPOSAL → CREATE PROJECT
// ===============================
const acceptProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;

  const proposal = Proposal.findById(proposalId);
  if (!proposal) {
    throw new NotFoundError("Proposal not found");
  }

  const job = Job.findById(proposal.job_id);
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (req.user.id !== job.client_id) {
    throw new ForbiddenError("Only the job owner can accept proposals");
  }

  const project = Project.create({
    jobId: job.id,
    clientId: job.client_id,
    editorId: proposal.editor_id,
    escrowAmount: proposal.price,
  });

  // Log project creation activity
  logActivity(project.id, req.user.id, 'project_created', 
    `Project created for job "${job.title}"`, 
    { jobId: job.id, proposalId, escrowAmount: proposal.price }
  );

  // Create default milestones
  try {
    Milestone.createDefaultMilestones(project.id);
    logActivity(project.id, req.user.id, 'milestone_added', 
      'Default milestones created', { count: 5 }
    );
  } catch (err) {
    console.error('Failed to create default milestones:', err);
  }

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    project,
  });
});

// ===============================
// GET MY PROJECTS
// ===============================
const getMyProjects = asyncHandler(async (req, res) => {
  const { status, sortBy, sortOrder, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const projects = Project.search({
    userId: req.user.id,
    status,
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset
  });

  // Add progress to each project
  const projectsWithProgress = projects.map(p => ({
    ...p,
    progress: Project.getProgress(p.id)
  }));

  res.json({
    success: true,
    count: projects.length,
    projects: projectsWithProgress
  });
});

// ===============================
// GET PROJECT BY ID
// ===============================
const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const project = Project.findById(projectId);
  
  checkProjectAccess(project, req.user.id);

  const stats = Project.getStats(projectId);
  const progress = Project.getProgress(projectId);
  const allowedTransitions = Project.getAllowedTransitions(project.status);

  res.json({
    success: true,
    project: {
      ...project,
      progress,
      stats: {
        milestones: stats.milestones,
        files: stats.files,
        activityCount: stats.activityCount
      },
      allowedTransitions
    }
  });
});

// ===============================
// UPDATE PROJECT STATUS
// ===============================
/**
 * @swagger
 * /api/projects/{id}/status:
 *   put:
 *     summary: Update project status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const project = Project.findById(id);
  const role = checkProjectAccess(project, req.user.id);

  if (!Project.VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status. Valid statuses: ${Project.VALID_STATUSES.join(', ')}`);
  }

  if (!Project.canTransition(project.status, status)) {
    throw new ValidationError(
      `Cannot transition from "${project.status}" to "${status}". ` +
      `Allowed transitions: ${Project.getAllowedTransitions(project.status).join(', ') || 'none'}`
    );
  }

  const oldStatus = project.status;
  const updatedProject = Project.updateStatus(id, status);

  logActivity(id, req.user.id, 'status_changed', 
    `Status changed from "${oldStatus}" to "${status}"`,
    { oldStatus, newStatus: status, notes, changedBy: role }
  );

  res.json({
    success: true,
    message: `Project status updated to "${status}"`,
    project: updatedProject,
    allowedTransitions: Project.getAllowedTransitions(status)
  });
});

// ===============================
// SUBMIT FOR REVIEW (Editor)
// ===============================
/**
 * @swagger
 * /api/projects/{id}/submit-for-review:
 *   post:
 *     summary: Submit project for client review
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const submitForReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const project = Project.findById(id);
  checkProjectAccess(project, req.user.id);

  if (project.editor_id !== req.user.id) {
    throw new ForbiddenError("Only the editor can submit for review");
  }

  if (!Project.canTransition(project.status, 'under_review')) {
    throw new ValidationError(`Cannot submit for review from current status "${project.status}"`);
  }

  const updatedProject = Project.submitForReview(id);

  logActivity(id, req.user.id, 'status_changed',
    'Project submitted for client review',
    { oldStatus: project.status, newStatus: 'under_review', message }
  );

  res.json({
    success: true,
    message: "Project submitted for review",
    project: updatedProject
  });
});

// ===============================
// REQUEST REVISION (Client)
// ===============================
/**
 * @swagger
 * /api/projects/{id}/request-revision:
 *   post:
 *     summary: Request revision from editor
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const requestRevision = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const project = Project.findById(id);
  checkProjectAccess(project, req.user.id);

  if (project.client_id !== req.user.id) {
    throw new ForbiddenError("Only the client can request revisions");
  }

  if (project.status !== 'under_review') {
    throw new ValidationError("Can only request revision when project is under review");
  }

  const updatedProject = Project.requestRevision(id, notes);

  logActivity(id, req.user.id, 'status_changed',
    'Revision requested by client',
    { oldStatus: 'under_review', newStatus: 'revision_requested', notes }
  );

  res.json({
    success: true,
    message: "Revision requested",
    project: updatedProject
  });
});

// ===============================
// COMPLETE PROJECT (Client)
// ===============================
/**
 * @swagger
 * /api/projects/{id}/complete:
 *   post:
 *     summary: Mark project as complete
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const completeProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  const project = Project.findById(id);
  checkProjectAccess(project, req.user.id);

  if (project.client_id !== req.user.id) {
    throw new ForbiddenError("Only the client can mark the project as complete");
  }

  // Allow completion from under_review or revision_requested status
  if (project.status !== 'under_review' && project.status !== 'revision_requested') {
    throw new ValidationError("Can only complete project when it is under review or revision requested");
  }

  const updatedProject = Project.complete(id);

  logActivity(id, req.user.id, 'project_completed',
    'Project marked as complete by client',
    { feedback, completedAt: new Date().toISOString() }
  );

  res.json({
    success: true,
    message: "Project completed successfully! 🎉",
    project: updatedProject
  });
});

// ===============================
// CANCEL PROJECT
// ===============================
/**
 * @swagger
 * /api/projects/{id}/cancel:
 *   post:
 *     summary: Cancel project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const cancelProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const project = Project.findById(id);
  const role = checkProjectAccess(project, req.user.id);

  if (project.status === 'completed' || project.status === 'cancelled') {
    throw new ValidationError(`Cannot cancel a project that is already ${project.status}`);
  }

  const updatedProject = Project.cancel(id, reason);

  logActivity(id, req.user.id, 'project_cancelled',
    `Project cancelled by ${role}`,
    { reason, cancelledBy: role, previousStatus: project.status }
  );

  res.json({
    success: true,
    message: "Project cancelled",
    project: updatedProject
  });
});

// ===============================
// PUT PROJECT ON HOLD
// ===============================
/**
 * @swagger
 * /api/projects/{id}/hold:
 *   post:
 *     summary: Put project on hold
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const putOnHold = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const project = Project.findById(id);
  const role = checkProjectAccess(project, req.user.id);

  if (!Project.canTransition(project.status, 'on_hold')) {
    throw new ValidationError(`Cannot put project on hold from status "${project.status}"`);
  }

  const updatedProject = Project.putOnHold(id, reason);

  logActivity(id, req.user.id, 'status_changed',
    `Project put on hold by ${role}`,
    { oldStatus: project.status, newStatus: 'on_hold', reason }
  );

  res.json({
    success: true,
    message: "Project put on hold",
    project: updatedProject
  });
});

// ===============================
// RESUME PROJECT
// ===============================
/**
 * @swagger
 * /api/projects/{id}/resume:
 *   post:
 *     summary: Resume project from hold
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const resumeProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = Project.findById(id);
  const role = checkProjectAccess(project, req.user.id);

  if (project.status !== 'on_hold') {
    throw new ValidationError("Can only resume a project that is on hold");
  }

  const updatedProject = Project.resume(id);

  logActivity(id, req.user.id, 'status_changed',
    `Project resumed by ${role}`,
    { oldStatus: 'on_hold', newStatus: 'in_progress' }
  );

  res.json({
    success: true,
    message: "Project resumed",
    project: updatedProject
  });
});

// ===============================
// GET PROJECT ACTIVITY
// ===============================
/**
 * @swagger
 * /api/projects/{id}/activity:
 *   get:
 *     summary: Get project activity log
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const getProjectActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0, type } = req.query;

  const project = Project.findById(id);
  checkProjectAccess(project, req.user.id);

  let activities;
  if (type) {
    activities = ProjectActivity.findByType(id, type);
  } else {
    activities = ProjectActivity.findByProjectId(id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  const summary = ProjectActivity.getProjectSummary(id);

  res.json({
    success: true,
    summary,
    count: activities.length,
    activities
  });
});

// ===============================
// GET MY RECENT ACTIVITY
// ===============================
/**
 * @swagger
 * /api/projects/activity/recent:
 *   get:
 *     summary: Get recent activity across all user's projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const getMyRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const activities = ProjectActivity.findByUserId(req.user.id, {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    count: activities.length,
    activities
  });
});

// ===============================
// GET PROJECT PROGRESS
// ===============================
/**
 * @swagger
 * /api/projects/{id}/progress:
 *   get:
 *     summary: Get project progress details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
const getProjectProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = Project.findById(id);
  checkProjectAccess(project, req.user.id);

  const progress = Project.getProgress(id);
  const stats = Project.getStats(id);
  const milestones = Milestone.findByProjectId(id);

  res.json({
    success: true,
    progress,
    milestones,
    stats: {
      files: stats.files,
      activityCount: stats.activityCount
    }
  });
});

module.exports = {
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
  logActivity  // Export for use in other controllers
};