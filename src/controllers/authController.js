const User = require('../models/User');
const jwtService = require('../services/jwtService');


const extractSafeUserData = (user) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    department: user.department,
    position: user.position,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role
  };
};


const authController = {

  register: async (req, res) => {
    try {
      const { username, email, password, fullName, department, position, phone } = req.body;
      
      // Kiểm tra tên đăng nhập đã tồn tại chưa
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
      }
      
      // Kiểm tra email đã tồn tại chưa
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
      }
      
      // Tạo người dùng mới
      const user = await User.create({
        username,
        email,
        password,
        fullName,
        department,
        position,
        phone
      });
      
      // Tạo token
      const token = jwtService.generateToken(user.id);
      
      res.status(201).json({
        message: 'Đăng ký thành công',
        user: extractSafeUserData(user),
        token
      });
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Tìm người dùng
      const user = await User.findByUsernameOrEmail(username);
      if (!user) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc email không tồn tại' });
      }
      
      // Kiểm tra mật khẩu
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Mật khẩu không chính xác' });
      }
      
      // Tạo token
      const token = jwtService.generateToken(user.id);
      
      res.json({
        message: 'Đăng nhập thành công',
        user: extractSafeUserData(user),
        token
      });
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  

  getCurrentUser: async (req, res) => {
    try {
      const user = req.user;
      res.json(extractSafeUserData(user));
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { fullName, department, position, phone, avatar } = req.body;
      
      // Cập nhật thông tin
      const updatedUser = await User.update(userId, {
        fullName,
        department,
        position,
        phone,
        avatar
      });
      
      res.json({
        message: 'Cập nhật thông tin thành công',
        user: extractSafeUserData(updatedUser)
      });
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Lấy thông tin người dùng
      const user = await User.findById(userId);
      
      // Kiểm tra mật khẩu hiện tại
      const isMatch = await User.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
      }
      
      // Đổi mật khẩu
      await User.changePassword(userId, newPassword);
      
      res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Kiểm tra email tồn tại
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
      }
      
      // Giả lập thành công
      res.json({
        message: 'Email đặt lại mật khẩu đã được gửi đi',
      });
    } catch (error) {
      console.error('Lỗi quên mật khẩu:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  },
  
  getUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const users = await User.findAll(page, limit);
      
      res.json(users);
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ' });
    }
  }
};

module.exports = authController;