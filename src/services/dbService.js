const { query } = require('../config/db');
const moment = require('moment');

const dbService = {
  executeQuery: async (sql, params = []) => {
    try {
      return await query(sql, params);
    } catch (error) {
      console.error('Lỗi truy vấn SQL:', error);
      throw error;
    }
  },
  
  formatDate: (date, format = 'YYYY-MM-DD') => {
    if (!date) return null;
    return moment(date).format(format);
  },
  

  getPaginationParams: (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  },
  
  createPagination: (total, limit, page) => {
    return {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit
    };
  },
  
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