const db = require("../config/db");

class Notification {
  /**
   * Create a new notification
   */
  static create({ userId, type, title, message, referenceType = null, referenceId = null }) {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(userId, type, title, message, referenceType, referenceId);
    return this.findById(info.lastInsertRowid);
  }

  /**
   * Find notification by ID
   */
  static findById(id) {
    return db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(id);
  }

  /**
   * Get all notifications for a user
   */
  static findByUser(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    let sql = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    const params = [userId];

    if (unreadOnly) {
      sql += ` AND is_read = 0`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  }

  /**
   * Get unread count for a user
   */
  static getUnreadCount(userId) {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId);
    return result?.count || 0;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(id, userId) {
    const stmt = db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE id = ? AND user_id = ?
    `);
    return stmt.run(id, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(userId) {
    const stmt = db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ? AND is_read = 0
    `);
    return stmt.run(userId);
  }

  /**
   * Delete a notification
   */
  static delete(id, userId) {
    const stmt = db.prepare(`DELETE FROM notifications WHERE id = ? AND user_id = ?`);
    return stmt.run(id, userId);
  }

  /**
   * Delete all read notifications older than X days
   */
  static cleanup(daysOld = 30) {
    const stmt = db.prepare(`
      DELETE FROM notifications
      WHERE is_read = 1 AND created_at < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(daysOld);
  }

  // ================== NOTIFICATION HELPERS ==================

  /**
   * Send job invitation notification to an editor
   */
  static notifyJobInvitation(editorId, jobId, jobTitle, clientName) {
    return this.create({
      userId: editorId,
      type: 'job_invitation',
      title: '🎯 New Job Invitation',
      message: `${clientName} wants to hire you for "${jobTitle}"`,
      referenceType: 'job',
      referenceId: jobId
    });
  }

  /**
   * Send proposal received notification to a client
   */
  static notifyProposalReceived(clientId, jobId, jobTitle, editorName) {
    return this.create({
      userId: clientId,
      type: 'proposal_received',
      title: '📨 New Proposal',
      message: `${editorName} submitted a proposal for "${jobTitle}"`,
      referenceType: 'job',
      referenceId: jobId
    });
  }

  /**
   * Send proposal accepted notification to an editor
   */
  static notifyProposalAccepted(editorId, projectId, jobTitle) {
    return this.create({
      userId: editorId,
      type: 'proposal_accepted',
      title: '🎉 Proposal Accepted',
      message: `Your proposal for "${jobTitle}" has been accepted!`,
      referenceType: 'project',
      referenceId: projectId
    });
  }

  /**
   * Send project status update notification
   */
  static notifyProjectUpdate(userId, projectId, title, message) {
    return this.create({
      userId,
      type: 'project_update',
      title,
      message,
      referenceType: 'project',
      referenceId: projectId
    });
  }
}

module.exports = Notification;
