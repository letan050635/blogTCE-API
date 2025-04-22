const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/db');

/**
 * Middleware xác thực JWT
 * Kiểm tra token trong header và xác thực người dùng
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];

    // Xác thực token
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

/**
 * Middleware tùy chọn xác thực
 * Nếu có token thì xác thực, không có cũng không sao
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token, vẫn tiếp tục nhưng không đặt req.user
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await query('SELECT id, username, email, fullName, department, position, phone, avatar, role FROM users WHERE id = ?', [decoded.id]);

    if (user && user.length > 0) {
      req.user = user[0];
    }
    
    next();
  } catch (error) {
    // Token không hợp lệ, vẫn tiếp tục nhưng không đặt req.user
    next();
  }
};