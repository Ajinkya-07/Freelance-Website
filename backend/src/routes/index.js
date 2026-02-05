const express = require("express");
const authRoutes = require("./auth");
const jobRoutes = require("./jobs");
const { authRequired } = require("../middleware/authMiddleware");
const router = express.Router();
const proposalRoutes = require('./proposals');
const projectRoutes = require('./projects');
const fileRoutes = require('./files');
const portfolioRoutes = require('./portfolio');
const paymentRoutes = require('./payments');
const reviewRoutes = require('./reviews');
const milestoneRoutes = require('./milestones');
const analyticsRoutes = require('./analytics');
const adminRoutes = require('./admin');

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "EditConnect API root is working ✅",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use('/proposals', proposalRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

// Protected route to get current user
router.get("/me", authRequired, (req, res) => {
  res.json({
    message: "Authenticated user",
    user: req.user,
  });
});

module.exports = router;
