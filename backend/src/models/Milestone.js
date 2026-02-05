// src/models/Milestone.js
const db = require("../config/db");

const Milestone = {
  /**
   * Create a new milestone
   */
  create: ({ projectId, title, description, dueDate, order }) => {
    const stmt = db.prepare(`
      INSERT INTO milestones (project_id, title, description, due_date, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(projectId, title, description, dueDate, order || 0);
    return { id: result.lastInsertRowid };
  },

  /**
   * Find milestone by ID
   */
  findById: (id) => {
    const stmt = db.prepare(`
      SELECT m.*, p.title as project_title
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE m.id = ?
    `);
    return stmt.get(id);
  },

  /**
   * Get all milestones for a project
   */
  findByProjectId: (projectId) => {
    const stmt = db.prepare(`
      SELECT * FROM milestones 
      WHERE project_id = ?
      ORDER BY display_order ASC, due_date ASC
    `);
    return stmt.all(projectId);
  },

  /**
   * Update milestone status
   */
  updateStatus: (id, status, completedAt = null) => {
    const stmt = db.prepare(`
      UPDATE milestones 
      SET status = ?,
          completed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(status, completedAt, id);
  },

  /**
   * Update milestone details
   */
  update: (id, { title, description, dueDate, order, status }) => {
    const stmt = db.prepare(`
      UPDATE milestones 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          due_date = COALESCE(?, due_date),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(title, description, dueDate, order, status, id);
  },

  /**
   * Mark milestone as complete
   */
  complete: (id) => {
    const stmt = db.prepare(`
      UPDATE milestones 
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  /**
   * Delete milestone
   */
  delete: (id) => {
    const stmt = db.prepare(`DELETE FROM milestones WHERE id = ?`);
    return stmt.run(id);
  },

  /**
   * Get project progress (completed milestones / total milestones)
   */
  getProjectProgress: (projectId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM milestones
      WHERE project_id = ?
    `);
    const result = stmt.get(projectId);
    return {
      ...result,
      progress_percentage: result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0
    };
  },

  /**
   * Get overdue milestones for a user's projects
   */
  getOverdueMilestones: (userId) => {
    const stmt = db.prepare(`
      SELECT m.*, p.title as project_title, p.client_id, p.editor_id
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE (p.client_id = ? OR p.editor_id = ?)
        AND m.status != 'completed'
        AND m.due_date < date('now')
      ORDER BY m.due_date ASC
    `);
    return stmt.all(userId, userId);
  },

  /**
   * Get upcoming milestones for a user's projects
   */
  getUpcomingMilestones: (userId, days = 7) => {
    const stmt = db.prepare(`
      SELECT m.*, p.title as project_title, p.client_id, p.editor_id
      FROM milestones m
      JOIN projects p ON m.project_id = p.id
      WHERE (p.client_id = ? OR p.editor_id = ?)
        AND m.status != 'completed'
        AND m.due_date >= date('now')
        AND m.due_date <= date('now', '+' || ? || ' days')
      ORDER BY m.due_date ASC
    `);
    return stmt.all(userId, userId, days);
  },

  /**
   * Reorder milestones within a project
   */
  reorder: (projectId, milestoneOrders) => {
    const stmt = db.prepare(`
      UPDATE milestones SET display_order = ? WHERE id = ? AND project_id = ?
    `);
    
    const transaction = db.transaction((orders) => {
      for (const { id, order } of orders) {
        stmt.run(order, id, projectId);
      }
    });
    
    return transaction(milestoneOrders);
  },

  /**
   * Create default milestones for a project
   */
  createDefaultMilestones: (projectId) => {
    const defaults = [
      { title: 'Project Kickoff', description: 'Initial project setup and requirements gathering', order: 1 },
      { title: 'First Draft', description: 'Initial draft delivery for review', order: 2 },
      { title: 'Revision Round 1', description: 'Incorporate first round of feedback', order: 3 },
      { title: 'Final Delivery', description: 'Final edited video delivery', order: 4 },
      { title: 'Project Approval', description: 'Client approval and project completion', order: 5 }
    ];

    const stmt = db.prepare(`
      INSERT INTO milestones (project_id, title, description, display_order)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction((milestones) => {
      for (const m of milestones) {
        stmt.run(projectId, m.title, m.description, m.order);
      }
    });

    return transaction(defaults);
  }
};

module.exports = Milestone;
