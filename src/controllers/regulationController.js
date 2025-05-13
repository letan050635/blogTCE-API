const Regulation = require('../models/Regulation');
const File = require('../models/File');
const BaseController = require('./BaseController');
const { driveService } = require('../services/fileService');

/**
 * Controller xử lý quy định
 */
const regulationController = {
  // Lấy danh sách quy định
  getRegulations: BaseController.getList(Regulation),
  
  // Lấy thông tin chi tiết quy định
  getRegulationById: BaseController.getById(Regulation),
  
  // Tạo quy định mới
  createRegulation: async (req, res) => {
    try {
      // Lấy dữ liệu từ request body
      const data = req.body;
      
      // Đảm bảo không có updateDate khi tạo mới
      delete data.updateDate;
      
      // Tạo quy định mới
      const regulation = await Regulation.create(data);
      
      res.status(201).json({
        message: `Tạo quy định thành công`,
        regulation: regulation
      });
    } catch (error) {
      console.error(`Lỗi tạo quy định:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Cập nhật quy định
  updateRegulation: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      
      // Kiểm tra quy định tồn tại
      const existingRegulation = await Regulation.findById(id);
      if (!existingRegulation) {
        return res.status(404).json({ message: `Không tìm thấy quy định` });
      }
      
      // updateDate sẽ được tự động set trong model
      
      // Cập nhật quy định
      const updatedRegulation = await Regulation.update(id, data);
      
      res.json({
        message: `Cập nhật quy định thành công`,
        regulation: updatedRegulation
      });
    } catch (error) {
      console.error(`Lỗi cập nhật quy định:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Xóa quy định
  deleteRegulation: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra quy định tồn tại
      const regulation = await Regulation.findById(id);
      if (!regulation) {
        return res.status(404).json({ message: `Không tìm thấy quy định` });
      }
      
      // Xóa các file đính kèm liên quan
      if (regulation.hasAttachment) {
        const files = await File.findByRelatedItem('regulation', id);
        
        // Xóa từng file trên Google Drive
        for (const file of files) {
          try {
            await driveService.deleteFile(file.fileId);
          } catch (error) {
            console.warn(`Không thể xóa file ${file.fileId} từ Google Drive:`, error);
          }
        }
        
        // Xóa thông tin file trong database
        await File.deleteByRelatedItem('regulation', id);
      }
      
      // Xóa quy định
      await Regulation.delete(id);
      
      res.json({ message: `Xóa quy định thành công` });
    } catch (error) {
      console.error(`Lỗi xóa quy định:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Cập nhật trạng thái đọc quy định
  updateReadStatus: BaseController.updateReadStatus(Regulation, 'quy định'),
  
  // Đánh dấu tất cả quy định là đã đọc
  markAllAsRead: BaseController.markAllAsRead(Regulation, 'quy định'),
  
  /**
   * Lấy danh sách quy định quan trọng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getImportantRegulations: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const userId = req.user ? req.user.id : null;
      
      // Lấy danh sách quy định quan trọng
      const regulations = await Regulation.findImportant(limit, userId);
      
      res.json(regulations);
    } catch (error) {
      console.error('Lỗi lấy danh sách quy định quan trọng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Lấy danh sách file đính kèm của quy định
  getAttachments: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra quy định tồn tại
      const regulation = await Regulation.findById(id);
      if (!regulation) {
        return res.status(404).json({ message: `Không tìm thấy quy định` });
      }
      
      // Lấy danh sách file đính kèm
      const files = await File.findByRelatedItem('regulation', id);
      
      res.json(files);
    } catch (error) {
      console.error('Lỗi lấy danh sách file đính kèm:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = regulationController;