// src/services/fileService.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Cấu hình xác thực Google Drive
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json'); // Đường dẫn đúng đến file gốc
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const DEFAULT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null; // Thêm folder ID mặc định

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
      // Kiểm tra file credentials.json tồn tại
      console.log('Đường dẫn đến file credentials:', CREDENTIALS_PATH);
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('File credentials.json không tồn tại tại đường dẫn:', CREDENTIALS_PATH);
        return;
      }
      
      // Đọc file credential
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      
      // Log email service account để xác nhận
      console.log('Đang sử dụng service account:', credentials.client_email);
      
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
      if (error.stack) console.error(error.stack);
    }
  }

  async uploadFile(filePath, fileName, mimeType, folderId = DEFAULT_FOLDER_ID) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : []
      };

      const media = {
        mimeType,
        body: fs.createReadStream(filePath)
      };

      console.log('Đang tải file lên Google Drive...');
      console.log('File metadata:', { name: fileName, folderId });
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,mimeType,size,webViewLink,thumbnailLink'
      });

      console.log('File đã được tải lên với ID:', response.data.id);

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
      // Ghi lại chi tiết lỗi để dễ dàng debug
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      }
      throw new Error('Không thể tải file lên Google Drive: ' + error.message);
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      console.log('File đã xóa thành công:', fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
      }
      throw new Error('Không thể xóa file từ Google Drive: ' + error.message);
    }
  }
}

module.exports = {
  driveService: new GoogleDriveService(),
  upload
};