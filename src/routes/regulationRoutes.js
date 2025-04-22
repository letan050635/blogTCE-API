const express = require('express');
const router = express.Router();
const regulationController = require('../controllers/regulationController');
const { authenticate, isAdmin, optionalAuth } = require('../middlewares/auth');
const validator = require('../middlewares/validator');

// Lấy danh sách quy định (public, nhưng có trạng thái đọc nếu đã đăng nhập)
router.get(
  '/',
  optionalAuth,
  validator.paginationValidator,
  validator.searchValidator,
  validator.filterValidator,
  validator.validate,
  regulationController.getRegulations
);

// Lấy danh sách quy định quan trọng
router.get(
  '/important',
  optionalAuth,
  regulationController.getImportantRegulations
);

// Lấy thông tin chi tiết quy định
router.get(
  '/:id',
  validator.idParamValidator,
  validator.validate,
  optionalAuth,
  regulationController.getRegulationById
);

// Tạo quy định mới (chỉ admin)
router.post(
  '/',
  authenticate,
  isAdmin,
  validator.regulationValidator,
  validator.validate,
  regulationController.createRegulation
);

// Cập nhật quy định (chỉ admin)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validator.idParamValidator,
  validator.regulationValidator,
  validator.validate,
  regulationController.updateRegulation
);

// Xóa quy định (chỉ admin)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validator.idParamValidator,
  validator.validate,
  regulationController.deleteRegulation
);

// Cập nhật trạng thái đọc quy định
router.put(
  '/:id/read-status',
  authenticate,
  validator.idParamValidator,
  validator.validate,
  regulationController.updateReadStatus
);

// Đánh dấu tất cả quy định là đã đọc
router.put(
  '/mark-all-read',
  authenticate,
  regulationController.markAllAsRead
);

module.exports = router;