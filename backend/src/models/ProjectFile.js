const db = require('../db/db');


class ProjectFile {

  static create({ projectId, uploadedBy, fileType, fileName, filePath }) {
    return new Promise((resolve, reject) => {

      const sql = `
        INSERT INTO project_files
        (project_id, uploaded_by, file_type, file_name, file_path)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [projectId, uploadedBy, fileType, fileName, filePath],
        function (err) {
          if (err) return reject(err);

          ProjectFile.findById(this.lastID)
            .then(resolve)
            .catch(reject);
        }
      );
    });
  }


  static findById(id) {
    return new Promise((resolve, reject) => {

      db.get(
        `SELECT * FROM project_files WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }


  static findByProject(projectId) {
    return new Promise((resolve, reject) => {

      db.all(
        `
        SELECT *
        FROM project_files
        WHERE project_id = ?
        ORDER BY created_at DESC
        `,
        [projectId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = ProjectFile;