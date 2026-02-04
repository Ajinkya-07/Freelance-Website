const db = require("../config/db");

class Proposal {
  static create({ jobId, editorId, price, message }) {
    const stmt = db.prepare(`
      INSERT INTO proposals 
      (job_id, editor_id, price, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const info = stmt.run(jobId, editorId, price, message);
    return this.findById(info.lastInsertRowid);
  }

  static findById(id) {
    return db
      .prepare(`SELECT * FROM proposals WHERE id = ?`)
      .get(id);
  }

  static findByJob(jobId) {
    return db
      .prepare(
        `SELECT proposals.*, users.name AS editor_name
         FROM proposals
         JOIN users ON proposals.editor_id = users.id
         WHERE job_id = ?
         ORDER BY created_at DESC`
      )
      .all(jobId);
  }

  static findByJobAndEditor(jobId, editorId) {
    return db
      .prepare(
        `SELECT * FROM proposals 
         WHERE job_id = ? AND editor_id = ?`
      )
      .get(jobId, editorId);
  }

  static markAccepted(id) {
    db.prepare(
      `UPDATE proposals SET status='accepted' WHERE id = ?`
    ).run(id);
  }

  static rejectOthers(jobId) {
    db.prepare(
      `UPDATE proposals 
       SET status='rejected' 
       WHERE job_id = ? AND status='pending'`
    ).run(jobId);
  }

  static hasAcceptedForJob(jobId) {
    return db
      .prepare(
        `SELECT * FROM proposals 
         WHERE job_id = ? AND status='accepted'`
      )
      .get(jobId);
  }
}

module.exports = Proposal;