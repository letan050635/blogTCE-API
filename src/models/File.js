const BaseModel = require('./BaseModel');
const googleDriveService = require('../services/googleDriveService');
const { query } = require('../config/db');

class File {
  static TABLE_NAME = 'files';

  /**
   * Tạo bản ghi file mới
   * @param {Object} fileData - Thông tin file từ Google Drive
   * @param {string} relatedType - Loại liên quan ('notification' hoặc 'regulation')
   * @param {number} relatedId - ID của thông báo/quy định
   * @returns {Promise<Object>} - Thông tin file đã tạo
   */
  static async create(fileData, relatedType, relatedId) {
    const fields = [
      'fileId', 'fileName', 'fileType', 'fileSize',
      'viewLink', 'downloadLink', 'thumbnailLink',
      'relatedType', 'relatedId'
    ];

    // Gán giá trị cho các trường liên quan
    fileData.relatedType = relatedType;
    fileData.relatedId = relatedId;

    try {
      // Sử dụng BaseModel.create để tạo bản ghi
      const result = await query(
        `INSERT INTO ${this.TABLE_NAME} (${fields.join(', ')}) 
         VALUES (${fields.map(() => '?').join(', ')})`,
        fields.map(field => fileData[field] !== undefined ? fileData[field] : null)
      );

      return {
        id: result.insertId,
        ...fileData
      };
    } catch (error) {
      console.error('Error creating file record:', error);
      throw error;
    }
  }

  /**
   * Tìm tất cả file theo loại và ID
   * @param {string} relatedType - Loại liên quan ('notification' hoặc 'regulation')
   * @param {number} relatedId - ID của thông báo/quy định
   * @returns {Promise<Array>} - Danh sách file
   */
  static async findByRelated(relatedType, relatedId) {
    try {
      const files = await query(
        `SELECT * FROM ${this.TABLE_NAME} WHERE relatedType = ? AND relatedId = ?`,
        [relatedType, relatedId]
      );
      return files;
    } catch (error) {
      console.error('Error finding files:', error);
      throw error;
    }
  }

  /**
   * Xóa file theo ID
   * @param {number} id - ID của bản ghi file
   * @returns {Promise<boolean>} - Kết quả xóa
   */
  static async delete(id) {
    try {
      // Lấy thông tin file trước khi xóa
      const files = await query(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      if (files.length === 0) {
        throw new Error('File không tồn tại');
      }

      const file = files[0];

      // Xóa file trên Google Drive
      await googleDriveService.deleteFile(file.fileId);

      // Xóa bản ghi trong DB
      await query(
        `DELETE FROM ${this.TABLE_NAME} WHERE id = ?`,
        [id]
      );

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Xóa tất cả file theo loại và ID
   * @param {string} relatedType - Loại liên quan ('notification' hoặc 'regulation')
   * @param {number} relatedId - ID của thông báo/quy định
   * @returns {Promise<boolean>} - Kết quả xóa
   */
  static async deleteByRelated(relatedType, relatedId) {
    try {
      // Lấy tất cả file liên quan
      const files = await this.findByRelated(relatedType, relatedId);

      // Xóa từng file trên Google Drive
      for (const file of files) {
        await googleDriveService.deleteFile(file.fileId);
      }

      // Xóa tất cả bản ghi trong DB
      await query(
        `DELETE FROM ${this.TABLE_NAME} WHERE relatedType = ? AND relatedId = ?`,
        [relatedType, relatedId]
      );

      return true;
    } catch (error) {
      console.error('Error deleting files by related:', error);
      throw error;
    }
  }
}

module.exports = File;