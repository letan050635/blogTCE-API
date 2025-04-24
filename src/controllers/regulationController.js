const Regulation = require('../models/Regulation');

exports.getRegulations = async (req, res) => {
  try {
    // Lấy các tham số từ query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter || null;
    const search = req.query.search || null;
    
    // ID người dùng (nếu đã đăng nhập)
    const userId = req.user ? req.user.id : null;
    
    // Lấy danh sách quy định
    const regulations = await Regulation.findAll({
      page,
      limit,
      filter,
      search,
      userId
    });
    
    res.json(regulations);
  } catch (error) {
    console.error('Lỗi lấy danh sách quy định:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Lấy danh sách quy định quan trọng
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getImportantRegulations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const userId = req.user ? req.user.id : null;
    
    // Lấy danh sách quy định quan trọng
    const regulations = await Regulation.findImportant(limit, userId);
    
    res.json(regulations);
  } catch (error) {
    console.error('Lỗi lấy danh sách quy định quan trọng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Lấy thông tin chi tiết quy định
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRegulationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user ? req.user.id : null;
    
    // Lấy thông tin quy định
    const regulation = await Regulation.findById(id, userId);
    
    if (!regulation) {
      return res.status(404).json({ message: 'Không tìm thấy quy định' });
    }
    
    res.json(regulation);
  } catch (error) {
    console.error('Lỗi lấy thông tin quy định:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Tạo quy định mới (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createRegulation = async (req, res) => {
  try {
    const { title, brief, content, date, updateDate, isNew, isImportant, useHtml } = req.body;
    
    // Tạo quy định mới
    const regulation = await Regulation.create({
      title,
      brief,
      content,
      date,
      updateDate,
      isNew,
      isImportant,
      useHtml
    });
    
    res.status(201).json({
      message: 'Tạo quy định thành công',
      regulation
    });
  } catch (error) {
    console.error('Lỗi tạo quy định:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Cập nhật quy định (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateRegulation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, brief, content, date, updateDate, isNew, isImportant, useHtml } = req.body;
    
    // Kiểm tra quy định tồn tại
    const existingRegulation = await Regulation.findById(id);
    if (!existingRegulation) {
      return res.status(404).json({ message: 'Không tìm thấy quy định' });
    }
    
    // Cập nhật quy định
    const updatedRegulation = await Regulation.update(id, {
      title,
      brief,
      content,
      date,
      updateDate,
      isNew,
      isImportant,
      useHtml
    });
    
    res.json({
      message: 'Cập nhật quy định thành công',
      regulation: updatedRegulation
    });
  } catch (error) {
    console.error('Lỗi cập nhật quy định:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Xóa quy định (chỉ admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteRegulation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Kiểm tra quy định tồn tại
    const regulation = await Regulation.findById(id);
    if (!regulation) {
      return res.status(404).json({ message: 'Không tìm thấy quy định' });
    }
    
    // Xóa quy định
    await Regulation.delete(id);
    
    res.json({ message: 'Xóa quy định thành công' });
  } catch (error) {
    console.error('Lỗi xóa quy định:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Cập nhật trạng thái đọc quy định
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateReadStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { read } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra quy định tồn tại
    const regulation = await Regulation.findById(id);
    if (!regulation) {
      return res.status(404).json({ message: 'Không tìm thấy quy định' });
    }
    
    // Cập nhật trạng thái đọc
    await Regulation.updateReadStatus(id, userId, read);
    
    res.json({
      message: `Đánh dấu quy định ${read ? 'đã đọc' : 'chưa đọc'} thành công`
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đọc:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/**
 * Đánh dấu tất cả quy định là đã đọc
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Đánh dấu tất cả quy định là đã đọc
    await Regulation.markAllAsRead(userId);
    
    res.json({
      message: 'Đánh dấu tất cả quy định đã đọc thành công'
    });
  } catch (error) {
    console.error('Lỗi đánh dấu tất cả đã đọc:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};