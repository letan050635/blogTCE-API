require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection, verifyDatabaseSchema } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const regulationRoutes = require('./routes/regulationRoutes');

// Cấu hình
const config = require('./config/config');

// Khởi tạo express app
const app = express();

// Middleware
app.use(helmet()); // Bảo mật headers
app.use(morgan('dev')); // Logging
app.use(cors()); // Cho phép CORS
app.use(express.json()); // Phân tích JSON request body
app.use(express.urlencoded({ extended: false })); // Phân tích urlencoded request body

// Kiểm tra kết nối đến database
testConnection().then(isConnected => {
  if (isConnected) {
    // Kiểm tra cấu trúc database
    verifyDatabaseSchema().then(isValid => {
      if (isValid) {
        console.log('Cơ sở dữ liệu sẵn sàng để sử dụng.');
      } else {
        console.warn('Cơ sở dữ liệu có thể không tương thích với ứng dụng này.');
      }
    });
  }
});

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/regulations', regulationRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng đến với API của TCE-EMS Blog' });
});

// Xử lý 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint không tồn tại' });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Lỗi máy chủ nội bộ',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Khởi động server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});