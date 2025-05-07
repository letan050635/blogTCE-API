const Regulation = require('../models/Regulation');
const BaseController = require('./BaseController');
const File = require('../models/File');

/**
 * Controller xử lý quy định
 */
const regulationController = {
  // Lấy danh sách quy định
  getRegulations: BaseController.getList(Regulation),
  
  // Lấy thông tin chi tiết quy định
  getRegulationById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user ? req.user.id : null;
      
      // Lấy thông tin quy định
      const regulation = await Regulation.findById(id, userId);
      
      if (!regulation) {
        return res.status(404).json({ message: 'Không tìm thấy quy định' });
      }
      
      // Lấy các file đính kèm
      const attachments = await File.findByRelated('regulation', id);
      
      // Thêm thông tin file đính kèm vào response
      regulation.attachments = attachments || [];
      
      res.json(regulation);
    } catch (error) {
      console.error(`Lỗi lấy thông tin quy định:`, error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Tạo quy định mới
  createRegulation: async (req, res) => {
    try {
      // Lấy dữ liệu từ request body
      const data = req.body;
      
      // Đánh dấu có đính kèm nếu có file
      if (req.files && req.files.length > 0) {
        data.hasAttachment = true;
      }
      
      // Tạo quy định mới
      const regulation = await Regulation.create(data);
      
      res.status(201).json({
        message: `Tạo quy định thành công`,
        regulation
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
      
      // Đánh dấu có đính kèm nếu có file mới hoặc đã có file cũ
      if ((req.files && req.files.length > 0) || existingRegulation.hasAttachment) {
        data.hasAttachment = true;
      }
      
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
      
      // Xóa quy định (bao gồm file đính kèm trong Regulation.delete)
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
      
      // Nếu cần hiển thị thông tin về file đính kèm
      if (req.query.includeAttachments === 'true') {
        for (let regulation of regulations.data) {
          if (regulation.hasAttachment) {
            regulation.attachments = await File.findByRelated('regulation', regulation.id);
          } else {
            regulation.attachments = [];
          }
        }
      }
      
      res.json(regulations);
    } catch (error) {
      console.error('Lỗi lấy danh sách quy định quan trọng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  // Lấy danh sách file đính kèm
  getAttachments: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Kiểm tra quy định tồn tại
      const regulation = await Regulation.findById(id);
      if (!regulation) {
        return res.status(404).json({ message: `Không tìm thấy quy định` });
      }
      
      // Lấy danh sách file đính kèm
      const attachments = await File.findByRelated('regulation', id);
      
      res.json({ attachments });
    } catch (error) {
      console.error('Lỗi lấy danh sách file đính kèm:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = regulationController;