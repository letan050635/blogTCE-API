const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const validator = require('../middlewares/validator');

// Đăng ký tài khoản mới
router.post(
  '/register',
  validator.registerValidator,
  validator.validate,
  authController.register
);

// Đăng nhập
router.post(
  '/login',
  validator.loginValidator,
  validator.validate,
  authController.login
);

// Lấy thông tin người dùng hiện tại
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

// Cập nhật thông tin người dùng
router.put(
  '/profile',
  authenticate,
  validator.updateProfileValidator,
  validator.validate,
  authController.updateProfile
);

// Đổi mật khẩu
router.post(
  '/change-password',
  authenticate,
  validator.changePasswordValidator,
  validator.validate,
  authController.changePassword
);


// Danh sách người dùng (chỉ admin)
router.get(
  '/users',
  authenticate,
  isAdmin,
  authController.getUsers
);

module.exports = router;