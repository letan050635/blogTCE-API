// src/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Upload files (chỉ admin mới có quyền upload)
router.post(
  '/upload',
  authenticate,
  isAdmin,
  fileController.uploadMiddleware,
  fileController.uploadFiles
);

// Get files by related item
router.get(
  '/:relatedType/:relatedId',
  fileController.getFilesByRelatedItem
);

// Delete file (chỉ admin mới có quyền xóa)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  fileController.deleteFile
);

module.exports = router;