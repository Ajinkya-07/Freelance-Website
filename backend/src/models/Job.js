const db = require("../config/db");

class Job {
  static create({
    clientId,
    title,
    description,
    durationMinutes,
    budgetMin,
    budgetMax,
  }) {
    const stmt = db.prepare(`
      INSERT INTO jobs (client_id, title, description, duration_minutes, budget_min, budget_max)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      clientId,
      title,
      description,
      durationMinutes,
      budgetMin,
      budgetMax
    );

    return this.findById(info.lastInsertRowid);
  }

  static findById(id) {
    return db
      .prepare(
        `
      SELECT jobs.*, users.name AS client_name, users.email AS client_email
      FROM jobs
      JOIN users ON jobs.client_id = users.id
      WHERE jobs.id = ?
    `
      )
      .get(id);
  }

  static findAll() {
    return db
      .prepare(
        `
      SELECT jobs.*, users.name AS client_name
      FROM jobs
      JOIN users ON jobs.client_id = users.id
      ORDER BY jobs.created_at DESC
    `
      )
      .all();
  }

  static findByClient(clientId) {
    return db
      .prepare(
        `
      SELECT * FROM jobs
      WHERE client_id = ?
      ORDER BY created_at DESC
    `
      )
      .all();
  }

  /**
   * Advanced search with filters, sorting, and pagination
   */
  static search({
    query = null,
    status = null,
    budgetMin = null,
    budgetMax = null,
    durationMin = null,
    durationMax = null,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    limit = 20,
    offset = 0
  } = {}) {
    let sql = `
      SELECT jobs.*, users.name AS client_name,
        (SELECT COUNT(*) FROM proposals WHERE job_id = jobs.id) as proposal_count
      FROM jobs
      JOIN users ON jobs.client_id = users.id
      WHERE 1=1
    `;
    const params = [];

    // Text search in title and description
    if (query) {
      sql += ` AND (jobs.title LIKE ? OR jobs.description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    // Status filter
    if (status) {
      sql += ` AND jobs.status = ?`;
      params.push(status);
    }

    // Budget range filter
    if (budgetMin !== null) {
      sql += ` AND jobs.budget_max >= ?`;
      params.push(budgetMin);
    }
    if (budgetMax !== null) {
      sql += ` AND jobs.budget_min <= ?`;
      params.push(budgetMax);
    }

    // Duration filter
    if (durationMin !== null) {
      sql += ` AND jobs.duration_minutes >= ?`;
      params.push(durationMin);
    }
    if (durationMax !== null) {
      sql += ` AND jobs.duration_minutes <= ?`;
      params.push(durationMax);
    }

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['created_at', 'budget_min', 'budget_max', 'duration_minutes', 'title', 'proposal_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }

  /**
   * Get count for pagination
   */
  static searchCount({
    query = null,
    status = null,
    budgetMin = null,
    budgetMax = null,
    durationMin = null,
    durationMax = null
  } = {}) {
    let sql = `SELECT COUNT(*) as total FROM jobs WHERE 1=1`;
    const params = [];

    if (query) {
      sql += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (budgetMin !== null) {
      sql += ` AND budget_max >= ?`;
      params.push(budgetMin);
    }
    if (budgetMax !== null) {
      sql += ` AND budget_min <= ?`;
      params.push(budgetMax);
    }
    if (durationMin !== null) {
      sql += ` AND duration_minutes >= ?`;
      params.push(durationMin);
    }
    if (durationMax !== null) {
      sql += ` AND duration_minutes <= ?`;
      params.push(durationMax);
    }

    return db.prepare(sql).get(...params);
  }

  /**
   * Get job statistics for filters
   */
  static getFilterStats() {
    return db.prepare(`
      SELECT 
        MIN(budget_min) as min_budget,
        MAX(budget_max) as max_budget,
        MIN(duration_minutes) as min_duration,
        MAX(duration_minutes) as max_duration,
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_jobs
      FROM jobs
    `).get();
  }

  /**
   * Update job status
   */
  static updateStatus(id, status) {
    const stmt = db.prepare(`UPDATE jobs SET status = ? WHERE id = ?`);
    return stmt.run(status, id);
  }
}

module.exports = Job;
