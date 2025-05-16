const { query } = require('../config/db');
const moment = require('moment');

class BaseModel {
  static async findById(table, id, userId = null, itemType = null) {
    let item;
    
    if (userId && itemType) {
      // Nếu có userId, lấy cả trạng thái đọc
      const items = await query(
        `SELECT t.*,
         CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as \`read\`
         FROM ${table} t
         LEFT JOIN user_read_status urs ON t.id = urs.itemId AND urs.itemType = ? AND urs.userId = ?
         WHERE t.id = ?`,
        [itemType, userId, id]
      );
      item = items.length > 0 ? items[0] : null;
    } else {
      // Nếu không có userId, chỉ lấy thông tin bản ghi
      const items = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      item = items.length > 0 ? items[0] : null;
    }
    
    if (item) {
      // Chuyển đổi định dạng ngày
      if (item.date) {
        item.date = moment(item.date).format('DD/MM/YYYY');
      }
      if (item.updateDate) {
        item.updateDate = moment(item.updateDate).format('DD/MM/YYYY');
      }
    }
    
    return item;
  }
  
  static async create(table, data, fields, itemType = null) {
    // Chuyển đổi định dạng ngày
    if (data.date) {
      data.date = moment(data.date).format('YYYY-MM-DD');
    }
    // Khi tạo mới, không có updateDate
    if (data.updateDate === null || data.updateDate === '') {
      delete data.updateDate;
      fields = fields.filter(field => field !== 'updateDate');
    }
    
    // Chuẩn bị các trường và giá trị
    const columns = fields.join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => data[field] !== undefined ? data[field] : null);
    
    // Chèn vào DB
    const result = await query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
      values
    );
    
    // Trả về thông tin bản ghi
    return await this.findById(table, result.insertId, null, itemType);
  }
  
  static async update(table, id, data, allowedFields, itemType = null) {
    const updateData = {};
    const params = [];
    
    // Chuyển đổi định dạng ngày
    if (data.date) {
      data.date = moment(data.date).format('YYYY-MM-DD');
    }
    if (data.updateDate) {
      data.updateDate = moment(data.updateDate).format('YYYY-MM-DD');
    }
    
    // Lọc và đưa vào mảng params
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
        params.push(data[field]);
      }
    });
    
    // Nếu không có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      return await this.findById(table, id, null, itemType);
    }
    
    // Tạo câu lệnh SQL động
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
    params.push(id); 
    
    // Thực hiện cập nhật
    await query(`UPDATE ${table} SET ${fields} WHERE id = ?`, params);
    
    // Trả về thông tin sau khi cập nhật
    return await this.findById(table, id, null, itemType);
  }
  
  static async delete(table, id, itemType) {
    // Xóa các bản ghi liên quan trong user_read_status
    if (itemType) {
      await query('DELETE FROM user_read_status WHERE itemId = ? AND itemType = ?', [id, itemType]);
    }
    
    // Xóa bản ghi chính
    const result = await query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
  
  static async findAll(table, options = {}, itemType = null, additionalConditions = [], orderBy = '') {
    const {
      page = 1,
      limit = 10,
      filter = null,
      search = null,
      searchFields = ['title', 'brief'],
      searchInContent = false,
      userId = null,
      fromDate = null,
      toDate = null
    } = options;
    
    const offset = (page - 1) * limit;
    const params = [];
    
    // Xây dựng câu truy vấn cơ bản
    let sql = `SELECT t.*`;
    let countSql = `SELECT COUNT(*) as total`;
    
    // Nếu có userId và itemType, lấy cả trạng thái đọc
    if (userId && itemType) {
      sql += `, CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as \`read\``;
      sql += ` FROM ${table} t LEFT JOIN user_read_status urs ON t.id = urs.itemId AND urs.itemType = ? AND urs.userId = ?`;
      countSql += ` FROM ${table} t LEFT JOIN user_read_status urs ON t.id = urs.itemId AND urs.itemType = ? AND urs.userId = ?`;
      params.push(itemType, userId);
    } else {
      sql += ` FROM ${table} t`;
      countSql += ` FROM ${table} t`;
    }
    
    // Thêm điều kiện where
    let conditions = [...additionalConditions];
    
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
      for (const field of searchFields) {
        searchConditions.push(`t.${field} LIKE ?`);
        params.push(`%${search}%`);
      }
      
      // Tìm kiếm trong content nếu được chỉ định
      if (searchInContent) {
        searchConditions.push(`t.content LIKE ?`);
        params.push(`%${search}%`);
      }
      
      conditions.push(`(${searchConditions.join(' OR ')})`);
    }
    
    // Lọc theo ngày
    if (fromDate) {
      conditions.push(`t.date >= ?`);
      params.push(moment(fromDate).format('YYYY-MM-DD'));
    }
    
    if (toDate) {
      conditions.push(`t.date <= ?`);
      params.push(moment(toDate).format('YYYY-MM-DD'));
    }
    
    // Thêm điều kiện vào câu truy vấn
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }
    
    // Thêm sắp xếp
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    } else {
      sql += ` ORDER BY t.date DESC`;
    }
    
    // Thêm phân trang
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // Đếm tổng số bản ghi
    const countResult = await query(countSql, params.slice(0, -2)); // Bỏ limit và offset
    const total = countResult[0].total;
    
    // Lấy danh sách bản ghi
    const items = await query(sql, params);
    
    // Chuyển đổi định dạng ngày
    items.forEach(item => {
      if (item.date) {
        item.date = moment(item.date).format('DD/MM/YYYY');
      }
      if (item.updateDate) {
        item.updateDate = moment(item.updateDate).format('DD/MM/YYYY');
      }
    });
    
    return {
      data: items,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
  
  static async updateReadStatus(id, userId, read, itemType) {
    if (read) {
      // Đánh dấu đã đọc
      await query(
        `INSERT INTO user_read_status (userId, itemId, itemType) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE readAt = CURRENT_TIMESTAMP`,
        [userId, id, itemType]
      );
    } else {
      // Đánh dấu chưa đọc
      await query(
        `DELETE FROM user_read_status WHERE userId = ? AND itemId = ? AND itemType = ?`,
        [userId, id, itemType]
      );
    }
    return true;
  }
  
  static async markAllAsRead(table, userId, itemType) {
    // Lấy danh sách chưa đọc
    const unreadItems = await query(
      `SELECT t.id 
       FROM ${table} t 
       LEFT JOIN user_read_status urs ON t.id = urs.itemId AND urs.itemType = ? AND urs.userId = ? 
       WHERE urs.id IS NULL`,
      [itemType, userId]
    );
    
    // Nếu không có mục chưa đọc
    if (unreadItems.length === 0) {
      return true;
    }
    
    // Thêm các bản ghi vào user_read_status
    const values = unreadItems.map(item => {
      return `(${userId}, ${item.id}, '${itemType}', CURRENT_TIMESTAMP)`;
    }).join(', ');
    
    await query(
      `INSERT INTO user_read_status (userId, itemId, itemType, readAt) VALUES ${values}`
    );
    
    return true;
  }
}

module.exports = BaseModel;