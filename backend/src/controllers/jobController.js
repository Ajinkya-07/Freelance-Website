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
        .json({ error: "title and description are required" });
    }

    const newJob = Job.create({
      clientId: req.user.id,
      title,
      description,
      durationMinutes: duration_minutes || null,
      budgetMin: budget_min || null,
      budgetMax: budget_max || null,
    });

    res.status(201).json(newJob);
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

module.exports = { createJob, getAllJobs, getJobById, getMyProposalForJob };
