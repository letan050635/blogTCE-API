const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/db');

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const getUserFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Thêm defensive coding
    if (!decoded || !decoded.id) {
      return null;
    }
    
    const users = await query(
      'SELECT id, username, email, fullName, department, position, phone, avatar, role FROM users WHERE id = ?', 
      [decoded.id]
    );
    
    return users && users.length > 0 ? users[0] : null;
  } catch (error) {
    return null;
  }
};

exports.authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }
    
    try {
      const user = await getUserFromToken(token);
      
      if (!user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại' });
      }
      
      // Gán thông tin người dùng vào request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn' });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token không hợp lệ' });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

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
    const token = extractToken(req);
    
    if (!token) {
      // Không có token, vẫn tiếp tục nhưng không đặt req.user
      return next();
    }
    
    const user = await getUserFromToken(token);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.log('Lỗi trong optionalAuth:', error);
    // Vẫn tiếp tục mà không đặt req.user
    next();
  }
};