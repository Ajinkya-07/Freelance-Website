const db = require("../config/db");

class Portfolio {
  /**
   * Create a new portfolio item
   */
  static create({ editorId, title, description, category, thumbnailUrl, videoUrl, tags }) {
    const stmt = db.prepare(`
      INSERT INTO portfolio_items (editor_id, title, description, category, thumbnail_url, video_url, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(editorId, title, description, category, thumbnailUrl, videoUrl, JSON.stringify(tags || []));
    return { id: info.lastInsertRowid, editorId, title, description, category, thumbnailUrl, videoUrl, tags };
  }

  /**
   * Find portfolio items by editor ID
   */
  static findByEditorId(editorId) {
    const stmt = db.prepare(`
      SELECT p.*, u.name as editor_name
      FROM portfolio_items p
      JOIN users u ON p.editor_id = u.id
      WHERE p.editor_id = ?
      ORDER BY p.created_at DESC
    `);
    const items = stmt.all(editorId);
    return items.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]')
    }));
  }

  /**
   * Find portfolio item by ID
   */
  static findById(id) {
    const stmt = db.prepare(`
      SELECT p.*, u.name as editor_name, u.email as editor_email
      FROM portfolio_items p
      JOIN users u ON p.editor_id = u.id
      WHERE p.id = ?
    `);
    const item = stmt.get(id);
    if (item) {
      item.tags = JSON.parse(item.tags || '[]');
    }
    return item;
  }

  /**
   * Get all portfolio items (public showcase)
   */
  static findAll({ limit = 50, offset = 0, category = null } = {}) {
    let query = `
      SELECT p.*, u.name as editor_name
      FROM portfolio_items p
      JOIN users u ON p.editor_id = u.id
    `;
    
    const params = [];
    
    if (category) {
      query += ` WHERE p.category = ?`;
      params.push(category);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    const items = stmt.all(...params);
    return items.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]')
    }));
  }

  /**
   * Update portfolio item
   */
  static update(id, { title, description, category, thumbnailUrl, videoUrl, tags }) {
    const stmt = db.prepare(`
      UPDATE portfolio_items
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          thumbnail_url = COALESCE(?, thumbnail_url),
          video_url = COALESCE(?, video_url),
          tags = COALESCE(?, tags),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const info = stmt.run(title, description, category, thumbnailUrl, videoUrl, tags ? JSON.stringify(tags) : null, id);
    return info.changes > 0;
  }

  /**
   * Delete portfolio item
   */
  static delete(id) {
    const stmt = db.prepare(`DELETE FROM portfolio_items WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0;
  }

  /**
   * Get editor profile with portfolio summary
   */
  static getEditorProfile(editorId) {
    const userStmt = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = ? AND role = 'editor'
    `);
    const user = userStmt.get(editorId);
    
    if (!user) return null;

    // Get portfolio items
    const portfolioItems = this.findByEditorId(editorId);
    
    // Get stats
    const statsStmt = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM projects WHERE editor_id = ? AND status = 'completed') as completed_projects,
        (SELECT COUNT(*) FROM projects WHERE editor_id = ?) as total_projects,
        (SELECT COUNT(*) FROM proposals WHERE editor_id = ? AND status = 'accepted') as accepted_proposals
    `);
    const stats = statsStmt.get(editorId, editorId, editorId);

    return {
      ...user,
      portfolio: portfolioItems,
      stats: {
        completedProjects: stats.completed_projects || 0,
        totalProjects: stats.total_projects || 0,
        acceptedProposals: stats.accepted_proposals || 0,
        // Success Rate = Completed Projects / Total Projects Assigned
        successRate: stats.total_projects > 0 
          ? Math.round((stats.completed_projects / stats.total_projects) * 100) 
          : 0
      }
    };
  }

  /**
   * Get all editors with their portfolios (public listing)
   */
  static getAllEditors({ limit = 20, offset = 0 } = {}) {
    const stmt = db.prepare(`
      SELECT u.id, u.name, u.created_at,
        (SELECT COUNT(*) FROM portfolio_items WHERE editor_id = u.id) as portfolio_count,
        (SELECT COUNT(*) FROM projects WHERE editor_id = u.id AND status = 'completed') as completed_projects
      FROM users u
      WHERE u.role = 'editor'
      ORDER BY completed_projects DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  /**
   * Advanced search for editors with filters
   */
  static searchEditors({
    query = null,
    minRating = null,
    minProjects = null,
    hasPortfolio = null,
    category = null,
    sortBy = 'completed_projects',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0
  } = {}) {
    let sql = `
      SELECT 
        u.id, 
        u.name, 
        u.created_at,
        (SELECT COUNT(*) FROM portfolio_items WHERE editor_id = u.id) as portfolio_count,
        (SELECT COUNT(*) FROM projects WHERE editor_id = u.id AND status = 'completed') as completed_projects,
        (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviewee_id = u.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as review_count
      FROM users u
      WHERE u.role = 'editor'
    `;
    const params = [];

    // Text search in name
    if (query) {
      sql += ` AND u.name LIKE ?`;
      params.push(`%${query}%`);
    }

    // Filter by category (if editor has portfolio items in that category)
    if (category) {
      sql += ` AND EXISTS (SELECT 1 FROM portfolio_items WHERE editor_id = u.id AND category = ?)`;
      params.push(category);
    }

    // Filter by minimum completed projects
    if (minProjects !== null) {
      sql += ` AND (SELECT COUNT(*) FROM projects WHERE editor_id = u.id AND status = 'completed') >= ?`;
      params.push(minProjects);
    }

    // Filter by has portfolio
    if (hasPortfolio === true) {
      sql += ` AND (SELECT COUNT(*) FROM portfolio_items WHERE editor_id = u.id) > 0`;
    }

    // Filter by minimum rating
    if (minRating !== null) {
      sql += ` AND (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) >= ?`;
      params.push(minRating);
    }

    // Validate sort column
    const validSortColumns = ['created_at', 'completed_projects', 'portfolio_count', 'average_rating', 'review_count', 'name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'completed_projects';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortColumn} ${order} NULLS LAST LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }

  /**
   * Get count for editor search pagination
   */
  static searchEditorsCount({
    query = null,
    minRating = null,
    minProjects = null,
    hasPortfolio = null,
    category = null
  } = {}) {
    let sql = `SELECT COUNT(*) as total FROM users u WHERE u.role = 'editor'`;
    const params = [];

    if (query) {
      sql += ` AND u.name LIKE ?`;
      params.push(`%${query}%`);
    }
    if (category) {
      sql += ` AND EXISTS (SELECT 1 FROM portfolio_items WHERE editor_id = u.id AND category = ?)`;
      params.push(category);
    }
    if (minProjects !== null) {
      sql += ` AND (SELECT COUNT(*) FROM projects WHERE editor_id = u.id AND status = 'completed') >= ?`;
      params.push(minProjects);
    }
    if (hasPortfolio === true) {
      sql += ` AND (SELECT COUNT(*) FROM portfolio_items WHERE editor_id = u.id) > 0`;
    }
    if (minRating !== null) {
      sql += ` AND (SELECT AVG(rating) FROM reviews WHERE reviewee_id = u.id) >= ?`;
      params.push(minRating);
    }

    return db.prepare(sql).get(...params);
  }

  /**
   * Search portfolio items with advanced filters
   */
  static searchPortfolioItems({
    query = null,
    category = null,
    editorId = null,
    tags = null,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0
  } = {}) {
    let sql = `
      SELECT p.*, u.name as editor_name,
        (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE reviewee_id = p.editor_id) as editor_rating
      FROM portfolio_items p
      JOIN users u ON p.editor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }
    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }
    if (editorId) {
      sql += ` AND p.editor_id = ?`;
      params.push(editorId);
    }
    if (tags && tags.length > 0) {
      // Search for any of the tags
      const tagConditions = tags.map(() => `p.tags LIKE ?`).join(' OR ');
      sql += ` AND (${tagConditions})`;
      tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    const validSortColumns = ['created_at', 'views', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = db.prepare(sql).all(...params);
    return items.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]')
    }));
  }

  /**
   * Get available categories with counts
   */
  static getCategories() {
    return db.prepare(`
      SELECT category, COUNT(*) as count
      FROM portfolio_items
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `).all();
  }

  /**
   * Increment view count
   */
  static incrementViews(id) {
    return db.prepare(`
      UPDATE portfolio_items SET views = views + 1 WHERE id = ?
    `).run(id);
  }
}

module.exports = Portfolio;
