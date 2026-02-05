const db = require('../config/db');

/**
 * Project Status Flow:
 * in_progress → under_review → revision_requested → under_review → completed
 *            → cancelled (can happen from any status)
 * 
 * Valid statuses: in_progress, under_review, revision_requested, completed, cancelled, on_hold
 */

const VALID_STATUSES = ['in_progress', 'under_review', 'revision_requested', 'completed', 'cancelled', 'on_hold'];

const STATUS_TRANSITIONS = {
  'in_progress': ['under_review', 'on_hold', 'cancelled'],
  'under_review': ['revision_requested', 'completed', 'cancelled'],
  'revision_requested': ['under_review', 'on_hold', 'cancelled'],
  'on_hold': ['in_progress', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': []  // Terminal state
};

class Project {
    static create({ jobId, clientId, editorId, escrowAmount }) {
        const stmt = db.prepare(`
            INSERT INTO  projects (job_id, client_id, editor_id, escrow_amount)
            VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(jobId, clientId, editorId, escrowAmount || 0);
        return this.findById(info.lastInsertRowid);
    }

    static findById(id) {
        return db.prepare(`
            SELECT p.*, 
                   j.title as job_title, 
                   j.description as job_description,
                   c.name as client_name,
                   c.email as client_email,
                   e.name as editor_name,
                   e.email as editor_email
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users c ON p.client_id = c.id
            JOIN users e ON p.editor_id = e.id
            WHERE p.id = ?
        `).get(id);
    }

    static findByEditor(editorId) {
        return db.prepare(`
            SELECT p.*, j.title as job_title, u.name as client_name
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users u ON p.client_id = u.id
            WHERE p.editor_id = ?
            ORDER BY p.created_at DESC
        `).all(editorId);
    }

    static findByClient(clientId) {
        return db.prepare(`
            SELECT p.*, j.title as job_title, u.name as editor_name
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users u ON p.editor_id = u.id
            WHERE p.client_id = ?
            ORDER BY p.created_at DESC
        `).all(clientId);
    }

    static updateStatus(id, status) { 
        if (!VALID_STATUSES.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }
        
        const stmt = db.prepare(`
            UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `);
        stmt.run(status, id);
        return this.findById(id);
    }

    /**
     * Validate if a status transition is allowed
     */
    static canTransition(currentStatus, newStatus) {
        if (!STATUS_TRANSITIONS[currentStatus]) {
            return false;
        }
        return STATUS_TRANSITIONS[currentStatus].includes(newStatus);
    }

    /**
     * Get allowed next statuses for a project
     */
    static getAllowedTransitions(currentStatus) {
        return STATUS_TRANSITIONS[currentStatus] || [];
    }

    static findByUser(userId) {
        return db.prepare(`
            SELECT p.*, j.title as job_title,
                   CASE WHEN p.client_id = ? THEN e.name ELSE c.name END as other_party_name,
                   CASE WHEN p.client_id = ? THEN 'client' ELSE 'editor' END as user_role
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users c ON p.client_id = c.id
            JOIN users e ON p.editor_id = e.id
            WHERE p.client_id = ? OR p.editor_id = ? 
            ORDER BY p.created_at DESC
        `).all(userId, userId, userId, userId);
    }

    /**
     * Complete a project
     */
    static complete(id) {
        const stmt = db.prepare(`
            UPDATE projects 
            SET status = 'completed', 
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(id);
        return this.findById(id);
    }

    /**
     * Cancel a project
     */
    static cancel(id, reason = null) {
        const stmt = db.prepare(`
            UPDATE projects 
            SET status = 'cancelled', 
                cancellation_reason = ?,
                cancelled_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(reason, id);
        return this.findById(id);
    }

    /**
     * Submit project for review (editor action)
     */
    static submitForReview(id) {
        return this.updateStatus(id, 'under_review');
    }

    /**
     * Request revision (client action)
     */
    static requestRevision(id, revisionNotes = null) {
        const stmt = db.prepare(`
            UPDATE projects 
            SET status = 'revision_requested', 
                revision_notes = ?,
                revision_count = revision_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(revisionNotes, id);
        return this.findById(id);
    }

    /**
     * Put project on hold
     */
    static putOnHold(id, reason = null) {
        const stmt = db.prepare(`
            UPDATE projects 
            SET status = 'on_hold', 
                hold_reason = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(reason, id);
        return this.findById(id);
    }

    /**
     * Resume project from hold
     */
    static resume(id) {
        return this.updateStatus(id, 'in_progress');
    }

    /**
     * Get project statistics
     */
    static getStats(id) {
        const project = this.findById(id);
        if (!project) return null;

        const milestoneStats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM milestones WHERE project_id = ?
        `).get(id);

        const fileStats = db.prepare(`
            SELECT 
                COUNT(*) as total_files,
                SUM(CASE WHEN file_type = 'draft' THEN 1 ELSE 0 END) as drafts,
                SUM(CASE WHEN file_type = 'final' THEN 1 ELSE 0 END) as finals
            FROM project_files WHERE project_id = ?
        `).get(id);

        const activityCount = db.prepare(`
            SELECT COUNT(*) as count FROM project_activities WHERE project_id = ?
        `).get(id);

        return {
            project,
            milestones: milestoneStats,
            files: fileStats,
            activityCount: activityCount?.count || 0
        };
    }

    /**
     * Get projects by status
     */
    static findByStatus(status, { limit = 20, offset = 0 } = {}) {
        return db.prepare(`
            SELECT p.*, j.title as job_title, c.name as client_name, e.name as editor_name
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users c ON p.client_id = c.id
            JOIN users e ON p.editor_id = e.id
            WHERE p.status = ?
            ORDER BY p.updated_at DESC
            LIMIT ? OFFSET ?
        `).all(status, limit, offset);
    }

    /**
     * Get project progress percentage
     */
    static getProgress(id) {
        const milestones = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM milestones WHERE project_id = ?
        `).get(id);

        if (!milestones || milestones.total === 0) {
            return { total: 0, completed: 0, percentage: 0 };
        }

        return {
            total: milestones.total,
            completed: milestones.completed,
            percentage: Math.round((milestones.completed / milestones.total) * 100)
        };
    }

    /**
     * Search projects with filters
     */
    static search({
        userId = null,
        status = null,
        query = null,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        limit = 20,
        offset = 0
    } = {}) {
        let sql = `
            SELECT p.*, j.title as job_title, c.name as client_name, e.name as editor_name
            FROM projects p
            JOIN jobs j ON p.job_id = j.id
            JOIN users c ON p.client_id = c.id
            JOIN users e ON p.editor_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            sql += ` AND (p.client_id = ? OR p.editor_id = ?)`;
            params.push(userId, userId);
        }

        if (status) {
            sql += ` AND p.status = ?`;
            params.push(status);
        }

        if (query) {
            sql += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
            params.push(`%${query}%`, `%${query}%`);
        }

        const validSortColumns = ['created_at', 'updated_at', 'status', 'escrow_amount'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        sql += ` ORDER BY p.${sortColumn} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return db.prepare(sql).all(...params);
    }
}

// Export constants for use in controllers
Project.VALID_STATUSES = VALID_STATUSES;
Project.STATUS_TRANSITIONS = STATUS_TRANSITIONS;

module.exports = Project;