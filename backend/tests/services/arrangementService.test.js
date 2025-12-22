const dayjs = require("dayjs");

jest.mock("../../models", () => ({
  Staff: {
    findByPk: jest.fn(),
  },
  ArrangementRequest: {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  RequestGroup: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Schedule: {
    upsert: jest.fn(),
    destroy: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
    fn: jest.fn((fnName, col) => `${fnName}(${col})`),
    col: jest.fn((colName) => colName),
    where: jest.fn(),
  },
}));

const { Op } = require("sequelize");
const {
  ArrangementRequest,
  RequestGroup,
  Schedule,
  Staff,
  sequelize,
} = require("../../models");
const arrangementService = require("../../services/arrangementService");
const notificationService = require("../../services/notificationService");
jest.mock("../../services/notificationService");

describe("arrangementService", () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("Get All Arrangements", () => {
    it("should return all arrangements successfully", async () => {
      const mockArrangements = [
        {
          arrangement_id: 1,
          session_type: "WFH",
          start_date: "2024-10-29",
          request_status: "Approved",
        },
        {
          arrangement_id: 2,
          session_type: "WFH",
          start_date: "2024-11-01",
          request_status: "Pending",
        },
      ];

      ArrangementRequest.findAll = jest
        .fn()
        .mockResolvedValue(mockArrangements);

      const result = await arrangementService.getAllArrangements();

      expect(ArrangementRequest.findAll).toHaveBeenCalled();

      expect(result).toEqual(mockArrangements);
    });

    it("should throw an error if fetching arrangements fails", async () => {
      ArrangementRequest.findAll = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await expect(arrangementService.getAllArrangements()).rejects.toThrow(
        "Could not fetch arrangement requests"
      );

      expect(ArrangementRequest.findAll).toHaveBeenCalled();
    });
  });
  describe("get Arrangement By Manager", () => {
    it("should return pending arrangements for the given manager", async () => {
      const mockRequestGroups = [
        {
          request_group_id: 1,
          request_created_date: new Date("2024-10-28"),
          Staff: {
            staff_id: 100,
            staff_fname: "John",
            staff_lname: "Doe",
            dept: "IT",
            position: "Developer",
          },
          ArrangementRequests: [
            {
              arrangement_id: 101,
              session_type: "WFH",
              start_date: new Date("2024-10-29"),
              description: "Working from home",
              request_status: "Pending",
              updated_at: new Date(),
              approval_comment: null,
              approved_at: null,
            },
          ],
        },
      ];

      RequestGroup.findAll = jest.fn().mockResolvedValue(mockRequestGroups);
      RequestGroup.count = jest.fn().mockResolvedValue(1);
      Staff.findByPk = jest.fn().mockResolvedValue({ staff_id: 1, staff_fname: "Manager", staff_lname: "User", role_id: 1 });

      const manager_id = 1;

      const response = await arrangementService.getArrangementByManager(
        manager_id,
        1,
        10,
        "All"
      );

      expect(RequestGroup.findAll).toHaveBeenCalled();
      expect(RequestGroup.count).toHaveBeenCalled();
      expect(response).toHaveProperty("manager_id", manager_id);
      expect(response).toHaveProperty("request_groups");
      expect(response).toHaveProperty("pagination");
      expect(response.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should return an empty array when there are no pending arrangements for the manager", async () => {
      RequestGroup.findAll = jest.fn().mockResolvedValue([]);
      RequestGroup.count = jest.fn().mockResolvedValue(0);
      Staff.findByPk = jest.fn().mockResolvedValue({ staff_id: 1, staff_fname: "Manager", staff_lname: "User", role_id: 1 });

      const manager_id = 1;

      const response = await arrangementService.getArrangementByManager(
        manager_id,
        1,
        10,
        "All"
      );

      expect(response).toEqual({
        manager_id: manager_id,
        request_groups: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });

      expect(RequestGroup.findAll).toHaveBeenCalled();
    });

    it("should throw an error if fetching arrangements fails", async () => {
      Staff.findByPk = jest.fn().mockResolvedValue({ staff_id: 1, staff_fname: "Manager", staff_lname: "User", role_id: 1 });
      RequestGroup.count = jest.fn().mockRejectedValue(new Error("Database error"));

      const manager_id = 1;

      await expect(
        arrangementService.getArrangementByManager(manager_id, 1, 10, "All")
      ).rejects.toThrow("Database error");
    });
  });

  describe("createArrangement", () => {
    test("should create a new arrangement when no existing request is found", async () => {
      const arrangementData = {
        session_type: "WFH",
        start_date: "2024-10-05",
        description: "Working from home",
        staff_id: 1,
      };

      ArrangementRequest.findAll.mockResolvedValue([]);

      RequestGroup.create.mockResolvedValue({
        request_group_id: 1,
      });

      Staff.findByPk = jest.fn().mockResolvedValue({
        staff_id: 1,
        staff_fname: "John",
        staff_lname: "Doe",
        reporting_manager_id: 2,
      });

      ArrangementRequest.create.mockResolvedValue({
        arrangement_id: 1,
        session_type: arrangementData.session_type,
        start_date: arrangementData.start_date,
        request_status: "Pending",
      });

      const transactionMock = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(transactionMock);

      const result = await arrangementService.createArrangement(
        arrangementData
      );

      expect(ArrangementRequest.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: RequestGroup,
            where: { staff_id: arrangementData.staff_id },
          },
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("start_date")),
              "=",
              arrangementData.start_date
            ),
            { request_status: ["Pending", "Approved"] },
          ],
        },
      });

      expect(RequestGroup.create).toHaveBeenCalledWith(
        {
          staff_id: arrangementData.staff_id,
          request_created_date: expect.any(Date),
        },
        { transaction: expect.any(Object) }
      );

      expect(ArrangementRequest.create).toHaveBeenCalledWith(
        {
          session_type: arrangementData.session_type,
          start_date: arrangementData.start_date,
          description: arrangementData.description,
          request_status: "Pending",
          updated_at: expect.any(Date),
          approval_comment: null,
          approved_at: null,
          request_group_id: 1,
        },
        { transaction: expect.any(Object) }
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        2,
        "John Doe submitted new ad-hoc WFH request",
        "New WFH Request"
      );

      expect(transactionMock.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.arrangement_id).toBe(1);
    });

    test("should throw an error if an existing request is found", async () => {
      const arrangementData = {
        session_type: "WFH",
        start_date: "2024-10-05",
        staff_id: 1,
      };

      ArrangementRequest.findAll.mockResolvedValue([{}]);

      await expect(
        arrangementService.createArrangement(arrangementData)
      ).rejects.toThrow(
        "There is already a WFH request on this date for this staff member."
      );
    });
  });

  describe("createBatchArrangement", () => {
    it("should create batch arrangement and send a notification", async () => {
      const batchData = {
        staff_id: 1,
        session_type: "Work home",
        description: "Weekly WFH",
        num_occurrences: 2,
        repeat_type: "weekly",
        start_date: "2024-11-06",
      };

      RequestGroup.create.mockResolvedValue({ request_group_id: 1 });
      ArrangementRequest.findAll.mockResolvedValue([]);
      ArrangementRequest.create.mockResolvedValue({ arrangement_id: 1 });
      Staff.findByPk.mockResolvedValue({
        staff_fname: "John",
        staff_lname: "Doe",
        reporting_manager_id: 2,
      });
      notificationService.createNotification.mockResolvedValue();

      const result = await arrangementService.createBatchArrangement(batchData);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(RequestGroup.create).toHaveBeenCalledWith(
        {
          staff_id: batchData.staff_id,
          request_created_date: expect.any(Date),
        },
        { transaction: mockTransaction }
      );
      expect(ArrangementRequest.create).toHaveBeenCalledTimes(2);
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        2,
        "John Doe submitted new repeating WFH request",
        "New WFH Request"
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        message: "Batch WFH request created successfully.",
        new_requests: [{ arrangement_id: 1 }, { arrangement_id: 1 }],
        cancelled_requests: [],
      });
    });

    it("should rollback transaction and throw error on failure", async () => {
      RequestGroup.create.mockRejectedValue(
        new Error("Could not create batch arrangement request")
      );

      await expect(
        arrangementService.createBatchArrangement({})
      ).rejects.toThrow("Could not create batch arrangement request");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("approve Request", () => {
    it("should approve the request and create schedule entries", async () => {
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      const mockRequests = [
        {
          arrangement_id: 101,
          session_type: "WFH",
          start_date: "2024-10-29",
        },
      ];
      ArrangementRequest.findAll = jest.fn().mockResolvedValue(mockRequests);

      Schedule.upsert = jest.fn().mockResolvedValue([1]);

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      const result = await arrangementService.approveRequest(
        id,
        comment,
        manager_id
      );

      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Approved", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      expect(Schedule.upsert).toHaveBeenCalledWith(
        {
          staff_id: mockRequestGroup.staff_id,
          start_date: mockRequests[0].start_date,
          session_type: mockRequests[0].session_type,
          request_id: mockRequests[0].arrangement_id,
        },
        { transaction: mockTransaction }
      );

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: mockRequestGroup });
    });

    it("should throw an error if the request group is not found", async () => {
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      await expect(
        arrangementService.approveRequest(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      await expect(
        arrangementService.approveRequest(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("approvePartialRequest", () => {
    it("should approve and reject requests based on provided data and commit the transaction", async () => {
      const id = 1;
      const comment = "Reviewed by manager";
      const data = { 101: "Approved", 102: "Rejected" };
      const manager_id = 5;

      const requestGroupMock = {
        staff_id: 123,
      };
      const arrangementRequestsMock = [
        {
          arrangement_id: 101,
          start_date: "2024-11-01",
          session_type: "Full-Day",
        },
        {
          arrangement_id: 102,
          start_date: "2024-11-02",
          session_type: "Half-Day",
        },
      ];
      const approvedRequestsMock = [
        {
          arrangement_id: 101,
          start_date: "2024-11-01",
          session_type: "Full-Day",
        },
      ];
      const staffMock = {
        staff_fname: "John",
        staff_lname: "Doe",
      };

      RequestGroup.findByPk.mockResolvedValue(requestGroupMock);
      ArrangementRequest.findAll
        .mockResolvedValueOnce(arrangementRequestsMock)
        .mockResolvedValueOnce(approvedRequestsMock);
      ArrangementRequest.update.mockResolvedValue([1]);
      Schedule.upsert.mockResolvedValue();
      Staff.findByPk.mockResolvedValue(staffMock);

      global.scheduleNotification = jest.fn();

      const result = await arrangementService.approvePartialRequest(
        id,
        comment,
        data,
        manager_id
      );

      expect(result).toEqual({ requestGroup: requestGroupMock });
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id, {
        transaction: mockTransaction,
      });
      expect(ArrangementRequest.update).toHaveBeenCalledTimes(2);
      expect(Schedule.upsert).toHaveBeenCalledTimes(1);
    });

    it("should rollback the transaction on error", async () => {
      const id = 1;
      const comment = "Reviewed by manager";
      const data = { 101: "Approved", 102: "Rejected" };
      const manager_id = 5;

      RequestGroup.findByPk.mockRejectedValue(new Error("Database error"));

      await expect(
        arrangementService.approvePartialRequest(id, comment, data, manager_id)
      ).rejects.toThrow("Database error");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
  describe("revokeRequest", () => {
    it("should revoke the request and delete schedule entries", async () => {
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      const mockRequests = [
        {
          arrangement_id: 101,
          session_type: "WFH",
          start_date: "2024-10-29",
        },
      ];
      ArrangementRequest.findAll = jest.fn().mockResolvedValue(mockRequests);

      Schedule.destroy = jest.fn().mockResolvedValue(1);

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      const result = await arrangementService.revokeRequest(
        id,
        comment,
        manager_id
      );

      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Revoked", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      expect(Schedule.destroy).toHaveBeenCalledWith({
        where: {
          staff_id: mockRequestGroup.staff_id,
          start_date: mockRequests[0].start_date,
          session_type: mockRequests[0].session_type,
          request_id: mockRequests[0].arrangement_id,
        },
        transaction: mockTransaction,
      });

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: mockRequestGroup });
    });

    it("should throw an error if the request group is not found", async () => {
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      await expect(
        arrangementService.revokeRequest(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      await expect(
        arrangementService.revokeRequest(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
  describe("withdrawRequest", () => {
    it("should withdraw the request and delete schedule entries", async () => {
      const id = 1;
      const comment = "Request withdrawn by staff";
      const staff_id = 100;

      const mockRequestGroup = { request_group_id: id, staff_id: 100 };
      const mockRequests = [
        { arrangement_id: 101, start_date: "2024-11-06" },
        { arrangement_id: 102, start_date: "2024-11-13" },
      ];

      RequestGroup.findByPk.mockResolvedValue(mockRequestGroup);
      ArrangementRequest.update.mockResolvedValue([1]);
      ArrangementRequest.findAll.mockResolvedValue(mockRequests);
      Schedule.destroy.mockResolvedValue(1);

      const result = await arrangementService.withdrawRequest(
        id,
        comment,
        staff_id
      );

      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Withdrawn", approval_comment: comment },
        { where: { request_group_id: id }, transaction: mockTransaction }
      );

      for (const request of mockRequests) {
        expect(Schedule.destroy).toHaveBeenCalledWith({
          where: {
            staff_id: mockRequestGroup.staff_id,
            start_date: request.start_date,
          },
          transaction: mockTransaction,
        });
      }

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({
        requestGroup: mockRequestGroup,
        requests: mockRequests,
      });
    });

    it("should throw an error if the request group is not found", async () => {
      RequestGroup.findByPk.mockResolvedValue(null);

      const id = 1;
      const comment = "Request withdrawn by staff";
      const staff_id = 100;

      await expect(
        arrangementService.withdrawRequest(id, comment, staff_id)
      ).rejects.toThrow("Request group not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      RequestGroup.findByPk.mockResolvedValue({
        request_group_id: 1,
        staff_id: 100,
      });
      ArrangementRequest.update.mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Request withdrawn by staff";
      const staff_id = 100;

      await expect(
        arrangementService.withdrawRequest(id, comment, staff_id)
      ).rejects.toThrow("Update failed");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
  describe("rejectRequest", () => {
    it("should reject the request, delete related schedules, send notification, and commit the transaction", async () => {
      const id = 1;
      const comment = "Rejected by manager";
      const manager_id = 5;

      const requestGroupMock = { staff_id: 123 };
      const requestsMock = [
        { arrangement_id: 101, start_date: "2024-11-01" },
        { arrangement_id: 102, start_date: "2024-11-02" },
      ];
      const staffMock = {
        staff_fname: "John",
        staff_lname: "Doe",
      };

      RequestGroup.findByPk.mockResolvedValue(requestGroupMock);
      ArrangementRequest.update.mockResolvedValue([1]);
      ArrangementRequest.findAll.mockResolvedValue(requestsMock);
      Schedule.destroy.mockResolvedValue(1);
      Staff.findByPk.mockResolvedValue(staffMock);

      global.scheduleNotification = jest.fn();

      const result = await arrangementService.rejectRequest(
        id,
        comment,
        manager_id
      );

      expect(result).toEqual({ requestGroup: requestGroupMock });
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id, {
        transaction: mockTransaction,
      });
      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Rejected", approval_comment: comment },
        { where: { request_group_id: id }, transaction: mockTransaction }
      );
      expect(ArrangementRequest.findAll).toHaveBeenCalledWith({
        where: { request_group_id: id },
        transaction: mockTransaction,
      });
      expect(Schedule.destroy).toHaveBeenCalledTimes(requestsMock.length);

      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should rollback the transaction on error", async () => {
      const id = 1;
      const comment = "Rejected by manager";
      const manager_id = 5;

      RequestGroup.findByPk.mockRejectedValue(new Error("Database error"));

      await expect(
        arrangementService.rejectRequest(id, comment, manager_id)
      ).rejects.toThrow("Database error");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("undo", () => {
    it('should revert the request status to "Pending"', async () => {
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      const result = await arrangementService.undo(id, comment, manager_id);

      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Pending", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: { id: 1 } });
    });

    it("should throw an error if the request group is not found", async () => {
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      await expect(
        arrangementService.undo(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      await expect(
        arrangementService.undo(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
  it("should return approved requests for the given manager", async () => {
    const mockRequestGroups = [
      {
        request_group_id: 1,
        request_created_date: new Date("2024-10-28"),
        Staff: {
          staff_id: 100,
          staff_fname: "John",
          staff_lname: "Doe",
          dept: "IT",
          position: "Developer",
        },
        ArrangementRequests: [
          {
            arrangement_id: 101,
            session_type: "WFH",
            start_date: new Date("2024-10-29"),
            description: "Working from home",
            request_status: "Approved",
            updated_at: new Date(),
            approval_comment: "Approved by manager",
            approved_at: new Date(),
          },
        ],
      },
    ];

    RequestGroup.findAll = jest.fn().mockResolvedValue(mockRequestGroups);

    const manager_id = 1;

    const response = await arrangementService.getApprovedRequests(manager_id);

    expect(RequestGroup.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: Staff,
          where: { reporting_manager_id: manager_id },
          attributes: [
            "staff_id",
            "staff_fname",
            "staff_lname",
            "dept",
            "position",
          ],
        },
        {
          model: ArrangementRequest,
          where: { request_status: "Approved" },
          attributes: [
            "arrangement_id",
            "session_type",
            "start_date",
            "description",
            "request_status",
            "updated_at",
            "approval_comment",
            "approved_at",
          ],
        },
      ],
    });

    expect(response).toEqual({
      manager_id: manager_id,
      request_groups: [
        {
          request_group_id: 1,
          staff: {
            staff_id: 100,
            staff_fname: "John",
            staff_lname: "Doe",
            dept: "IT",
            position: "Developer",
          },
          request_created_date: new Date("2024-10-28"),
          arrangement_requests: [
            {
              arrangement_id: 101,
              session_type: "WFH",
              start_date: new Date("2024-10-29"),
              description: "Working from home",
              request_status: "Approved",
              updated_at: expect.any(Date),
              approval_comment: "Approved by manager",
              approved_at: expect.any(Date),
            },
          ],
        },
      ],
    });
  });
});
