const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Service xử lý JWT token
 */
const jwtService = {
  /**
   * Tạo JWT token
   * @param {number} userId - ID người dùng
   * @returns {string} - JWT token
   */
  generateToken: (userId) => {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  },
  
  /**
   * Xác thực và giải mã token
   * @param {string} token - JWT token
   * @returns {Object|null} - Payload giải mã hoặc null
   */
  verifyToken: (token) => {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
};

module.exports = jwtService;