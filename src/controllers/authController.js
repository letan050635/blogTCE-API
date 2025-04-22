const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Tạo JWT token
 * @param {number} userId - ID người dùng
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Đăng ký tài khoản mới
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
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
    const token = generateToken(user.id);
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        position: user.position,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Đăng nhập
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Tìm người dùng theo tên đăng nhập hoặc email
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
    const token = generateToken(user.id);
    
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        position: user.position,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      position: user.position,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfile = async (req, res) => {
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
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        department: updatedUser.department,
        position: updatedUser.position,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Đổi mật khẩu
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.changePassword = async (req, res) => {
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
};

/**
 * Quên mật khẩu (giả lập gửi email)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Kiểm tra email tồn tại
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }
    
    // Trong ứng dụng thực tế, tại đây sẽ tạo token reset password
    // và gửi email đặt lại mật khẩu
    
    // Giả lập thành công
    res.json({
      message: 'Email đặt lại mật khẩu đã được gửi đi',
      // Reset token sẽ được gửi trong email thực tế
    });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Danh sách người dùng (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await User.findAll(page, limit);
    
    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};