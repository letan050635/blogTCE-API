require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection, verifyDatabaseSchema } = require('./config/db');
const config = require('./config/config');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const regulationRoutes = require('./routes/regulationRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Khởi tạo express app
const app = express();

// Middleware
app.use(helmet()); 
app.use(morgan('dev')); 
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
})); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

// Kiểm tra kết nối database
const initializeDatabase = async () => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      const isValid = await verifyDatabaseSchema();
      if (isValid) {
        console.log('Cơ sở dữ liệu sẵn sàng để sử dụng.');
      } else {
        console.warn('Cơ sở dữ liệu có thể không tương thích với ứng dụng này.');
      }
    }
  } catch (error) {
    console.error('Không thể kết nối đến cơ sở dữ liệu:', error);
  }
};

// Khởi tạo database
initializeDatabase();

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/regulations', regulationRoutes);
app.use('/api/files', fileRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng đến với API của TCE-EMS Blog' });
});

// Xử lý 404
app.use(notFoundHandler);

// Xử lý lỗi toàn cục
app.use(errorHandler);

// Khởi động server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`Môi trường: ${config.nodeEnv}`);
});

// Xử lý lỗi và thoát
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});