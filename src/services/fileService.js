
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Cấu hình xác thực Google Drive
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json'); 
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const DEFAULT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || null; 

// Cấu hình multer để xử lý file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Fix encoding issue - Convert từ Latin-1 sang UTF-8
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    
    // Tạo tên file an toàn cho hệ thống (chỉ dùng để lưu tạm)
    const safeFileName = `${uniqueSuffix}${extension}`;
    cb(null, safeFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, 
    files: 5 
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
        // Đảm bảo tên file được encode đúng với UTF-8
        name: fileName,
        parents: folderId ? [folderId] : []
      };

      // Sử dụng stream để đọc file, tối ưu memory
      const media = {
        mimeType,
        body: fs.createReadStream(filePath)
      };

      console.log('Đang tải file lên Google Drive...');
      console.log('File metadata:', { name: fileName, folderId });
      
      // Request với fields tối thiểu để response nhanh hơn
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,mimeType,size'
      });

      console.log('File đã được tải lên với ID:', response.data.id);

      // Set quyền truy cập không đồng bộ (không chờ)
      this.setPublicPermission(response.data.id).catch(err => {
        console.warn('Error setting permissions:', err);
      });

      // Tạo links trực tiếp
      const downloadLink = `https://drive.google.com/uc?export=download&id=${response.data.id}`;
      const viewLink = `https://drive.google.com/file/d/${response.data.id}/view`;

      const fileData = {
        fileId: response.data.id,
        fileName: response.data.name,
        fileType: response.data.mimeType,
        fileSize: response.data.size,
        viewLink: viewLink,
        downloadLink: downloadLink,
        thumbnailLink: null
      };

      return fileData;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      }
      throw new Error('Không thể tải file lên Google Drive: ' + error.message);
    }
  }

  // Hàm set permission riêng để có thể chạy async
  async setPublicPermission(fileId) {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (error) {
      console.error('Error setting file permissions:', error);
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