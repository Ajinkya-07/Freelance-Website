// src/models/ProjectActivity.js
const db = require("../config/db");

/**
 * Project Activity types:
 * - project_created: Project was created
 * - status_changed: Project status was updated
 * - milestone_added: New milestone was added
 * - milestone_completed: Milestone was completed
 * - file_uploaded: File was uploaded
 * - file_approved: File was approved
 * - message_sent: Message was sent (future feature)
 * - payment_made: Payment was processed
 * - review_submitted: Review was submitted
 * - project_completed: Project was marked complete
 * - project_cancelled: Project was cancelled
 */

const ProjectActivity = {
  /**
   * Create a new activity log entry
   */
  create: ({ projectId, userId, activityType, description, metadata = {} }) => {
    const stmt = db.prepare(`
      INSERT INTO project_activities (project_id, user_id, activity_type, description, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(projectId, userId, activityType, description, JSON.stringify(metadata));
    return { id: result.lastInsertRowid };
  },

  /**
   * Get all activities for a project
   */
  findByProjectId: (projectId, { limit = 50, offset = 0 } = {}) => {
    const stmt = db.prepare(`
      SELECT pa.*, u.name as user_name, u.role as user_role
      FROM project_activities pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.project_id = ?
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const activities = stmt.all(projectId, limit, offset);
    return activities.map(a => ({
      ...a,
      metadata: JSON.parse(a.metadata || '{}')
    }));
  },

  /**
   * Get recent activities for a user's projects
   */
  findByUserId: (userId, { limit = 20, offset = 0 } = {}) => {
    const stmt = db.prepare(`
      SELECT pa.*, u.name as user_name, p.id as project_id,
             (SELECT title FROM jobs WHERE id = p.job_id) as project_title
      FROM project_activities pa
      JOIN users u ON pa.user_id = u.id
      JOIN projects p ON pa.project_id = p.id
      WHERE p.client_id = ? OR p.editor_id = ?
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const activities = stmt.all(userId, userId, limit, offset);
    return activities.map(a => ({
      ...a,
      metadata: JSON.parse(a.metadata || '{}')
    }));
  },

  /**
   * Get activity count for a project
   */
  getActivityCount: (projectId) => {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM project_activities WHERE project_id = ?
    `);
    return stmt.get(projectId);
  },

  /**
   * Get activities by type
   */
  findByType: (projectId, activityType) => {
    const stmt = db.prepare(`
      SELECT pa.*, u.name as user_name
      FROM project_activities pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.project_id = ? AND pa.activity_type = ?
      ORDER BY pa.created_at DESC
    `);
    const activities = stmt.all(projectId, activityType);
    return activities.map(a => ({
      ...a,
      metadata: JSON.parse(a.metadata || '{}')
    }));
  },

  /**
   * Get activity summary for a project
   */
  getProjectSummary: (projectId) => {
    const stmt = db.prepare(`
      SELECT 
        activity_type,
        COUNT(*) as count,
        MAX(created_at) as last_activity
      FROM project_activities
      WHERE project_id = ?
      GROUP BY activity_type
    `);
    return stmt.all(projectId);
  },

  /**
   * Delete all activities for a project (for cleanup)
   */
  deleteByProjectId: (projectId) => {
    const stmt = db.prepare(`DELETE FROM project_activities WHERE project_id = ?`);
    return stmt.run(projectId);
  }
};

module.exports = ProjectActivity;
