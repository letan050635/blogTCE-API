const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static TABLE_NAME = 'users';
  static USER_FIELDS = 'id, username, email, fullName, department, position, phone, avatar, role, createdAt, updatedAt';
  
  static async create(userData) {
    const { username, email, password, fullName, department = null, position = null, phone = null } = userData;
    
    // Sử dụng mật khẩu gốc (trong môi trường thực tế nên băm)
    const hashedPassword = password;
    
    // Chèn vào DB
    const result = await query(
      `INSERT INTO ${this.TABLE_NAME} (username, email, password, fullName, department, position, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, department, position, phone]
    );
    
    // Trả về thông tin người dùng
    return await this.findById(result.insertId);
  }

  static async findById(id) {
    const users = await query(
      `SELECT ${this.USER_FIELDS} FROM ${this.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return users.length > 0 ? users[0] : null;
  }
  
  static async findByUsername(username) {
    const users = await query(`SELECT * FROM ${this.TABLE_NAME} WHERE username = ?`, [username]);
    return users.length > 0 ? users[0] : null;
  }
  
  static async findByEmail(email) {
    const users = await query(`SELECT * FROM ${this.TABLE_NAME} WHERE email = ?`, [email]);
    return users.length > 0 ? users[0] : null;
  }
  
  static async findByUsernameOrEmail(login) {
    const users = await query(`SELECT * FROM ${this.TABLE_NAME} WHERE username = ? OR email = ?`, [login, login]);
    return users.length > 0 ? users[0] : null;
  }
  
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
    await query(`UPDATE ${this.TABLE_NAME} SET ${fields} WHERE id = ?`, params);
    
    // Trả về thông tin người dùng đã cập nhật
    return await this.findById(id);
  }
  
  static async changePassword(id, newPassword) {
    // Sử dụng mật khẩu gốc (trong môi trường thực tế nên băm)
    const hashedPassword = newPassword;
    
    // Cập nhật mật khẩu
    await query(`UPDATE ${this.TABLE_NAME} SET password = ? WHERE id = ?`, [hashedPassword, id]);
    return true;
  }
  
  static async comparePassword(enteredPassword, storedPassword) {
    // So sánh trực tiếp (trong môi trường thực tế nên dùng bcrypt.compare)
    return enteredPassword === storedPassword;
  }
  
  static async delete(id) {
    const result = await query(`DELETE FROM ${this.TABLE_NAME} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
  
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Đếm tổng số người dùng
    const countResult = await query(`SELECT COUNT(*) as total FROM ${this.TABLE_NAME}`);
    const total = countResult[0].total;
    
    // Lấy danh sách người dùng
    const users = await query(
      `SELECT ${this.USER_FIELDS} FROM ${this.TABLE_NAME} LIMIT ? OFFSET ?`,
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