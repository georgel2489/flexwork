const db = require("../../models");
const notificationService = require("../../services/notificationService");

jest.mock("../../models");

describe("Notification Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotificationsByStaff", () => {
    it("should return notifications for a given staff ID", async () => {
      const mockNotifications = [
        { id: 1, message: "New request", status: "unread" },
        { id: 2, message: "Request approved", status: "read" },
      ];

      db.Notification.findAll.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotificationsByStaff(1);
      expect(db.Notification.findAll).toHaveBeenCalledWith({
        where: { staff_id: 1 },
        order: [["created_at", "DESC"]],
      });
      expect(result).toEqual(mockNotifications);
    });

    it("should throw an error if there is a problem fetching notifications", async () => {
      db.Notification.findAll.mockRejectedValue(new Error("Database error"));

      await expect(
        notificationService.getNotificationsByStaff(1)
      ).rejects.toThrow("Error fetching notifications: Database error");
    });
  });

  describe("markNotificationAsRead", () => {
    it("should mark a notification as read", async () => {
      db.Notification.update.mockResolvedValue([1]);

      await notificationService.markNotificationAsRead(1);
      expect(db.Notification.update).toHaveBeenCalledWith(
        { status: "read" },
        { where: { id: 1 } }
      );
    });

    it("should throw an error if marking notification as read fails", async () => {
      db.Notification.update.mockRejectedValue(new Error("Update error"));

      await expect(
        notificationService.markNotificationAsRead(1)
      ).rejects.toThrow("Error marking notification as read: Update error");
    });
  });

  describe("markAllNotificationAsRead", () => {
    it("should mark all notifications as read for a given staff ID", async () => {
      db.Notification.update.mockResolvedValue([5]);

      await notificationService.markAllNotificationAsRead(1);
      expect(db.Notification.update).toHaveBeenCalledWith(
        { status: "read" },
        { where: { staff_id: 1 } }
      );
    });

    it("should throw an error if marking all notifications as read fails", async () => {
      db.Notification.update.mockRejectedValue(new Error("Update error"));

      await expect(
        notificationService.markAllNotificationAsRead(1)
      ).rejects.toThrow("Error marking notification as read: Update error");
    });
  });

  describe("createNotification", () => {
    it("should create a notification for a given staff ID", async () => {
      db.Notification.create.mockResolvedValue({
        id: 1,
        message: "New request",
      });

      await notificationService.createNotification(
        1,
        "New request",
        "Request Type"
      );
      expect(db.Notification.create).toHaveBeenCalledWith({
        staff_id: 1,
        message: "New request",
        type: "Request Type",
        status: "unread",
      });
    });

    it("should throw an error if creating a notification fails", async () => {
      db.Notification.create.mockRejectedValue(new Error("Creation error"));

      await expect(
        notificationService.createNotification(1, "New request", "Request Type")
      ).rejects.toThrow("Error creating notification: Creation error");
    });
  });
});
