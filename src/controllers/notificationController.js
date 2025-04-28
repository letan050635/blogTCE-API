const Notification = require('../models/Notification');
const BaseController = require('./BaseController');

/**
 * Controller xử lý thông báo
 */
const notificationController = {
  // Lấy danh sách thông báo
  getNotifications: BaseController.getList(Notification),
  
  // Lấy thông tin chi tiết thông báo
  getNotificationById: BaseController.getById(Notification),
  
  // Tạo thông báo mới
  createNotification: BaseController.create(Notification, 'thông báo'),
  
  // Cập nhật thông báo
  updateNotification: BaseController.update(Notification, 'thông báo'),
  
  // Xóa thông báo
  deleteNotification: BaseController.delete(Notification, 'thông báo'),
  
  // Cập nhật trạng thái đọc thông báo
  updateReadStatus: BaseController.updateReadStatus(Notification, 'thông báo'),
  
  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: BaseController.markAllAsRead(Notification, 'thông báo')
};

module.exports = notificationController;