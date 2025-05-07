const Notification = require('../models/Notification');
const BaseController = require('./BaseController');
const File = require('../models/File');

/**
 * Controller xử lý thông báo
 */
const notificationController = {
  // Lấy danh sách thông báo
  getNotifications: BaseController.getList(Notification),
  
  // Lấy thông tin chi tiết thông báo
  getNotificationById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user ? req.user.id : null;
      
      // Lấy thông tin thông báo
      const notification = await Notification.findById(id, userId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Không tìm thấy thông báo' });
      }
      
      // Lấy các file đính kèm
      const attachments = await File.findByRelated('notification', id);
      
      // Thêm thông tin file đính kèm vào response
      notification.attachments = attachments || [];
      
      res.json(notification);
    } catch (error) {
      console.error(`Lỗi lấy thông tin thông báo:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Tạo thông báo mới
  createNotification: async (req, res) => {
    try {
      // Lấy dữ liệu từ request body
      const data = req.body;
      
      // Đánh dấu có đính kèm nếu có file
      if (req.files && req.files.length > 0) {
        data.hasAttachment = true;
      }
      
      // Tạo thông báo mới
      const notification = await Notification.create(data);
      
      res.status(201).json({
        message: `Tạo thông báo thành công`,
        notification
      });
    } catch (error) {
      console.error(`Lỗi tạo thông báo:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Cập nhật thông báo
  updateNotification: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      // Kiểm tra thông báo tồn tại
      const existingNotification = await Notification.findById(id);
      if (!existingNotification) {
        return res.status(404).json({ message: `Không tìm thấy thông báo` });
      }
      
      // Đánh dấu có đính kèm nếu có file mới hoặc đã có file cũ
      if ((req.files && req.files.length > 0) || existingNotification.hasAttachment) {
        data.hasAttachment = true;
      }
      
      // Cập nhật thông báo
      const updatedNotification = await Notification.update(id, data);
      
      res.json({
        message: `Cập nhật thông báo thành công`,
        notification: updatedNotification
      });
    } catch (error) {
      console.error(`Lỗi cập nhật thông báo:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Xóa thông báo
  deleteNotification: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra thông báo tồn tại
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ message: `Không tìm thấy thông báo` });
      }
      
      // Xóa thông báo (bao gồm file đính kèm trong Notification.delete)
      await Notification.delete(id);
      
      res.json({ message: `Xóa thông báo thành công` });
    } catch (error) {
      console.error(`Lỗi xóa thông báo:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
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
      
      // Nếu cần hiển thị thông tin về file đính kèm
      if (req.query.includeAttachments === 'true') {
        for (let notification of notifications.data) {
          if (notification.hasAttachment) {
            notification.attachments = await File.findByRelated('notification', notification.id);
          } else {
            notification.attachments = [];
          }
        }
      }
      
      res.json(notifications);
    } catch (error) {
      console.error('Lỗi lấy danh sách thông báo quan trọng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Lấy danh sách file đính kèm
  getAttachments: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra thông báo tồn tại
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ message: `Không tìm thấy thông báo` });
      }
      
      // Lấy danh sách file đính kèm
      const attachments = await File.findByRelated('notification', id);
      
      res.json({ attachments });
    } catch (error) {
      console.error('Lỗi lấy danh sách file đính kèm:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = notificationController;