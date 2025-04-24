const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/db');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    // Kiểm tra người dùng trong cơ sở dữ liệu
    const user = await query('SELECT id, username, email, fullName, department, position, phone, avatar, role FROM users WHERE id = ?', [decoded.id]);

    if (!user || user.length === 0) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }

    // Gán thông tin người dùng vào request
    req.user = user[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

/**
 * Middleware kiểm tra quyền admin
 * Yêu cầu chạy sau middleware authenticate
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Không có thông tin xác thực' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  next();
};


exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token, vẫn tiếp tục nhưng không đặt req.user
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Thêm defensive coding
      if (!decoded || !decoded.id) {
        console.log('Token không hợp lệ hoặc thiếu ID');
        return next();
      }

      const users = await query('SELECT id, username, email, fullName, department, position, phone, avatar, role FROM users WHERE id = ?', [decoded.id]);

      if (users && users.length > 0) {
        req.user = users[0];
      }
    } catch (error) {
      console.log('Lỗi xác thực token:', error.message);
      // Vẫn tiếp tục mà không đặt req.user
    }
    
    next();
  } catch (error) {
    console.error('Lỗi trong optionalAuth:', error);
    // Đổi sang next() thay vì trả về lỗi 500
    next();
  }
};