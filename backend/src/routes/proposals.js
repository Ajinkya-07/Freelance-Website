const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const controller = require("../controllers/proposalController");

const router = express.Router();

router.post(
  "/job/:jobId",
  authRequired,
  controller.applyToJob
);

router.get(
  "/job/:jobId",
  authRequired,
  controller.getJobProposals
);

router.get(
  "/job/:jobId/me",
  authRequired,
  controller.getMyProposalForJob
);

router.post(
  "/accept/:proposalId",
  authRequired,
  controller.acceptProposal
);

module.exports = router;
