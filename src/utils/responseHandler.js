const responseHandler = {
    success: (res, data = null, message = 'Thành công', statusCode = 200) => {
      const response = {
        success: true,
        message
      };
      
      if (data !== null) {
        if (data && typeof data === 'object' && data.data && data.pagination) {
          response.data = data.data;
          response.pagination = data.pagination;
        } else {
          response.data = data;
        }
      }
      
      return res.status(statusCode).json(response);
    },
    
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
    
    notFound: (res, message = 'Không tìm thấy tài nguyên') => {
      return responseHandler.error(res, message, 404);
    },
    
    forbidden: (res, message = 'Không có quyền truy cập') => {
      return responseHandler.error(res, message, 403);
    },
    
    badRequest: (res, message = 'Dữ liệu không hợp lệ', errors = null) => {
      return responseHandler.error(res, message, 400, errors);
    },
    
    unauthorized: (res, message = 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn') => {
      return responseHandler.error(res, message, 401);
    }
  };
  
  module.exports = responseHandler;