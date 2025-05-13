const BaseModel = require('./BaseModel');

class Regulation {
  static TABLE_NAME = 'regulations';
  static ITEM_TYPE = 'regulation';
  
  static async findById(id, userId = null) {
    return await BaseModel.findById(this.TABLE_NAME, id, userId, this.ITEM_TYPE);
  }
  
  static async create(data) {
    const fields = [
      'title', 'brief', 'content', 'date', 'updateDate', 
      'isNew', 'isImportant', 'useHtml'
    ];
    
    // Thiết lập giá trị mặc định
    data.isNew = data.isNew !== undefined ? data.isNew : true;
    data.isImportant = data.isImportant !== undefined ? data.isImportant : false;
    data.useHtml = data.useHtml !== undefined ? data.useHtml : true;
    
    // Không set updateDate khi tạo mới
    data.updateDate = null;
    
    return await BaseModel.create(this.TABLE_NAME, data, fields, this.ITEM_TYPE);
  }
  
  static async update(id, data) {
    const allowedFields = [
      'title', 'brief', 'content', 'date', 'updateDate', 
      'isNew', 'isImportant', 'useHtml'
    ];
    
    // Luôn set updateDate là ngày hiện tại khi update
    data.updateDate = new Date().toISOString().split('T')[0];
    
    return await BaseModel.update(this.TABLE_NAME, id, data, allowedFields, this.ITEM_TYPE);
  }
  
  static async delete(id) {
    return await BaseModel.delete(this.TABLE_NAME, id, this.ITEM_TYPE);
  }
  
  static async findAll(options = {}) {
    // Bổ sung điều kiện nếu cần lọc theo isImportant
    const additionalConditions = [];
    if (options.isImportant !== undefined) {
      additionalConditions.push(`t.isImportant = ${options.isImportant ? 1 : 0}`);
    }
    
    const orderBy = 't.isImportant DESC, t.isNew DESC, t.date DESC';
    return await BaseModel.findAll(this.TABLE_NAME, options, this.ITEM_TYPE, additionalConditions, orderBy);
  }
  
  static async updateReadStatus(id, userId, read) {
    return await BaseModel.updateReadStatus(id, userId, read, this.ITEM_TYPE);
  }
  
  static async markAllAsRead(userId) {
    return await BaseModel.markAllAsRead(this.TABLE_NAME, userId, this.ITEM_TYPE);
  }
  
  static async findImportant(limit = 5, userId = null) {
    return await this.findAll({
      page: 1,
      limit: limit,
      isImportant: true,
      userId: userId
    });
  }
}

module.exports = Regulation;