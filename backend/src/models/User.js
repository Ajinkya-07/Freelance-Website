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
}

module.exports = User;
