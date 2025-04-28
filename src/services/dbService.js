const { query } = require('../config/db');
const moment = require('moment');

/**
 * Service xử lý các thao tác cơ sở dữ liệu
 */
const dbService = {
  /**
   * Thực hiện truy vấn SQL với xử lý lỗi
   * @param {string} sql - Câu truy vấn SQL
   * @param {Array} params - Tham số
   * @returns {Promise<any>} - Kết quả truy vấn
   */
  executeQuery: async (sql, params = []) => {
    try {
      return await query(sql, params);
    } catch (error) {
      console.error('Lỗi truy vấn SQL:', error);
      throw error;
    }
  },
  
  /**
   * Chuyển đổi định dạng ngày
   * @param {string|Date} date - Ngày cần chuyển đổi
   * @param {string} format - Định dạng đầu ra (mặc định YYYY-MM-DD)
   * @returns {string|null} - Chuỗi ngày đã định dạng
   */
  formatDate: (date, format = 'YYYY-MM-DD') => {
    if (!date) return null;
    return moment(date).format(format);
  },
  
  /**
   * Lấy các tham số phân trang từ request
   * @param {Object} req - Express request object
   * @returns {Object} - Các tham số phân trang
   */
  getPaginationParams: (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  },
  
  /**
   * Tạo đối tượng phân trang
   * @param {number} total - Tổng số bản ghi
   * @param {number} limit - Số bản ghi mỗi trang
   * @param {number} page - Trang hiện tại
   * @returns {Object} - Thông tin phân trang
   */
  createPagination: (total, limit, page) => {
    return {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit
    };
  },
  
  /**
   * Tạo điều kiện WHERE từ các tham số tìm kiếm
   * @param {Object} options - Các tùy chọn tìm kiếm
   * @returns {Object} - Điều kiện WHERE và tham số
   */
  createWhereCondition: (options) => {
    const {
      search,
      searchFields = ['title', 'brief'],
      searchInContent = false,
      fromDate,
      toDate,
      filter,
      userId,
      itemType,
      additionalConditions = []
    } = options;
    
    const conditions = [...additionalConditions];
    const params = [];
    
    // Lọc theo trạng thái đọc
    if (userId && itemType && filter) {
      if (filter === 'read') {
        conditions.push(`urs.id IS NOT NULL`);
      } else if (filter === 'unread') {
        conditions.push(`urs.id IS NULL`);
      }
    }
    
    // Tìm kiếm
    if (search) {
      const searchConditions = [];
      
      searchFields.forEach(field => {
        searchConditions.push(`${field} LIKE ?`);
        params.push(`%${search}%`);
      });
      
      if (searchInContent) {
        searchConditions.push(`content LIKE ?`);
        params.push(`%${search}%`);
      }
      
      conditions.push(`(${searchConditions.join(' OR ')})`);
    }
    
    // Lọc theo ngày
    if (fromDate) {
      conditions.push(`date >= ?`);
      params.push(dbService.formatDate(fromDate));
    }
    
    if (toDate) {
      conditions.push(`date <= ?`);
      params.push(dbService.formatDate(toDate));
    }
    
    // Tạo mệnh đề WHERE
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    return { whereClause, params };
  },
  
  /**
   * Chuyển đổi định dạng ngày trong danh sách kết quả
   * @param {Array} results - Danh sách kết quả
   * @param {Array} dateFields - Các trường ngày cần định dạng
   * @param {string} format - Định dạng đầu ra
   * @returns {Array} - Danh sách kết quả đã định dạng
   */
  formatDateInResults: (results, dateFields = ['date', 'updateDate'], format = 'DD/MM/YYYY') => {
    return results.map(item => {
      const formattedItem = { ...item };
      
      dateFields.forEach(field => {
        if (formattedItem[field]) {
          formattedItem[field] = moment(formattedItem[field]).format(format);
        }
      });
      
      return formattedItem;
    });
  }
};

module.exports = dbService;