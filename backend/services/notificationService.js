const db = require("../models");
const staff = require("../models/staff");

exports.getNotificationsByStaff = async (staffId) => {
  try {
    const notifications = await db.Notification.findAll({
      where: { staff_id: staffId },
      order: [["created_at", "DESC"]],
    });
    return notifications;
  } catch (error) {
    throw new Error("Error fetching notifications: " + error.message);
  }
};

exports.markNotificationAsRead = async (notificationId) => {
  try {
    await db.Notification.update(
      { status: "read" },
      { where: { id: notificationId } }
    );
  } catch (error) {
    throw new Error("Error marking notification as read: " + error.message);
  }
};

exports.markAllNotificationAsRead = async (staffId) => {
  try {
    await db.Notification.update(
      { status: "read" },
      { where: { staff_id: staffId } }
    );
  } catch (error) {
    throw new Error("Error marking notification as read: " + error.message);
  }
};

exports.createNotification = async (staffId, message, type) => {
  if (!staffId) {
    return;
  }

  try {
    const staffExists = await db.Staff.findByPk(staffId);
    if (!staffExists) {
      return;
    }

    await db.Notification.create({
      staff_id: staffId,
      message,
      type,
      status: "unread",
    });
  } catch (error) {
    throw new Error("Error creating notification: " + error.message);
  }
};
