const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, isAdmin, optionalAuth } = require('../middlewares/auth');
const validator = require('../middlewares/validator');

// Lấy danh sách thông báo (public, nhưng có trạng thái đọc nếu đã đăng nhập)
router.get(
  '/',
  optionalAuth,
  validator.paginationValidator,
  validator.searchValidator,
  validator.filterValidator,
  validator.validate,
  notificationController.getNotifications
);

// Lấy thông tin chi tiết thông báo
router.get(
  '/:id',
  validator.idParamValidator,
  validator.validate,
  optionalAuth,
  notificationController.getNotificationById
);

// Tạo thông báo mới (chỉ admin)
router.post(
  '/',
  authenticate,
  isAdmin,
  validator.notificationValidator,
  validator.validate,
  notificationController.createNotification
);

// Cập nhật thông báo (chỉ admin)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validator.idParamValidator,
  validator.notificationValidator,
  validator.validate,
  notificationController.updateNotification
);

// Xóa thông báo (chỉ admin)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validator.idParamValidator,
  validator.validate,
  notificationController.deleteNotification
);

// Cập nhật trạng thái đọc thông báo
router.put(
  '/:id/read-status',
  authenticate,
  validator.idParamValidator,
  validator.validate,
  notificationController.updateReadStatus
);

// Đánh dấu tất cả thông báo là đã đọc
router.put(
  '/mark-all-read',
  authenticate,
  notificationController.markAllAsRead
);

module.exports = router;