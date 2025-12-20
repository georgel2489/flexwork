const db = require("../models");
const staff = require("../models/staff");

// Service to get notifications by staff ID
exports.getNotificationsByStaff = async (staffId) => {
  try {
    const notifications = await db.Notification.findAll({
      where: { staff_id: staffId },
      order: [['created_at', 'DESC']],
    });
    return notifications;
  } catch (error) {
    throw new Error('Error fetching notifications: ' + error.message);
  }
};

// Service to mark a notification as read
exports.markNotificationAsRead = async (notificationId) => {
  try {
    await db.Notification.update(
      { status: 'read' },
      { where: { id: notificationId } }
    );
  } catch (error) {
    throw new Error('Error marking notification as read: ' + error.message);
  }
};

// Service to mark a notification as read
exports.markAllNotificationAsRead = async (staffId) => {
    try {
      await db.Notification.update(
        { status: 'read' },
        { where: { staff_id: staffId } }
      );
    } catch (error) {
      throw new Error('Error marking notification as read: ' + error.message);
    }
  };

// Service to create a notification (used in other services)
exports.createNotification = async (staffId, message, type) => {
  console.log(staffId, message, type)
  
  // Skip notification if staffId is null or undefined
  if (!staffId) {
    console.log('Skipping notification: No valid staff_id provided');
    return;
  }
  
  try {
    // Verify that the staff member exists before creating notification
    const staffExists = await db.Staff.findByPk(staffId);
    if (!staffExists) {
      console.log(`Skipping notification: Staff ID ${staffId} does not exist`);
      return;
    }
    
    await db.Notification.create({
      staff_id: staffId,
      message,
      type,
      status: 'unread',
    });
  } catch (error) {
    throw new Error('Error creating notification: ' + error.message);
  }
};
