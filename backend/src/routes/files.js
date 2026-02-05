const express = require('express');
const upload = require('../config/multer');
const { authRequired } = require('../middleware/authMiddleware');
const { uploadFile, getProjectFiles, downloadFile, deleteFile } = require('../controllers/fileController');


const router = express.Router();


// Upload file
router.post(
  '/:projectId/upload',
  (req, res, next) => {
    next();
  },
  authRequired,
  upload.fields([{ name: 'file', maxCount: 1 }]),
  (req, res, next) => {
    next();
  },
  uploadFile
);

// List files
router.get('/:projectId', authRequired, getProjectFiles);

router.get(
  '/download/:fileId',
  authRequired,
  downloadFile
);

// Delete file
router.delete('/:fileId', authRequired, deleteFile);

module.exports = router;
