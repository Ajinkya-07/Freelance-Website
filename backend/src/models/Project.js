const db = require('../config/db');

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
            SELECT * FROM projects WHERE id = ?
        `).get(id);
    }

    static findByEditor(editorId) {
        return db.prepare(`
            SELECT * FROM projects WHERE editor_id = ?
        `).all(editorId);
    }

    static findByClient(clientId) {
        return db.prepare(`
            SELECT * FROM projects WHERE client_id = ?
        `).all(clientId);
    }

    static updateStatus(id, status) { 
        const stmt = db.prepare(`
            UPDATE projects SET status = ? WHERE id = ?
        `);
        stmt.run(status, id);
        return this.findById(id);
    }

    static findByUser(userId) {
        return db.prepare(`
            SELECT * FROM projects WHERE client_id = ? OR editor_id = ? ORDER BY created_at DESC
        `).all(userId, userId);
    }
}

module.exports = Project;