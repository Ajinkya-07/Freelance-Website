// src/controllers/analyticsController.js
const db = require("../config/db");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform analytics and statistics
 */

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get platform overview statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getPlatformOverview = asyncHandler(async (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
      (SELECT COUNT(*) FROM users WHERE role = 'editor') as total_editors,
      (SELECT COUNT(*) FROM jobs) as total_jobs,
      (SELECT COUNT(*) FROM jobs WHERE status = 'open') as open_jobs,
      (SELECT COUNT(*) FROM projects) as total_projects,
      (SELECT COUNT(*) FROM projects WHERE status = 'completed') as completed_projects,
      (SELECT COUNT(*) FROM projects WHERE status = 'in_progress') as active_projects,
      (SELECT COUNT(*) FROM proposals) as total_proposals,
      (SELECT COUNT(*) FROM reviews) as total_reviews,
      (SELECT ROUND(AVG(rating), 2) FROM reviews) as average_rating,
      (SELECT COUNT(*) FROM portfolio_items) as total_portfolio_items,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_transaction_volume
  `).get();

  res.json({
    success: true,
    stats
  });
});

/**
 * @swagger
 * /api/analytics/user-growth:
 *   get:
 *     summary: Get user growth over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getUserGrowth = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;

  const growth = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as new_users,
      SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as new_clients,
      SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as new_editors
    FROM users
    WHERE created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(parseInt(period));

  res.json({
    success: true,
    period: `${period} days`,
    data: growth
  });
});

/**
 * @swagger
 * /api/analytics/job-stats:
 *   get:
 *     summary: Get job statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getJobStats = asyncHandler(async (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_jobs,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_jobs,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_jobs,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_jobs,
      ROUND(AVG(budget_max), 2) as avg_max_budget,
      ROUND(AVG(budget_min), 2) as avg_min_budget,
      ROUND(AVG(duration_minutes), 2) as avg_duration_minutes
    FROM jobs
  `).get();

  const jobsByDay = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as jobs_posted
    FROM jobs
    WHERE created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  const proposalStats = db.prepare(`
    SELECT 
      j.id,
      j.title,
      COUNT(p.id) as proposal_count
    FROM jobs j
    LEFT JOIN proposals p ON j.id = p.job_id
    GROUP BY j.id
    ORDER BY proposal_count DESC
    LIMIT 10
  `).all();

  res.json({
    success: true,
    stats,
    jobsByDay,
    topJobsByProposals: proposalStats
  });
});

/**
 * @swagger
 * /api/analytics/project-stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_projects,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_projects,
      ROUND(AVG(escrow_amount), 2) as avg_escrow_amount,
      SUM(escrow_amount) as total_escrow_amount
    FROM projects
  `).get();

  const projectsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM projects
    GROUP BY status
  `).all();

  const completionRate = db.prepare(`
    SELECT 
      ROUND(
        (SELECT COUNT(*) FROM projects WHERE status = 'completed') * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM projects), 0), 
        2
      ) as completion_rate
  `).get();

  res.json({
    success: true,
    stats: { ...stats, ...completionRate },
    projectsByStatus
  });
});

/**
 * @swagger
 * /api/analytics/editor-leaderboard:
 *   get:
 *     summary: Get top performing editors
 *     tags: [Analytics]
 */
const getEditorLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const leaderboard = db.prepare(`
    SELECT 
      u.id,
      u.name,
      COUNT(DISTINCT p.id) as completed_projects,
      COUNT(DISTINCT pi.id) as portfolio_items,
      COUNT(DISTINCT r.id) as review_count,
      ROUND(AVG(r.rating), 2) as average_rating,
      COALESCE(SUM(pay.amount), 0) as total_earnings
    FROM users u
    LEFT JOIN projects p ON u.id = p.editor_id AND p.status = 'completed'
    LEFT JOIN portfolio_items pi ON u.id = pi.editor_id
    LEFT JOIN reviews r ON u.id = r.reviewee_id
    LEFT JOIN payments pay ON u.id = pay.payee_id AND pay.status = 'completed'
    WHERE u.role = 'editor'
    GROUP BY u.id
    ORDER BY completed_projects DESC, average_rating DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json({
    success: true,
    count: leaderboard.length,
    leaderboard
  });
});

/**
 * @swagger
 * /api/analytics/my-stats:
 *   get:
 *     summary: Get current user's personal statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getMyStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let stats = {};

  if (role === 'client') {
    stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM jobs WHERE client_id = ?) as jobs_posted,
        (SELECT COUNT(*) FROM jobs WHERE client_id = ? AND status = 'open') as open_jobs,
        (SELECT COUNT(*) FROM projects WHERE client_id = ?) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'completed') as completed_projects,
        (SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'in_progress') as active_projects,
        (SELECT COUNT(*) FROM proposals WHERE job_id IN (SELECT id FROM jobs WHERE client_id = ?)) as proposals_received,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payer_id = ? AND status = 'completed') as total_spent,
        (SELECT COUNT(*) FROM reviews WHERE reviewer_id = ?) as reviews_given
    `).get(userId, userId, userId, userId, userId, userId, userId, userId);
  } else if (role === 'editor') {
    stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM proposals WHERE editor_id = ?) as proposals_sent,
        (SELECT COUNT(*) FROM proposals WHERE editor_id = ? AND status = 'accepted') as proposals_accepted,
        (SELECT COUNT(*) FROM projects WHERE editor_id = ?) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE editor_id = ? AND status = 'completed') as completed_projects,
        (SELECT COUNT(*) FROM projects WHERE editor_id = ? AND status = 'in_progress') as active_projects,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payee_id = ? AND status = 'completed') as total_earned,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?) as reviews_received,
        (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviewee_id = ?) as average_rating,
        (SELECT COUNT(*) FROM portfolio_items WHERE editor_id = ?) as portfolio_items
    `).get(userId, userId, userId, userId, userId, userId, userId, userId, userId);
  }

  // Get activity trend for the last 30 days
  const activityTrend = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as activity_count
    FROM (
      SELECT created_at FROM projects WHERE client_id = ? OR editor_id = ?
      UNION ALL
      SELECT created_at FROM proposals WHERE editor_id = ?
      UNION ALL
      SELECT created_at FROM reviews WHERE reviewer_id = ? OR reviewee_id = ?
    )
    WHERE created_at >= date('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(userId, userId, userId, userId, userId);

  res.json({
    success: true,
    role,
    stats,
    activityTrend
  });
});

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 */
const getRevenueStats = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;

  const revenue = db.prepare(`
    SELECT 
      date(created_at) as date,
      COUNT(*) as transactions,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as refunded_amount
    FROM payments
    WHERE created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(parseInt(period));

  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_completed,
      COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as total_refunded,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
      COUNT(*) as total_transactions
    FROM payments
    WHERE created_at >= date('now', '-' || ? || ' days')
  `).get(parseInt(period));

  res.json({
    success: true,
    period: `${period} days`,
    totals,
    dailyRevenue: revenue
  });
});

/**
 * @swagger
 * /api/analytics/category-breakdown:
 *   get:
 *     summary: Get portfolio category breakdown
 *     tags: [Analytics]
 */
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const categories = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count,
      SUM(views) as total_views
    FROM portfolio_items
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY count DESC
  `).all();

  res.json({
    success: true,
    categories
  });
});

module.exports = {
  getPlatformOverview,
  getUserGrowth,
  getJobStats,
  getProjectStats,
  getEditorLeaderboard,
  getMyStats,
  getRevenueStats,
  getCategoryBreakdown
};
