// src/services/fileService.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Cấu hình xác thực Google Drive
const CREDENTIALS_PATH = path.join(__dirname, '../../config/credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Cấu hình multer để xử lý file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.initializeDrive();
  }

  initializeDrive() {
    try {
      // Đọc file credential
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        SCOPES
      );

      this.drive = google.drive({ version: 'v3', auth });
      console.log('Google Drive API initialized successfully!');
    } catch (error) {
      console.error('Error initializing Google Drive API:', error);
    }
  }

  async uploadFile(filePath, fileName, mimeType, folderId = null) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : []
      };

      const media = {
        mimeType,
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,mimeType,size,webViewLink,thumbnailLink'
      });

      // Thiết lập quyền truy cập công khai cho file
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Lấy link download
      const downloadLink = `https://drive.google.com/uc?export=download&id=${response.data.id}`;

      const fileData = {
        fileId: response.data.id,
        fileName: response.data.name,
        fileType: response.data.mimeType,
        fileSize: response.data.size,
        viewLink: response.data.webViewLink,
        downloadLink: downloadLink,
        thumbnailLink: response.data.thumbnailLink || null
      };

      return fileData;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw new Error('Không thể tải file lên Google Drive');
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw new Error('Không thể xóa file từ Google Drive');
    }
  }
}

module.exports = {
  driveService: new GoogleDriveService(),
  upload
};