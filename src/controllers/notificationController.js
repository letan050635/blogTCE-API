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
  markAllAsRead: BaseController.markAllAsRead(Notification, 'thông báo'),

  getImportantNotifications: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const userId = req.user ? req.user.id : null;
      
      // Lấy danh sách thông báo quan trọng
      const notifications = await Notification.findImportant(limit, userId);
      
      res.json(notifications);
    } catch (error) {
      console.error('Lỗi lấy danh sách thông báo quan trọng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = notificationController;