const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Upload file - Chỉ admin mới có quyền
router.post(
  '/upload',
  authenticate,
  isAdmin,
  upload.single('file'),
  fileController.uploadFile
);

// Lấy danh sách file - Public, ai cũng có thể xem
router.get(
  '/:relatedType/:relatedId',
  fileController.getFiles
);

// Xóa file - Chỉ admin mới có quyền
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  fileController.deleteFile
);

module.exports = router;