const BaseModel = require('./BaseModel');

class Notification {
  static TABLE_NAME = 'notifications';
  static ITEM_TYPE = 'notification';
  
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
    data.useHtml = data.useHtml !== undefined ? data.useHtml : false;
    
    return await BaseModel.create(this.TABLE_NAME, data, fields, this.ITEM_TYPE);
  }
  
  static async update(id, data) {
    const allowedFields = [
      'title', 'brief', 'content', 'date', 'updateDate', 
      'isNew', 'isImportant', 'useHtml'
    ];
    
    return await BaseModel.update(this.TABLE_NAME, id, data, allowedFields, this.ITEM_TYPE);
  }
  
  static async delete(id) {
    return await BaseModel.delete(this.TABLE_NAME, id, this.ITEM_TYPE);
  }
  
  static async findAll(options = {}) {
    const orderBy = 't.isNew DESC, t.date DESC';
    return await BaseModel.findAll(this.TABLE_NAME, options, this.ITEM_TYPE, [], orderBy);
  }
  
  static async updateReadStatus(id, userId, read) {
    return await BaseModel.updateReadStatus(id, userId, read, this.ITEM_TYPE);
  }
  
  static async markAllAsRead(userId) {
    return await BaseModel.markAllAsRead(this.TABLE_NAME, userId, this.ITEM_TYPE);
  }
}

module.exports = Notification;