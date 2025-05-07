const Notification = require('../models/Notification');
const File = require('../models/File');
const BaseController = require('./BaseController');
const { driveService } = require('../services/fileService');

/**
 * Controller xử lý thông báo
 */
const notificationController = {
  // Lấy danh sách thông báo
  getNotifications: BaseController.getList(Notification),
  
  // Lấy thông tin chi tiết thông báo
  getNotificationById: BaseController.getById(Notification),
  
  // Tạo thông báo mới
  createNotification: async (req, res) => {
    try {
      // Lấy dữ liệu từ request body
      const data = req.body;
      
      // Tạo thông báo mới
      const notification = await Notification.create(data);
      
      res.status(201).json({
        message: `Tạo thông báo thành công`,
        notification: notification
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
      
      // Xóa các file đính kèm liên quan
      if (notification.hasAttachment) {
        const files = await File.findByRelatedItem('notification', id);
        
        // Xóa từng file trên Google Drive
        for (const file of files) {
          try {
            await driveService.deleteFile(file.fileId);
          } catch (error) {
            console.warn(`Không thể xóa file ${file.fileId} từ Google Drive:`, error);
          }
        }
        
        // Xóa thông tin file trong database
        await File.deleteByRelatedItem('notification', id);
      }
      
      // Xóa thông báo
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

  // Lấy danh sách thông báo quan trọng
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
  },
  
  // Lấy danh sách file đính kèm của thông báo
  getAttachments: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra thông báo tồn tại
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ message: `Không tìm thấy thông báo` });
      }
      
      // Lấy danh sách file đính kèm
      const files = await File.findByRelatedItem('notification', id);
      
      res.json(files);
    } catch (error) {
      console.error('Lỗi lấy danh sách file đính kèm:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = notificationController;