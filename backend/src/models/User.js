const db = require("../config/db");

class User {
  static create({ name, email, passwordHash, role = "client" }) {
    const stmt = db.prepare(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)    
        `);
    const info = stmt.run(name, email, passwordHash, role);
    return { id: info.lastInsertRowid, name, email, role };
  }

  static findByEmail(email) {
    const stmt = db.prepare(`
        SELECT id, name, email, password_hash, role, created_at
        FROM users
        WHERE email = ?    
    `);
    return stmt.get(email);
  }

  static findById(id) {
    const stmt = db.prepare(`
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = ?   
    `);
    return stmt.get(id);
  }

  // ============ ADMIN METHODS ============

  static findAll({ role, search, limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static count({ role, search } = {}) {
    let query = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    return db.prepare(query).get(...params).total;
  }

  static getStats() {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as clients,
        SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) as editors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `).get();

    const recentUsers = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return { ...stats, recentUsers };
  }

  static update(id, { name, email, role }) {
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) return this.findById(id);

    params.push(id);
    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...params);
    return this.findById(id);
  }

  static delete(id) {
    // First check if user exists
    const user = this.findById(id);
    if (!user) return null;

    // Delete user (cascade will handle related data)
    const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
    stmt.run(id);
    return user;
  }
}

module.exports = User;
