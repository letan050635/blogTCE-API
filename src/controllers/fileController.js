const File = require('../models/File');
const googleDriveService = require('../services/googleDriveService');
const { ApiError } = require('../middleware/errorHandler');

const fileController = {
  /**
   * Upload file lên Google Drive và lưu thông tin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadFile: async (req, res, next) => {
    try {
      // Kiểm tra có file không
      if (!req.file) {
        throw ApiError.badRequest('Không có file nào được tải lên');
      }

      // Lấy thông tin loại và ID từ request
      const { relatedType, relatedId } = req.body;
      
      if (!relatedType || !relatedId) {
        throw ApiError.badRequest('Thiếu thông tin liên kết (relatedType hoặc relatedId)');
      }

      // Kiểm tra loại relatedType hợp lệ
      if (!['notification', 'regulation'].includes(relatedType)) {
        throw ApiError.badRequest('relatedType không hợp lệ, chỉ chấp nhận "notification" hoặc "regulation"');
      }

      // Upload file lên Google Drive
      const fileData = await googleDriveService.uploadFile(req.file, relatedType);

      // Lưu thông tin file vào DB
      const file = await File.create(fileData, relatedType, parseInt(relatedId));

      // Cập nhật trạng thái hasAttachment cho thông báo/quy định
      const updateTable = relatedType === 'notification' ? 'notifications' : 'regulations';
      await require('../config/db').query(
        `UPDATE ${updateTable} SET hasAttachment = TRUE WHERE id = ?`,
        [relatedId]
      );

      res.status(201).json({
        message: 'Tải file lên thành công',
        file
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lấy danh sách file theo loại và ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFiles: async (req, res, next) => {
    try {
      const { relatedType, relatedId } = req.params;

      // Kiểm tra thông tin đầu vào
      if (!relatedType || !relatedId) {
        throw ApiError.badRequest('Thiếu thông tin (relatedType hoặc relatedId)');
      }

      // Lấy danh sách file
      const files = await File.findByRelated(relatedType, parseInt(relatedId));

      res.json({
        files
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Xóa file theo ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteFile: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Xóa file
      await File.delete(parseInt(id));

      res.json({
        message: 'Xóa file thành công'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = fileController;