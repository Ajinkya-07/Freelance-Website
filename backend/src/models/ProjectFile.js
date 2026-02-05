const db = require('../config/db');


class ProjectFile {

  static create({ projectId, uploadedBy, fileType, fileName, filePath }) {
    const stmt = db.prepare(`
      INSERT INTO project_files
      (project_id, uploaded_by, file_type, file_name, file_path)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(projectId, uploadedBy, fileType, fileName, filePath);
    return this.findById(info.lastInsertRowid);
  }


  static findById(id) {
    return db.prepare(`SELECT * FROM project_files WHERE id = ?`).get(id);
  }


  static findByProject(projectId) {
    return db.prepare(`
      SELECT *
      FROM project_files
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).all(projectId);
  }


  static delete(id) {
    const stmt = db.prepare(`DELETE FROM project_files WHERE id = ?`);
    const info = stmt.run(id);
    return { deleted: info.changes > 0 };
  }
}

module.exports = ProjectFile;