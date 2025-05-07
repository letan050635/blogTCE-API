// src/controllers/fileController.js
const fs = require('fs');
const path = require('path');
const { driveService, upload } = require('../services/fileService');
const File = require('../models/File');

const fileController = {
  // Middleware xử lý upload file
  uploadMiddleware: upload.array('files', 5), // Cho phép upload tối đa 5 file cùng lúc
  
  // Xử lý upload file
  uploadFiles: async (req, res) => {
    try {
      const { relatedType, relatedId } = req.body;
      
      if (!relatedType || !relatedId) {
        return res.status(400).json({ message: 'Thiếu thông tin liên kết' });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Không có file nào được tải lên' });
      }
      
      const uploadedFiles = [];
      
      // Upload từng file lên Google Drive
      for (const file of req.files) {
        const fileName = file.originalname;
        const mimeType = file.mimetype;
        const filePath = file.path;
        
        // Upload lên Google Drive
        const fileData = await driveService.uploadFile(filePath, fileName, mimeType);
        
        // Thêm thông tin liên kết
        fileData.relatedType = relatedType;
        fileData.relatedId = relatedId;
        
        // Lưu thông tin file vào database
        const savedFile = await File.create(fileData);
        uploadedFiles.push(savedFile);
        
        // Xóa file tạm
        fs.unlinkSync(filePath);
      }
      
      res.status(201).json({
        message: 'Upload file thành công',
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Lỗi khi tải file lên: ' + error.message });
    }
  },
  
  // Lấy danh sách file theo loại và ID của item liên quan
  getFilesByRelatedItem: async (req, res) => {
    try {
      const { relatedType, relatedId } = req.params;
      
      if (!relatedType || !relatedId) {
        return res.status(400).json({ message: 'Thiếu thông tin liên kết' });
      }
      
      const files = await File.findByRelatedItem(relatedType, relatedId);
      
      res.json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách file' });
    }
  },
  
  // Xóa file
  deleteFile: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Lấy thông tin file từ database
      const file = await File.findById(id);
      
      if (!file) {
        return res.status(404).json({ message: 'Không tìm thấy file' });
      }
      
      // Xóa file từ Google Drive
      await driveService.deleteFile(file.fileId);
      
      // Xóa thông tin file từ database
      await File.delete(id);
      
      res.json({ message: 'Xóa file thành công' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Lỗi khi xóa file' });
    }
  }
};

module.exports = fileController;