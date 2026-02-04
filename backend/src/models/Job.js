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
}

module.exports = Job;
