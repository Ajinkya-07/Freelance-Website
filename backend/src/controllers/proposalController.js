const Proposal = require("../models/Proposal");
const Job = require("../models/Job");
const Project = require("../models/Project");

async function applyToJob(req, res) {
  try {
    const { jobId } = req.params;
    const { price, message } = req.body;

    if (req.user.role !== "editor") {
      return res
        .status(403)
        .json({ error: "Only editors can apply" });
    }

    const job = Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // already accepted?
    const accepted = Proposal.hasAcceptedForJob(jobId);
    if (accepted) {
      return res
        .status(400)
        .json({ error: "Job already assigned" });
    }

    // already applied?
    const existing = Proposal.findByJobAndEditor(
      jobId,
      req.user.id
    );

    if (existing) {
      return res
        .status(400)
        .json({ error: "Already applied" });
    }

    const proposal = Proposal.create({
      jobId,
      editorId: req.user.id,
      price,
      message,
    });

    res.status(201).json(proposal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// list for client
async function getJobProposals(req, res) {
  try {
    const { jobId } = req.params;

    const job = Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.client_id !== req.user.id) {
      return res.status(403).json({ error: "Not your job" });
    }

    const proposals = Proposal.findByJob(jobId);

    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// check editor proposal
async function getMyProposalForJob(req, res) {
  const { jobId } = req.params;

  const proposal = Proposal.findByJobAndEditor(
    jobId,
    req.user.id
  );

  res.json(proposal || null);
}

// accept
async function acceptProposal(req, res) {
  try {
    const { proposalId } = req.params;

    const proposal = Proposal.findById(proposalId);
    if (!proposal)
      return res.status(404).json({ error: "Not found" });

    const job = Job.findById(proposal.job_id);
    if (!job)
      return res.status(404).json({ error: "Job not found" });

    if (job.client_id !== req.user.id)
      return res.status(403).json({ error: "Forbidden" });

    const project = Project.create({
      jobId: job.id,
      clientId: job.client_id,
      editorId: proposal.editor_id,
      escrowAmount: proposal.price,
    });

    Proposal.markAccepted(proposalId);
    Proposal.rejectOthers(job.id);

    res.json({
      message: "Proposal accepted",
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  applyToJob,
  getJobProposals,
  getMyProposalForJob,
  acceptProposal,
};