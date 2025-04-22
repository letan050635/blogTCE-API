const { body, validationResult, param, query } = require('express-validator');

/**
 * Middleware kiểm tra kết quả validation
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validators cho xác thực
 */
exports.registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Tên đăng nhập phải có từ 3-50 ký tự')
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 7 })
    .withMessage('Mật khẩu phải có ít nhất 7 ký tự')
    .matches(/[A-Z]/)
    .withMessage('Mật khẩu phải có ít nhất 1 chữ in hoa')
    .matches(/[0-9]/)
    .withMessage('Mật khẩu phải có ít nhất 1 số')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được trống')
    .isLength({ max: 100 })
    .withMessage('Họ tên không được vượt quá 100 ký tự')
];

exports.loginValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Tên đăng nhập hoặc email không được trống'),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được trống')
];

exports.changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được trống'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/[A-Z]/)
    .withMessage('Mật khẩu mới phải có ít nhất 1 chữ in hoa')
    .matches(/[0-9]/)
    .withMessage('Mật khẩu mới phải có ít nhất 1 số')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt')
];

exports.updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được trống')
    .isLength({ max: 100 })
    .withMessage('Họ tên không được vượt quá 100 ký tự'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tên phòng ban không được vượt quá 100 ký tự'),
  
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Chức vụ không được vượt quá 100 ký tự'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Số điện thoại không được vượt quá 20 ký tự')
];

/**
 * Validators cho thông báo
 */
exports.notificationValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề không được trống')
    .isLength({ max: 255 })
    .withMessage('Tiêu đề không được vượt quá 255 ký tự'),
  
  body('brief')
    .optional()
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('Nội dung không được trống'),
  
  body('date')
    .isDate()
    .withMessage('Ngày không hợp lệ'),
  
  body('updateDate')
    .optional()
    .isDate()
    .withMessage('Ngày cập nhật không hợp lệ'),
  
  body('isNew')
    .optional()
    .isBoolean()
    .withMessage('isNew phải là giá trị boolean'),
  
  body('useHtml')
    .optional()
    .isBoolean()
    .withMessage('useHtml phải là giá trị boolean')
];

/**
 * Validators cho quy định
 */
exports.regulationValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề không được trống')
    .isLength({ max: 255 })
    .withMessage('Tiêu đề không được vượt quá 255 ký tự'),
  
  body('brief')
    .optional()
    .trim(),
  
  body('content')
    .notEmpty()
    .withMessage('Nội dung không được trống'),
  
  body('date')
    .isDate()
    .withMessage('Ngày không hợp lệ'),
  
  body('updateDate')
    .optional()
    .isDate()
    .withMessage('Ngày cập nhật không hợp lệ'),
  
  body('isNew')
    .optional()
    .isBoolean()
    .withMessage('isNew phải là giá trị boolean'),
  
  body('isImportant')
    .optional()
    .isBoolean()
    .withMessage('isImportant phải là giá trị boolean'),
  
  body('useHtml')
    .optional()
    .isBoolean()
    .withMessage('useHtml phải là giá trị boolean')
];

/**
 * Validators cho params
 */
exports.idParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

/**
 * Validators cho pagination
 */
exports.paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng mục trên mỗi trang phải từ 1-100')
];

/**
 * Validators cho tìm kiếm
 */
exports.searchValidator = [
  query('search')
    .optional()
    .trim()
];

/**
 * Validators cho filter
 */
exports.filterValidator = [
  query('filter')
    .optional()
    .isIn(['all', 'read', 'unread'])
    .withMessage('Filter phải là một trong các giá trị: all, read, unread')
];