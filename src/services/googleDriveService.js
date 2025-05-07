const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến credentials file từ Google Cloud Console
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

// ID của folder lưu trữ trong Google Drive (tạo folder trên Drive và lấy ID)
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'your_folder_id';

// Tạo jwtClient để xác thực
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const driveService = google.drive({ version: 'v3', auth });

const googleDriveService = {
  /**
   * Upload file lên Google Drive
   * @param {Object} fileObject - Đối tượng file từ req.file của multer
   * @param {string} relatedType - Loại liên quan ('notification' hoặc 'regulation')
   * @returns {Promise<Object>} - Thông tin file đã upload
   */
  async uploadFile(fileObject, relatedType) {
    try {
      // Đọc nội dung file
      const fileContent = fs.createReadStream(fileObject.path);

      // Chuẩn bị metadata cho file
      const fileMetadata = {
        name: fileObject.originalname,
        parents: [FOLDER_ID]
      };

      // Chuẩn bị media
      const media = {
        mimeType: fileObject.mimetype,
        body: fileContent
      };

      // Upload file lên Google Drive
      const response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink'
      });

      // Cập nhật quyền cho file (public - ai cũng có thể xem)
      await driveService.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Refresh để lấy link xem file
      const file = await driveService.files.get({
        fileId: response.data.id,
        fields: 'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink'
      });

      // Xoá file tạm sau khi upload
      fs.unlinkSync(fileObject.path);

      return {
        fileId: file.data.id,
        fileName: file.data.name,
        fileType: file.data.mimeType,
        fileSize: file.data.size,
        viewLink: file.data.webViewLink,
        downloadLink: file.data.webContentLink,
        thumbnailLink: file.data.thumbnailLink || null
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  },

  /**
   * Xoá file khỏi Google Drive
   * @param {string} fileId - ID của file trên Google Drive
   * @returns {Promise<boolean>} - Kết quả xoá
   */
  async deleteFile(fileId) {
    try {
      await driveService.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw error;
    }
  }
};

module.exports = googleDriveService;