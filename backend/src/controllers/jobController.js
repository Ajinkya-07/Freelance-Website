// src/controllers/jobController.js
const Job = require("../models/Job");
const Notification = require("../models/Notification");
const User = require("../models/User");

async function createJob(req, res) {
  try {
    const { title, description, duration_minutes, budget_min, budget_max, target_editor_id } =
      req.body;

    if (req.user.role !== "client") {
      return res.status(403).json({ error: "Only clients can post jobs" });
    }

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    if (title.length < 10) {
      return res
        .status(400)
        .json({ error: "Title must be at least 10 characters" });
    }

    if (description.length < 20) {
      return res
        .status(400)
        .json({ error: "Description must be at least 20 characters" });
    }

    // Check if this is a private job for a specific editor
    const isPrivate = !!target_editor_id;

    const newJob = Job.create({
      clientId: req.user.id,
      title,
      description,
      durationMinutes: duration_minutes || null,
      budgetMin: budget_min || null,
      budgetMax: budget_max || null,
      targetEditorId: target_editor_id || null,
      isPrivate
    });

    // If this is a private job, send notification to the target editor
    if (isPrivate && target_editor_id) {
      Notification.notifyJobInvitation(
        target_editor_id,
        newJob.id,
        title,
        req.user.name
      );
    }

    res.status(201).json({ success: true, job: newJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllJobs(req, res) {
  try {
    let jobs;
    
    // If user is an editor, show only public jobs + jobs targeted at them
    if (req.user && req.user.role === 'editor') {
      jobs = Job.findAllForEditor(req.user.id);
    } else if (req.user && req.user.role === 'client') {
      // Clients see public jobs + their own private jobs
      const allJobs = Job.findAll();
      jobs = allJobs.filter(j => !j.is_private || j.client_id === req.user.id);
    } else {
      // Anonymous or other roles - show public only
      jobs = Job.findAll().filter(j => !j.is_private);
    }
    
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search and filter jobs with pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title and description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, in_progress]
 *       - in: query
 *         name: budgetMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: budgetMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: durationMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: durationMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, budget_min, budget_max, duration_minutes, proposal_count]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
async function searchJobs(req, res) {
  try {
    const {
      q: query,
      status,
      budgetMin,
      budgetMax,
      durationMin,
      durationMax,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const searchParams = {
      query,
      status,
      budgetMin: budgetMin ? parseInt(budgetMin) : null,
      budgetMax: budgetMax ? parseInt(budgetMax) : null,
      durationMin: durationMin ? parseInt(durationMin) : null,
      durationMax: durationMax ? parseInt(durationMax) : null,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset
    };

    const jobs = Job.search(searchParams);
    const { total } = Job.searchCount(searchParams);
    const filterStats = Job.getFilterStats();

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      filterStats,
      count: jobs.length,
      jobs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getJobById(req, res) {
  try {
    const job = Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getMyProposalForJob(req, res) {
  const { jobId } = req.params;

  const proposal = Proposal.findByJobAndEditor(
    jobId,
    req.user.id
  );

  res.json(proposal || null);
}

module.exports = { createJob, getAllJobs, getJobById, getMyProposalForJob, searchJobs };
