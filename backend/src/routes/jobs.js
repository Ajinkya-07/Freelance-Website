// src/routes/jobs.js
const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const {
  createJob,
  getAllJobs,
  getJobById,
  searchJobs,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/search", searchJobs); // search and filter jobs
router.post("/", authRequired, createJob); // create a job
router.get("/", getAllJobs); // list all jobs
router.get("/:id", getJobById); // job details

module.exports = router;
