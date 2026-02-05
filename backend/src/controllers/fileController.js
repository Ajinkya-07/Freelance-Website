const Project = require('../models/Project');
const ProjectFile = require('../models/ProjectFile');
const { logActivity } = require('./projectController');
const path = require('path');
const fs = require('fs');


// ===============================
// UPLOAD FILE
// ===============================
async function uploadFile(req, res) {
  try {
    const { projectId } = req.params;
    const file = req.files?.file?.[0];
    const file_type = req.body?.file_type;

    console.log('FILES:', req.files);
    console.log('BODY:', req.body);

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!file_type) {
      return res.status(400).json({
        error: 'file_type is required (draft or final)'
      });
    }

    const validFileTypes = ['draft', 'final', 'raw', 'source', 'reference'];
    if (!validFileTypes.includes(file_type)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Editors can upload draft/final, Clients can upload raw/source/reference
    const isEditor = req.user.id === project.editor_id;
    const isClient = req.user.id === project.client_id;
    
    if (!isEditor && !isClient) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const editorTypes = ['draft', 'final'];
    const clientTypes = ['raw', 'source', 'reference'];

    if (isEditor && !editorTypes.includes(file_type)) {
      return res.status(400).json({ error: 'Editors can only upload draft or final files' });
    }

    if (isClient && !clientTypes.includes(file_type)) {
      return res.status(400).json({ error: 'Clients can only upload raw, source, or reference files' });
    }

    const savedFile = await ProjectFile.create({
      projectId,
      uploadedBy: req.user.id,
      fileType: file_type,
      fileName: file.originalname,
      filePath: file.path
    });

    // Log the file upload activity
    const typeLabels = {
      draft: 'Draft',
      final: 'Final',
      raw: 'Raw',
      source: 'Source',
      reference: 'Reference'
    };
    logActivity(projectId, req.user.id, 'file_uploaded',
      `${typeLabels[file_type]} file uploaded: ${file.originalname}`,
      { fileId: savedFile.id, fileName: file.originalname, fileType: file_type }
    );

    return res.status(201).json({
      message: 'File uploaded successfully 🎉',
      file: savedFile
    });

  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



// ===============================
// GET PROJECT FILES
// ===============================
async function getProjectFiles(req, res) {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (
      req.user.id !== project.editor_id &&
      req.user.id !== project.client_id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const files = await ProjectFile.findByProject(projectId);

    return res.status(200).json({
      project_id: projectId,
      total_files: files.length,
      files
    });

  } catch (err) {
    console.error('GET FILES ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



// ===============================
// DOWNLOAD FILE
// ===============================
async function downloadFile(req, res) {
  try {
    const { fileId } = req.params;

    // MUST await
    const file = await ProjectFile.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const project = await Project.findById(file.project_id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (
      req.user.id !== project.editor_id &&
      req.user.id !== project.client_id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = file.file_path;

    console.log('DOWNLOAD PATH:', filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing on disk' });
    }

    return res.download(filePath, file.file_name);

  } catch (err) {
    console.error('DOWNLOAD ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


// ===============================
// DELETE FILE
// ===============================
async function deleteFile(req, res) {
  try {
    const { fileId } = req.params;

    const file = await ProjectFile.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const project = await Project.findById(file.project_id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only the uploader can delete their file
    if (req.user.id !== file.uploaded_by) {
      return res.status(403).json({ error: 'Only the uploader can delete this file' });
    }

    // Delete from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete from database
    await ProjectFile.delete(fileId);

    // Log the activity
    logActivity(file.project_id, req.user.id, 'file_deleted',
      `File deleted: ${file.file_name}`,
      { fileName: file.file_name, fileType: file.file_type }
    );

    return res.status(200).json({ message: 'File deleted successfully' });

  } catch (err) {
    console.error('DELETE FILE ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {
  uploadFile,
  getProjectFiles,
  downloadFile,
  deleteFile
};