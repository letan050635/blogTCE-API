/**
 * Lớp controller cơ sở với các phương thức chung
 */
class BaseController {
    /**
     * Lấy danh sách bản ghi
     * @param {Object} Model - Model xử lý
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static getList = (Model) => async (req, res) => {
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
        
        // Lấy danh sách bản ghi
        const items = await Model.findAll({
          page,
          limit,
          filter,
          search,
          searchInContent,
          fromDate,
          toDate,
          userId
        });
        
        res.json(items);
      } catch (error) {
        console.error(`Lỗi lấy danh sách:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Lấy bản ghi theo ID
     * @param {Object} Model - Model xử lý
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static getById = (Model) => async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user ? req.user.id : null;
        
        // Lấy thông tin bản ghi
        const item = await Model.findById(id, userId);
        
        if (!item) {
          return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
        }
        
        res.json(item);
      } catch (error) {
        console.error(`Lỗi lấy thông tin:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Tạo bản ghi mới
     * @param {Object} Model - Model xử lý
     * @param {string} itemName - Tên hiển thị của loại bản ghi
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static create = (Model, itemName) => async (req, res) => {
      try {
        // Lấy dữ liệu từ request body
        const data = req.body;
        
        // Tạo bản ghi mới
        const item = await Model.create(data);
        
        res.status(201).json({
          message: `Tạo ${itemName} thành công`,
          [itemName]: item
        });
      } catch (error) {
        console.error(`Lỗi tạo ${itemName}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Cập nhật bản ghi
     * @param {Object} Model - Model xử lý
     * @param {string} itemName - Tên hiển thị của loại bản ghi
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static update = (Model, itemName) => async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const data = req.body;
        
        // Kiểm tra bản ghi tồn tại
        const existingItem = await Model.findById(id);
        if (!existingItem) {
          return res.status(404).json({ message: `Không tìm thấy ${itemName}` });
        }
        
        // Cập nhật bản ghi
        const updatedItem = await Model.update(id, data);
        
        res.json({
          message: `Cập nhật ${itemName} thành công`,
          [itemName]: updatedItem
        });
      } catch (error) {
        console.error(`Lỗi cập nhật ${itemName}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Xóa bản ghi
     * @param {Object} Model - Model xử lý
     * @param {string} itemName - Tên hiển thị của loại bản ghi
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static delete = (Model, itemName) => async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        
        // Kiểm tra bản ghi tồn tại
        const item = await Model.findById(id);
        if (!item) {
          return res.status(404).json({ message: `Không tìm thấy ${itemName}` });
        }
        
        // Xóa bản ghi
        await Model.delete(id);
        
        res.json({ message: `Xóa ${itemName} thành công` });
      } catch (error) {
        console.error(`Lỗi xóa ${itemName}:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Cập nhật trạng thái đọc
     * @param {Object} Model - Model xử lý
     * @param {string} itemName - Tên hiển thị của loại bản ghi
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static updateReadStatus = (Model, itemName) => async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { read } = req.body;
        const userId = req.user.id;
        
        // Kiểm tra bản ghi tồn tại
        const item = await Model.findById(id);
        if (!item) {
          return res.status(404).json({ message: `Không tìm thấy ${itemName}` });
        }
        
        // Cập nhật trạng thái đọc
        await Model.updateReadStatus(id, userId, read);
        
        res.json({
          message: `Đánh dấu ${itemName} ${read ? 'đã đọc' : 'chưa đọc'} thành công`
        });
      } catch (error) {
        console.error(`Lỗi cập nhật trạng thái đọc:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
    
    /**
     * Đánh dấu tất cả là đã đọc
     * @param {Object} Model - Model xử lý
     * @param {string} itemName - Tên hiển thị của loại bản ghi
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static markAllAsRead = (Model, itemName) => async (req, res) => {
      try {
        const userId = req.user.id;
        
        // Đánh dấu tất cả bản ghi là đã đọc
        await Model.markAllAsRead(userId);
        
        res.json({
          message: `Đánh dấu tất cả ${itemName} đã đọc thành công`
        });
      } catch (error) {
        console.error(`Lỗi đánh dấu tất cả đã đọc:`, error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
      }
    };
  }
  
  module.exports = BaseController;