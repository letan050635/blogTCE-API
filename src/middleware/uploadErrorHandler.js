// src/middleware/uploadErrorHandler.js
const multer = require('multer');

const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File quá lớn. Kích thước tối đa cho phép là 50MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Vượt quá số lượng file cho phép. Tối đa 5 file mỗi lần upload.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Field upload không hợp lệ.' 
      });
    }
  }
  
  // Xử lý lỗi khác
  if (err.name === 'PayloadTooLargeError') {
    return res.status(413).json({
      message: 'Dữ liệu gửi lên quá lớn. Giới hạn là 50MB.'
    });
  }
  
  next(err);
};

module.exports = uploadErrorHandler;