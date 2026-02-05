// src/models/Review.js
const db = require("../config/db");

const Review = {
  /**
   * Create a new review
   */
  create: ({ projectId, reviewerId, revieweeId, rating, title, comment, category }) => {
    const stmt = db.prepare(`
      INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, title, comment, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(projectId, reviewerId, revieweeId, rating, title, comment, category || 'general');
    return { id: result.lastInsertRowid };
  },

  /**
   * Find review by ID
   */
  findById: (id) => {
    const stmt = db.prepare(`
      SELECT r.*, 
             reviewer.name as reviewer_name,
             reviewee.name as reviewee_name,
             p.title as project_title
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users reviewee ON r.reviewee_id = reviewee.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get all reviews for a user (as reviewee)
   */
  findByUserId: (userId, { limit = 20, offset = 0, minRating = null } = {}) => {
    let query = `
      SELECT r.*, 
             reviewer.name as reviewer_name,
             p.title as project_title
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.reviewee_id = ?
    `;
    const params = [userId];

    if (minRating) {
      query += ` AND r.rating >= ?`;
      params.push(minRating);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Get reviews given by a user (as reviewer)
   */
  findByReviewerId: (reviewerId, { limit = 20, offset = 0 } = {}) => {
    const stmt = db.prepare(`
      SELECT r.*, 
             reviewee.name as reviewee_name,
             p.title as project_title
      FROM reviews r
      JOIN users reviewee ON r.reviewee_id = reviewee.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.reviewer_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(reviewerId, limit, offset);
  },

  /**
   * Get review for a specific project by reviewer
   */
  findByProjectAndReviewer: (projectId, reviewerId) => {
    const stmt = db.prepare(`
      SELECT * FROM reviews WHERE project_id = ? AND reviewer_id = ?
    `);
    return stmt.get(projectId, reviewerId);
  },

  /**
   * Get average rating and review stats for a user
   */
  getUserStats: (userId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE reviewee_id = ?
    `);
    return stmt.get(userId);
  },

  /**
   * Get category-wise rating breakdown
   */
  getCategoryStats: (userId) => {
    const stmt = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND(AVG(rating), 2) as average_rating
      FROM reviews
      WHERE reviewee_id = ?
      GROUP BY category
    `);
    return stmt.all(userId);
  },

  /**
   * Update a review
   */
  update: (id, { rating, title, comment }) => {
    const stmt = db.prepare(`
      UPDATE reviews 
      SET rating = COALESCE(?, rating),
          title = COALESCE(?, title),
          comment = COALESCE(?, comment),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(rating, title, comment, id);
  },

  /**
   * Delete a review
   */
  delete: (id) => {
    const stmt = db.prepare(`DELETE FROM reviews WHERE id = ?`);
    return stmt.run(id);
  },

  /**
   * Get top rated editors
   */
  getTopRatedEditors: (limit = 10) => {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(r.id) as review_count,
        ROUND(AVG(r.rating), 2) as average_rating,
        (SELECT COUNT(*) FROM projects WHERE editor_id = u.id AND status = 'completed') as completed_projects
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewee_id
      WHERE u.role = 'editor'
      GROUP BY u.id
      HAVING review_count > 0
      ORDER BY average_rating DESC, review_count DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  /**
   * Check if user can review (must have completed project together)
   */
  canReview: (reviewerId, revieweeId, projectId) => {
    const stmt = db.prepare(`
      SELECT id FROM projects 
      WHERE id = ? 
        AND status = 'completed'
        AND ((client_id = ? AND editor_id = ?) OR (editor_id = ? AND client_id = ?))
    `);
    return stmt.get(projectId, reviewerId, revieweeId, reviewerId, revieweeId);
  }
};

module.exports = Review;
