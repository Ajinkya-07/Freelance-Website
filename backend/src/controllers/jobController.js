// src/controllers/jobController.js
const Job = require("../models/Job");

async function createJob(req, res) {
  try {
    const { title, description, duration_minutes, budget_min, budget_max } =
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

    const newJob = Job.create({
      clientId: req.user.id,
      title,
      description,
      durationMinutes: duration_minutes || null,
      budgetMin: budget_min || null,
      budgetMax: budget_max || null,
    });

    res.status(201).json({ success: true, job: newJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllJobs(req, res) {
  try {
    const jobs = Job.findAll();
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
