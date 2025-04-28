/**
 * Xử lý lỗi 404
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Không tìm thấy đường dẫn: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Xử lý lỗi toàn cục
 * @param {Error} err - Đối tượng lỗi
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log lỗi
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }
  
  // Chuẩn bị response
  const response = {
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
    // Chỉ trả về stack trace trong môi trường development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  // Thêm thông tin lỗi nếu có
  if (err.errors) {
    response.errors = err.errors;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Lớp ApiError để tạo lỗi với mã trạng thái HTTP
 */
class ApiError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message = 'Dữ liệu không hợp lệ', errors = null) {
    return new ApiError(message, 400, errors);
  }
  
  static unauthorized(message = 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn') {
    return new ApiError(message, 401);
  }
  
  static forbidden(message = 'Không có quyền truy cập') {
    return new ApiError(message, 403);
  }
  
  static notFound(message = 'Không tìm thấy tài nguyên') {
    return new ApiError(message, 404);
  }
  
  static internal(message = 'Lỗi máy chủ nội bộ') {
    return new ApiError(message, 500);
  }
}

module.exports = {
  notFoundHandler,
  errorHandler,
  ApiError
};