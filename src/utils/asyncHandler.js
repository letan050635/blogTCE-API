/**
 * Bọc các hàm async cho controllers để bắt lỗi tự động
 * @param {Function} fn - Hàm async cần bọc
 * @returns {Function} - Hàm đã được bọc
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  module.exports = asyncHandler;