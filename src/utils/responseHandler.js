/**
 * Utility để xử lý các response chuẩn hóa
 */
const responseHandler = {
    /**
     * Trả về thành công
     * @param {Object} res - Express response object
     * @param {any} data - Dữ liệu cần trả về
     * @param {string} message - Thông báo thành công
     * @param {number} statusCode - Mã trạng thái HTTP
     */
    success: (res, data = null, message = 'Thành công', statusCode = 200) => {
      const response = {
        success: true,
        message
      };
      
      if (data !== null) {
        // Nếu data là object có thể chứa 'data' và 'pagination'
        if (data && typeof data === 'object' && data.data && data.pagination) {
          response.data = data.data;
          response.pagination = data.pagination;
        } else {
          response.data = data;
        }
      }
      
      return res.status(statusCode).json(response);
    },
    
    /**
     * Trả về lỗi
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     * @param {number} statusCode - Mã trạng thái HTTP
     * @param {any} errors - Chi tiết lỗi (nếu có)
     */
    error: (res, message = 'Lỗi máy chủ', statusCode = 500, errors = null) => {
      const response = {
        success: false,
        message
      };
      
      if (errors) {
        response.errors = errors;
      }
      
      return res.status(statusCode).json(response);
    },
    
    /**
     * Trả về lỗi khi không tìm thấy tài nguyên
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     */
    notFound: (res, message = 'Không tìm thấy tài nguyên') => {
      return responseHandler.error(res, message, 404);
    },
    
    /**
     * Trả về lỗi khi không có quyền truy cập
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     */
    forbidden: (res, message = 'Không có quyền truy cập') => {
      return responseHandler.error(res, message, 403);
    },
    
    /**
     * Trả về lỗi khi dữ liệu không hợp lệ
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     * @param {any} errors - Chi tiết lỗi
     */
    badRequest: (res, message = 'Dữ liệu không hợp lệ', errors = null) => {
      return responseHandler.error(res, message, 400, errors);
    },
    
    /**
     * Trả về lỗi khi chưa đăng nhập
     * @param {Object} res - Express response object
     * @param {string} message - Thông báo lỗi
     */
    unauthorized: (res, message = 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn') => {
      return responseHandler.error(res, message, 401);
    }
  };
  
  module.exports = responseHandler;