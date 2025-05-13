// src/controllers/fileController.js
const fs = require('fs');
const path = require('path');
const { driveService, upload } = require('../services/fileService');
const File = require('../models/File');
const uploadErrorHandler = require('../middleware/uploadErrorHandler');

const fileController = {
  // Middleware xử lý upload file với error handler
  uploadMiddleware: [
    upload.array('files', 5),
    uploadErrorHandler
  ],
  
  /**
   * Xử lý upload file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadFiles: async (req, res) => {
    try {
      // Log để debug
      console.log('Upload request received');
      console.log('Body:', req.body);
      console.log('Files:', req.files ? req.files.length : 0);
      
      const { relatedType, relatedId } = req.body;
      
      // Kiểm tra thông tin liên kết
      if (!relatedType || !relatedId) {
        return res.status(400).json({ message: 'Thiếu thông tin liên kết' });
      }
      
      // Kiểm tra file được upload
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Không có file nào được tải lên' });
      }
      
      const uploadedFiles = [];
      const errors = [];
      
      // Xử lý từng file một lần
      for (const file of req.files) {
        try {
          // Sử dụng tên file gốc đã được xử lý UTF-8 trong middleware
          const fileName = file.originalname;
          const mimeType = file.mimetype;
          const filePath = file.path;
          
          console.log(`Uploading file: ${fileName}`);
          console.log(`MIME type: ${mimeType}`);
          console.log(`File path: ${filePath}`);
          
          // Upload lên Google Drive với tên file gốc
          const fileData = await driveService.uploadFile(filePath, fileName, mimeType);
          
          // Thêm thông tin liên kết
          fileData.relatedType = relatedType;
          fileData.relatedId = parseInt(relatedId);
          
          console.log('File data to save:', fileData);
          
          // Lưu thông tin file vào database
          const savedFile = await File.create(fileData);
          uploadedFiles.push(savedFile);
          
          console.log(`File uploaded successfully: ${fileName}`);
          
          // Xóa file tạm sau khi upload thành công
          try {
            fs.unlinkSync(filePath);
            console.log(`Temp file deleted: ${filePath}`);
          } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
          }
        } catch (uploadError) {
          console.error(`Error uploading file ${file.originalname}:`, uploadError);
          errors.push({
            fileName: file.originalname,
            error: uploadError.message
          });
          
          // Xóa file tạm nếu upload thất bại
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up failed upload:', cleanupError);
          }
        }
      }
      
      // Xử lý kết quả
      if (uploadedFiles.length === 0 && errors.length > 0) {
        // Tất cả file đều thất bại
        return res.status(500).json({
          message: 'Không thể tải file lên',
          errors: errors
        });
      }
      
      // Một số hoặc tất cả file thành công
      const response = {
        message: `Đã tải lên ${uploadedFiles.length}/${req.files.length} file thành công`,
        files: uploadedFiles
      };
      
      if (errors.length > 0) {
        response.errors = errors;
      }
      
      // Set charset UTF-8 cho response
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in uploadFiles:', error);
      res.status(500).json({ 
        message: 'Lỗi khi tải file lên: ' + error.message 
      });
    }
  },
  
  /**
   * Lấy danh sách file theo item liên quan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getFilesByRelatedItem: async (req, res) => {
    try {
      const { relatedType, relatedId } = req.params;
      
      // Kiểm tra tham số
      if (!relatedType || !relatedId) {
        return res.status(400).json({ message: 'Thiếu thông tin liên kết' });
      }
      
      // Kiểm tra relatedType hợp lệ
      if (!['notification', 'regulation'].includes(relatedType)) {
        return res.status(400).json({ message: 'Loại liên kết không hợp lệ' });
      }
      
      // Lấy danh sách file
      const files = await File.findByRelatedItem(relatedType, relatedId);
      
      // Set charset UTF-8 cho response
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách file' });
    }
  },
  
  /**
   * Xóa file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteFile: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Deleting file with ID: ${id}`);
      
      // Lấy thông tin file từ database
      const file = await File.findById(id);
      
      if (!file) {
        return res.status(404).json({ message: 'Không tìm thấy file' });
      }
      
      console.log(`Found file to delete:`, file);
      
      // Xóa file từ Google Drive
      try {
        await driveService.deleteFile(file.fileId);
        console.log(`File deleted from Google Drive: ${file.fileId}`);
      } catch (driveError) {
        console.error('Error deleting file from Google Drive:', driveError);
        // Vẫn tiếp tục xóa từ database nếu xóa từ Drive thất bại
      }
      
      // Xóa thông tin file từ database
      await File.delete(id);
      console.log(`File deleted from database: ${id}`);
      
      res.json({ message: 'Xóa file thành công' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Lỗi khi xóa file' });
    }
  }
};

module.exports = fileController;