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
app.use(helmet()); 
app.use(morgan('dev')); 
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

testConnection().then(isConnected => {
  if (isConnected) {
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

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Khởi động server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});