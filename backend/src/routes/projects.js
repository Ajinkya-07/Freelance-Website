const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const {
  acceptProposal,
  getMyProjects,
  getProjectById,
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", authRequired, getMyProjects);

router.get("/:id", authRequired, getProjectById);

router.post("/accept/:proposalId", authRequired, acceptProposal);

module.exports = router;