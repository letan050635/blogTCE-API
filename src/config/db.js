const mysql = require('mysql2/promise');

// Tạo pool connection để tối ưu hiệu suất
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'tce_ems_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối đến MySQL thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Không thể kết nối đến MySQL:', error);
    return false;
  }
};

// Hàm trợ giúp để thực hiện truy vấn
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Lỗi truy vấn SQL:', error);
    throw error;
  }
};

// Hàm kiểm tra cấu trúc bảng hiện có
const verifyDatabaseSchema = async () => {
  try {
    // Kiểm tra các bảng đã tồn tại
    const tables = await query(`SHOW TABLES`);
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('Các bảng hiện có trong database:', tableNames);
    
    // Kiểm tra cấu trúc của từng bảng để xác nhận
    const requiredTables = ['users', 'notifications', 'regulations', 'user_read_status'];
    
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        console.warn(`Cảnh báo: Bảng ${table} không tồn tại trong cơ sở dữ liệu.`);
      } else {
        const columns = await query(`SHOW COLUMNS FROM ${table}`);
        console.log(`Cấu trúc bảng ${table}:`, columns.map(c => c.Field));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra schema cơ sở dữ liệu:', error);
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  verifyDatabaseSchema
};