const { query } = require('../config/db');
const moment = require('moment');

class Regulation {
  /**
   * Tạo quy định mới
   * @param {Object} data - Dữ liệu quy định
   * @returns {Object} - Thông tin quy định đã tạo
   */
  static async create(data) {
    const { 
      title, 
      brief, 
      content, 
      date, 
      updateDate = null, 
      isNew = true, 
      isImportant = false, 
      useHtml = true 
    } = data;
    
    // Chuyển đổi định dạng ngày
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const formattedUpdateDate = updateDate ? moment(updateDate).format('YYYY-MM-DD') : null;
    
    // Chèn vào DB
    const result = await query(
      `INSERT INTO regulations (title, brief, content, date, updateDate, isNew, isImportant, useHtml) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, brief, content, formattedDate, formattedUpdateDate, isNew, isImportant, useHtml]
    );
    
    // Trả về thông tin quy định
    return await this.findById(result.insertId);
  }
  
  /**
   * Tìm quy định theo ID
   * @param {number} id - ID quy định
   * @param {number} userId - ID người dùng (tùy chọn để lấy trạng thái đọc)
   * @returns {Object|null} - Thông tin quy định hoặc null
   */
  static async findById(id, userId = null) {
    let regulation;
    
    if (userId) {
      // Nếu có userId, lấy cả trạng thái đọc
      const regulations = await query(
        `SELECT r.*,
         CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as read
         FROM regulations r
         LEFT JOIN user_read_status urs ON r.id = urs.itemId AND urs.itemType = 'regulation' AND urs.userId = ?
         WHERE r.id = ?`,
        [userId, id]
      );
      regulation = regulations.length > 0 ? regulations[0] : null;
    } else {
      // Nếu không có userId, chỉ lấy thông tin quy định
      const regulations = await query('SELECT * FROM regulations WHERE id = ?', [id]);
      regulation = regulations.length > 0 ? regulations[0] : null;
    }
    
    if (regulation) {
      // Chuyển đổi định dạng ngày
      regulation.date = moment(regulation.date).format('DD/MM/YYYY');
      if (regulation.updateDate) {
        regulation.updateDate = moment(regulation.updateDate).format('DD/MM/YYYY');
      }
    }
    
    return regulation;
  }
  
  /**
   * Cập nhật quy định
   * @param {number} id - ID quy định
   * @param {Object} data - Dữ liệu cần cập nhật
   * @returns {Object} - Thông tin quy định sau khi cập nhật
   */
  static async update(id, data) {
    const allowedFields = ['title', 'brief', 'content', 'date', 'updateDate', 'isNew', 'isImportant', 'useHtml'];
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
      return await this.findById(id);
    }
    
    // Tạo câu lệnh SQL động
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
    params.push(id); // Thêm id vào cuối mảng params
    
    // Thực hiện cập nhật
    await query(`UPDATE regulations SET ${fields} WHERE id = ?`, params);
    
    // Trả về thông tin quy định đã cập nhật
    return await this.findById(id);
  }
  
  /**
   * Xóa quy định
   * @param {number} id - ID quy định
   * @returns {boolean} - Kết quả xóa
   */
  static async delete(id) {
    // Xóa các bản ghi liên quan trong user_read_status
    await query('DELETE FROM user_read_status WHERE itemId = ? AND itemType = ?', [id, 'regulation']);
    
    // Xóa quy định
    const result = await query('DELETE FROM regulations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Lấy danh sách quy định
   * @param {Object} options - Tùy chọn tìm kiếm và phân trang
   * @returns {Object} - Danh sách quy định và thông tin phân trang
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      filter = null,
      search = null,
      userId = null,
      isImportant = null
    } = options;
    
    const offset = (page - 1) * limit;
    const params = [];
    
    // Xây dựng câu truy vấn cơ bản
    let sql = `SELECT r.*`;
    let countSql = `SELECT COUNT(*) as total`;
    
    // Nếu có userId, lấy cả trạng thái đọc
    if (userId) {
      sql += `, CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as read`;
      sql += ` FROM regulations r LEFT JOIN user_read_status urs ON r.id = urs.itemId AND urs.itemType = 'regulation' AND urs.userId = ?`;
      countSql += ` FROM regulations r LEFT JOIN user_read_status urs ON r.id = urs.itemId AND urs.itemType = 'regulation' AND urs.userId = ?`;
      params.push(userId);
    } else {
      sql += ` FROM regulations r`;
      countSql += ` FROM regulations r`;
    }
    
    // Thêm điều kiện where
    let conditions = [];
    
    // Lọc theo trạng thái đọc
    if (userId && filter) {
      if (filter === 'read') {
        conditions.push(`urs.id IS NOT NULL`);
      } else if (filter === 'unread') {
        conditions.push(`urs.id IS NULL`);
      }
    }
    
    // Lọc theo quan trọng
    if (isImportant !== null) {
      conditions.push(`r.isImportant = ?`);
      params.push(isImportant);
    }
    
    // Tìm kiếm
    if (search) {
      conditions.push(`(r.title LIKE ? OR r.brief LIKE ? OR r.content LIKE ?)`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Thêm điều kiện vào câu truy vấn
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }
    
    // Thêm sắp xếp và phân trang
    sql += ` ORDER BY r.isImportant DESC, r.isNew DESC, r.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    // Đếm tổng số quy định
    const countResult = await query(countSql, params.slice(0, -2)); // Bỏ limit và offset
    const total = countResult[0].total;
    
    // Lấy danh sách quy định
    const regulations = await query(sql, params);
    
    // Chuyển đổi định dạng ngày
    regulations.forEach(regulation => {
      regulation.date = moment(regulation.date).format('DD/MM/YYYY');
      if (regulation.updateDate) {
        regulation.updateDate = moment(regulation.updateDate).format('DD/MM/YYYY');
      }
    });
    
    return {
      data: regulations,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
  
  /**
   * Cập nhật trạng thái đọc
   * @param {number} id - ID quy định
   * @param {number} userId - ID người dùng
   * @param {boolean} read - Trạng thái đọc
   * @returns {boolean} - Kết quả cập nhật
   */
  static async updateReadStatus(id, userId, read) {
    if (read) {
      // Đánh dấu đã đọc
      await query(
        `INSERT INTO user_read_status (userId, itemId, itemType) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE readAt = CURRENT_TIMESTAMP`,
        [userId, id, 'regulation']
      );
    } else {
      // Đánh dấu chưa đọc
      await query(
        `DELETE FROM user_read_status WHERE userId = ? AND itemId = ? AND itemType = ?`,
        [userId, id, 'regulation']
      );
    }
    return true;
  }
  
  /**
   * Đánh dấu tất cả là đã đọc
   * @param {number} userId - ID người dùng
   * @returns {boolean} - Kết quả cập nhật
   */
  static async markAllAsRead(userId) {
    // Lấy danh sách quy định chưa đọc
    const unreadRegulations = await query(
      `SELECT r.id 
       FROM regulations r 
       LEFT JOIN user_read_status urs ON r.id = urs.itemId AND urs.itemType = 'regulation' AND urs.userId = ? 
       WHERE urs.id IS NULL`,
      [userId]
    );
    
    // Nếu không có quy định chưa đọc
    if (unreadRegulations.length === 0) {
      return true;
    }
    
    // Thêm các bản ghi vào user_read_status
    const values = unreadRegulations.map(regulation => {
      return `(${userId}, ${regulation.id}, 'regulation', CURRENT_TIMESTAMP)`;
    }).join(', ');
    
    await query(
      `INSERT INTO user_read_status (userId, itemId, itemType, readAt) VALUES ${values}`
    );
    
    return true;
  }
  
  /**
   * Lấy danh sách quy định quan trọng
   * @param {number} limit - Số lượng quy định
   * @param {number} userId - ID người dùng (tùy chọn để lấy trạng thái đọc)
   * @returns {Array} - Danh sách quy định quan trọng
   */
  static async findImportant(limit = 5, userId = null) {
    // Lấy quy định quan trọng
    return await this.findAll({
      page: 1,
      limit: limit,
      isImportant: true,
      userId: userId
    });
  }
}

module.exports = Regulation;