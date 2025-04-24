const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Tạo người dùng mới
   * @param {Object} userData - Dữ liệu người dùng
   * @returns {Object} - Thông tin người dùng đã tạo
   */
  static async create(userData) {
    const { username, email, password, fullName, department = null, position = null, phone = null } = userData;
    
    // Bỏ mã hóa mật khẩu, sử dụng mật khẩu gốc
    const hashedPassword = password;
    
    // Chèn vào DB
    const result = await query(
      `INSERT INTO users (username, email, password, fullName, department, position, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, department, position, phone]
    );
    
    // Trả về thông tin người dùng
    const newUser = await this.findById(result.insertId);
    return newUser;
  }
  
  /**
   * Tìm người dùng theo ID
   * @param {number} id - ID người dùng
   * @returns {Object|null} - Thông tin người dùng hoặc null
   */
  static async findById(id) {
    const users = await query(
      `SELECT id, username, email, fullName, department, position, phone, avatar, role, createdAt, updatedAt 
       FROM users WHERE id = ?`,
      [id]
    );
    
    return users.length > 0 ? users[0] : null;
  }
  
  /**
   * Tìm người dùng theo tên đăng nhập
   * @param {string} username - Tên đăng nhập
   * @returns {Object|null} - Thông tin người dùng hoặc null
   */
  static async findByUsername(username) {
    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    return users.length > 0 ? users[0] : null;
  }
  
  /**
   * Tìm người dùng theo email
   * @param {string} email - Email
   * @returns {Object|null} - Thông tin người dùng hoặc null
   */
  static async findByEmail(email) {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0 ? users[0] : null;
  }
  
  /**
   * Tìm người dùng theo tên đăng nhập hoặc email
   * @param {string} login - Tên đăng nhập hoặc email
   * @returns {Object|null} - Thông tin người dùng hoặc null
   */
  static async findByUsernameOrEmail(login) {
    const users = await query('SELECT * FROM users WHERE username = ? OR email = ?', [login, login]);
    return users.length > 0 ? users[0] : null;
  }
  
  /**
   * Cập nhật thông tin người dùng
   * @param {number} id - ID người dùng
   * @param {Object} userData - Dữ liệu cần cập nhật
   * @returns {Object} - Thông tin người dùng sau khi cập nhật
   */
  static async update(id, userData) {
    const allowedFields = ['fullName', 'department', 'position', 'phone', 'avatar'];
    const updateData = {};
    const params = [];
    
    // Lọc và đưa vào mảng params
    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        updateData[field] = userData[field];
        params.push(userData[field]);
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
    await query(`UPDATE users SET ${fields} WHERE id = ?`, params);
    
    // Trả về thông tin người dùng đã cập nhật
    return await this.findById(id);
  }
  
  /**
   * Thay đổi mật khẩu
   * @param {number} id - ID người dùng
   * @param {string} newPassword - Mật khẩu mới
   * @returns {boolean} - Kết quả cập nhật
   */
  static async changePassword(id, newPassword) {
    // Bỏ mã hóa mật khẩu, sử dụng mật khẩu gốc
    const hashedPassword = newPassword;
    
    // Cập nhật mật khẩu
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return true;
  }
  
  /**
   * Kiểm tra mật khẩu
   * @param {string} enteredPassword - Mật khẩu nhập vào
   * @param {string} storedPassword - Mật khẩu đã lưu
   * @returns {boolean} - Kết quả so sánh
   */
  static async comparePassword(enteredPassword, storedPassword) {
    // So sánh trực tiếp thay vì sử dụng bcrypt
    return enteredPassword === storedPassword;
  }
  
  /**
   * Xóa người dùng
   * @param {number} id - ID người dùng
   * @returns {boolean} - Kết quả xóa
   */
  static async delete(id) {
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Lấy danh sách người dùng
   * @param {number} page - Trang
   * @param {number} limit - Số lượng mỗi trang
   * @returns {Object} - Danh sách người dùng và thông tin phân trang
   */
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Đếm tổng số người dùng
    const countResult = await query('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;
    
    // Lấy danh sách người dùng
    const users = await query(
      `SELECT id, username, email, fullName, department, position, phone, avatar, role, createdAt, updatedAt 
       FROM users LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return {
      data: users,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
}

module.exports = User;