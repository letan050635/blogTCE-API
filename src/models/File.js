// src/models/File.js
const BaseModel = require('./BaseModel');
const { query } = require('../config/db');

class File {
  static TABLE_NAME = 'files';
  
  static async findById(id) {
    const files = await query(`SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, [id]);
    return files.length > 0 ? files[0] : null;
  }
  
  static async findByRelatedItem(relatedType, relatedId) {
    const files = await query(
      `SELECT * FROM ${this.TABLE_NAME} WHERE relatedType = ? AND relatedId = ?`, 
      [relatedType, relatedId]
    );
    return files;
  }
  
  static async create(fileData) {
    const { 
      fileId, fileName, fileType, fileSize, 
      viewLink, downloadLink, thumbnailLink, 
      relatedType, relatedId 
    } = fileData;
    
    const result = await query(
      `INSERT INTO ${this.TABLE_NAME} 
      (fileId, fileName, fileType, fileSize, viewLink, downloadLink, thumbnailLink, relatedType, relatedId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId, fileName, fileType, fileSize, 
        viewLink, downloadLink, thumbnailLink, 
        relatedType, relatedId
      ]
    );
    
    // Cập nhật trạng thái hasAttachment cho bảng liên quan
    await query(
      `UPDATE ${relatedType}s SET hasAttachment = true WHERE id = ?`,
      [relatedId]
    );
    
    return { id: result.insertId, ...fileData };
  }
  
  static async delete(id) {
    // Lấy thông tin file trước khi xóa
    const file = await this.findById(id);
    if (!file) return false;
    
    // Xóa file
    await query(`DELETE FROM ${this.TABLE_NAME} WHERE id = ?`, [id]);
    
    // Kiểm tra xem còn file nào liên quan đến item không
    const remainingFiles = await this.findByRelatedItem(file.relatedType, file.relatedId);
    
    // Nếu không còn file nào, cập nhật hasAttachment = false
    if (remainingFiles.length === 0) {
      await query(
        `UPDATE ${file.relatedType}s SET hasAttachment = false WHERE id = ?`,
        [file.relatedId]
      );
    }
    
    return true;
  }
  
  static async deleteByRelatedItem(relatedType, relatedId) {
    const files = await this.findByRelatedItem(relatedType, relatedId);
    
    if (files.length > 0) {
      await query(
        `DELETE FROM ${this.TABLE_NAME} WHERE relatedType = ? AND relatedId = ?`,
        [relatedType, relatedId]
      );
      
      // Cập nhật hasAttachment = false
      await query(
        `UPDATE ${relatedType}s SET hasAttachment = false WHERE id = ?`,
        [relatedId]
      );
    }
    
    return files.map(file => file.fileId);
  }
}

module.exports = File;