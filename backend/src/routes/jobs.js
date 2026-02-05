// src/routes/jobs.js
const express = require("express");
const { authRequired, authOptional } = require("../middleware/authMiddleware");
const {
  createJob,
  getAllJobs,
  getJobById,
  searchJobs,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/search", authOptional, searchJobs); // search and filter jobs
router.post("/", authRequired, createJob); // create a job
router.get("/", authOptional, getAllJobs); // list all jobs - authOptional to identify user
router.get("/:id", getJobById); // job details

module.exports = router;
