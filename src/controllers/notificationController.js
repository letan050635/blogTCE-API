const Notification = require('../models/Notification');

/**
 * Lấy danh sách thông báo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNotifications = async (req, res) => {
  try {
    // Lấy các tham số từ query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || null;
    const search = req.query.search || null;
    const searchInContent = req.query.searchInContent === 'true';
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;
    
    // ID người dùng (nếu đã đăng nhập)
    const userId = req.user ? req.user.id : null;
    
    // Lấy danh sách thông báo
    const notifications = await Notification.findAll({
      page,
      limit,
      filter,
      search,
      searchInContent,
      fromDate,
      toDate,
      userId
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Lỗi lấy danh sách thông báo:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Lấy thông tin chi tiết thông báo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNotificationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user ? req.user.id : null;
    
    // Lấy thông tin thông báo
    const notification = await Notification.findById(id, userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Lỗi lấy thông tin thông báo:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Tạo thông báo mới (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, brief, content, date, updateDate, isNew, useHtml } = req.body;
    
    // Tạo thông báo mới
    const notification = await Notification.create({
      title,
      brief,
      content,
      date,
      updateDate,
      isNew,
      useHtml
    });
    
    res.status(201).json({
      message: 'Tạo thông báo thành công',
      notification
    });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Cập nhật thông báo (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateNotification = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, brief, content, date, updateDate, isNew, useHtml } = req.body;
    
    // Kiểm tra thông báo tồn tại
    const existingNotification = await Notification.findById(id);
    if (!existingNotification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    // Cập nhật thông báo
    const updatedNotification = await Notification.update(id, {
      title,
      brief,
      content,
      date,
      updateDate,
      isNew,
      useHtml
    });
    
    res.json({
      message: 'Cập nhật thông báo thành công',
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông báo:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Xóa thông báo (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteNotification = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Kiểm tra thông báo tồn tại
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    // Xóa thông báo
    await Notification.delete(id);
    
    res.json({ message: 'Xóa thông báo thành công' });
  } catch (error) {
    console.error('Lỗi xóa thông báo:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Cập nhật trạng thái đọc thông báo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateReadStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { read } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra thông báo tồn tại
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    // Cập nhật trạng thái đọc
    await Notification.updateReadStatus(id, userId, read);
    
    res.json({
      message: `Đánh dấu thông báo ${read ? 'đã đọc' : 'chưa đọc'} thành công`
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đọc:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Đánh dấu tất cả thông báo là đã đọc
    await Notification.markAllAsRead(userId);
    
    res.json({
      message: 'Đánh dấu tất cả thông báo đã đọc thành công'
    });
  } catch (error) {
    console.error('Lỗi đánh dấu tất cả đã đọc:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};