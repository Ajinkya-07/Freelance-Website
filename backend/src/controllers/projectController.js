const Proposal = require("../models/Proposal");
const Job = require("../models/Job");
const Project = require("../models/Project");

// ===============================
// ACCEPT PROPOSAL → CREATE PROJECT
// ===============================
async function acceptProposal(req, res) {
  try {
    const { proposalId } = req.params;

    const proposal = Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const job = Job.findById(proposal.job_id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (req.user.id !== job.client_id) {
      return res
        .status(403)
        .json({ error: "Only the job owner can accept proposals" });
    }

    const project = Project.create({
      jobId: job.id,
      clientId: job.client_id,
      editorId: proposal.editor_id,
      escrowAmount: proposal.price,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ===============================
// 🔥 DASHBOARD — GET MY PROJECTS
// ===============================
async function getMyProjects(req, res) {
  try {
    const projects = Project.findByUser(req.user.id);

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
}

// ===============================
// 🔥 PROJECT DETAILS PAGE
// ===============================
async function getProjectById(req, res) {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Only client or editor can view
    if (
      project.client_id !== req.user.id &&
      project.editor_id !== req.user.id
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project" });
  }
}

module.exports = {
  acceptProposal,
  getMyProjects,
  getProjectById,
};