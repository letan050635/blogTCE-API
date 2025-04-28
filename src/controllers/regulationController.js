const Regulation = require('../models/Regulation');
const BaseController = require('./BaseController');

/**
 * Controller xử lý quy định
 */
const regulationController = {
  // Lấy danh sách quy định
  getRegulations: BaseController.getList(Regulation),
  
  // Lấy thông tin chi tiết quy định
  getRegulationById: BaseController.getById(Regulation),
  
  // Tạo quy định mới
  createRegulation: BaseController.create(Regulation, 'quy định'),
  
  // Cập nhật quy định
  updateRegulation: BaseController.update(Regulation, 'quy định'),
  
  // Xóa quy định
  deleteRegulation: BaseController.delete(Regulation, 'quy định'),
  
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
  }
};

module.exports = regulationController;