const holidayService = require("../services/holidayService");

exports.createHoliday = async (req, res) => {
  try {
    const { holiday_date, holiday_name, description } = req.body;

    if (!holiday_date || !holiday_name) {
      return res.status(400).json({ error: "Holiday date and name are required" });
    }

    const newHoliday = await holidayService.createHoliday({
      holiday_date,
      holiday_name,
      description,
    });

    res.status(201).json({
      message: "Official holiday created successfully",
      holiday: newHoliday,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await holidayService.getAllHolidays();
    res.status(200).json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHolidaysByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    const holidays = await holidayService.getHolidaysByDateRange(start_date, end_date);
    res.status(200).json(holidays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const { holiday_id } = req.params;
    const updateData = req.body;

    const updatedHoliday = await holidayService.updateHoliday(holiday_id, updateData);

    res.status(200).json({
      message: "Official holiday updated successfully",
      holiday: updatedHoliday,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const { holiday_id } = req.params;

    const result = await holidayService.deleteHoliday(holiday_id);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
