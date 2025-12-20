const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const authenticateToken = require("../middleware/authenticateTokenMiddleware");
const authorizeRole = require("../middleware/authorizeRoleMiddleware");

router.post(
  "/",
  authenticateToken,
  authorizeRole([1]),
  holidayController.createHoliday
);

router.get(
  "/",
  authenticateToken,
  authorizeRole([1]),
  holidayController.getAllHolidays
);

router.get(
  "/range",
  authenticateToken,
  holidayController.getHolidaysByDateRange
);

router.put(
  "/:holiday_id",
  authenticateToken,
  authorizeRole([1]),
  holidayController.updateHoliday
);

router.delete(
  "/:holiday_id",
  authenticateToken,
  authorizeRole([1]),
  holidayController.deleteHoliday
);

module.exports = router;
