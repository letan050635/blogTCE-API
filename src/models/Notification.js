const { query } = require("../config/db");
const moment = require("moment");

class Notification {
  static async create(data) {
    const {
      title,
      brief,
      content,
      date,
      updateDate = null,
      isNew = true,
      useHtml = false,
    } = data;

    // Chuyển đổi định dạng ngày
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const formattedUpdateDate = updateDate
      ? moment(updateDate).format("YYYY-MM-DD")
      : null;

    // Chèn vào DB
    const result = await query(
      `INSERT INTO notifications (title, brief, content, date, updateDate, isNew, useHtml) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        brief,
        content,
        formattedDate,
        formattedUpdateDate,
        isNew,
        useHtml,
      ]
    );

    // Trả về thông tin thông báo
    return await this.findById(result.insertId);
  }

  static async findById(id, userId = null) {
    let notification;

    if (userId) {
      // Nếu có userId, lấy cả trạng thái đọc
      const notifications = await query(
        `SELECT n.*,
         CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as read
         FROM notifications n
         LEFT JOIN user_read_status urs ON n.id = urs.itemId AND urs.itemType = 'notification' AND urs.userId = ?
         WHERE n.id = ?`,
        [userId, id]
      );
      notification = notifications.length > 0 ? notifications[0] : null;
    } else {
      // Nếu không có userId, chỉ lấy thông tin thông báo
      const notifications = await query(
        "SELECT * FROM notifications WHERE id = ?",
        [id]
      );
      notification = notifications.length > 0 ? notifications[0] : null;
    }

    if (notification) {
      // Chuyển đổi định dạng ngày
      notification.date = moment(notification.date).format("DD/MM/YYYY");
      if (notification.updateDate) {
        notification.updateDate = moment(notification.updateDate).format(
          "DD/MM/YYYY"
        );
      }
    }

    return notification;
  }

  static async update(id, data) {
    const allowedFields = [
      "title",
      "brief",
      "content",
      "date",
      "updateDate",
      "isNew",
      "useHtml",
    ];
    const updateData = {};
    const params = [];

    // Chuyển đổi định dạng ngày
    if (data.date) {
      data.date = moment(data.date).format("YYYY-MM-DD");
    }
    if (data.updateDate) {
      data.updateDate = moment(data.updateDate).format("YYYY-MM-DD");
    }

    // Lọc và đưa vào mảng params
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
        params.push(data[field]);
      }
    });

    // Nếu không có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      return await this.findById(id);
    }

    // Tạo câu lệnh SQL động
    const fields = Object.keys(updateData)
      .map((field) => `${field} = ?`)
      .join(", ");
    params.push(id); // Thêm id vào cuối mảng params

    // Thực hiện cập nhật
    await query(`UPDATE notifications SET ${fields} WHERE id = ?`, params);

    // Trả về thông tin thông báo đã cập nhật
    return await this.findById(id);
  }

  /**
   * Xóa thông báo
   * @param {number} id - ID thông báo
   * @returns {boolean} - Kết quả xóa
   */
  static async delete(id) {
    // Xóa các bản ghi liên quan trong user_read_status
    await query(
      "DELETE FROM user_read_status WHERE itemId = ? AND itemType = ?",
      [id, "notification"]
    );

    // Xóa thông báo
    const result = await query("DELETE FROM notifications WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      filter = null,
      search = null,
      searchInContent = false,
      fromDate = null,
      toDate = null,
      userId = null,
    } = options;

    const offset = (page - 1) * limit;
    const params = [];

    // Xây dựng câu truy vấn cơ bản
    let sql = `SELECT n.*`;
    let countSql = `SELECT COUNT(*) as total`;

    // Nếu có userId, lấy cả trạng thái đọc
    if (userId) {
      try {
        // Kiểm tra bảng user_read_status có tồn tại không
        await query("SELECT 1 FROM user_read_status LIMIT 1");

        sql += `, CASE WHEN urs.id IS NOT NULL THEN TRUE ELSE FALSE END as read`;
        sql += ` FROM notifications n LEFT JOIN user_read_status urs ON n.id = urs.itemId AND urs.itemType = 'notification' AND urs.userId = ?`;
        countSql += ` FROM notifications n LEFT JOIN user_read_status urs ON n.id = urs.itemId AND urs.itemType = 'notification' AND urs.userId = ?`;
        params.push(userId);
      } catch (error) {
        // Nếu bảng không tồn tại, bỏ qua thông tin đọc
        console.log(
          "Bảng user_read_status không tồn tại, bỏ qua thông tin đọc"
        );
        sql += ` FROM notifications n`;
        countSql += ` FROM notifications n`;
      }
    } else {
      sql += ` FROM notifications n`;
      countSql += ` FROM notifications n`;
    }

    // Thêm điều kiện where
    let conditions = [];

    // Lọc theo trạng thái đọc
    if (userId && filter) {
      if (filter === "read") {
        conditions.push(`urs.id IS NOT NULL`);
      } else if (filter === "unread") {
        conditions.push(`urs.id IS NULL`);
      }
    }

    // Tìm kiếm
    if (search) {
      if (searchInContent) {
        conditions.push(
          `(n.title LIKE ? OR n.brief LIKE ? OR n.content LIKE ?)`
        );
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      } else {
        conditions.push(`(n.title LIKE ? OR n.brief LIKE ?)`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }
    }

    // Lọc theo ngày
    if (fromDate) {
      conditions.push(`n.date >= ?`);
      params.push(moment(fromDate).format("YYYY-MM-DD"));
    }

    if (toDate) {
      conditions.push(`n.date <= ?`);
      params.push(moment(toDate).format("YYYY-MM-DD"));
    }

    // Thêm điều kiện vào câu truy vấn
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(" AND ")}`;
      sql += whereClause;
      countSql += whereClause;
    }

    // Thêm sắp xếp và phân trang
    sql += ` ORDER BY n.isNew DESC, n.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Đếm tổng số thông báo
    const countResult = await query(countSql, params.slice(0, -2)); // Bỏ limit và offset
    const total = countResult[0].total;

    // Lấy danh sách thông báo
    const notifications = await query(sql, params);

    // Chuyển đổi định dạng ngày
    notifications.forEach((notification) => {
      notification.date = moment(notification.date).format("DD/MM/YYYY");
      if (notification.updateDate) {
        notification.updateDate = moment(notification.updateDate).format(
          "DD/MM/YYYY"
        );
      }
    });

    return {
      data: notifications,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  }

  static async updateReadStatus(id, userId, read) {
    if (read) {
      // Đánh dấu đã đọc
      await query(
        `INSERT INTO user_read_status (userId, itemId, itemType) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE readAt = CURRENT_TIMESTAMP`,
        [userId, id, "notification"]
      );
    } else {
      // Đánh dấu chưa đọc
      await query(
        `DELETE FROM user_read_status WHERE userId = ? AND itemId = ? AND itemType = ?`,
        [userId, id, "notification"]
      );
    }
    return true;
  }

  static async markAllAsRead(userId) {
    // Lấy danh sách thông báo chưa đọc
    const unreadNotifications = await query(
      `SELECT n.id 
       FROM notifications n 
       LEFT JOIN user_read_status urs ON n.id = urs.itemId AND urs.itemType = 'notification' AND urs.userId = ? 
       WHERE urs.id IS NULL`,
      [userId]
    );

    // Nếu không có thông báo chưa đọc
    if (unreadNotifications.length === 0) {
      return true;
    }

    // Thêm các bản ghi vào user_read_status
    const values = unreadNotifications
      .map((notification) => {
        return `(${userId}, ${notification.id}, 'notification', CURRENT_TIMESTAMP)`;
      })
      .join(", ");

    await query(
      `INSERT INTO user_read_status (userId, itemId, itemType, readAt) VALUES ${values}`
    );

    return true;
  }
}

module.exports = Notification;
