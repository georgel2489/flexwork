const { OfficialHoliday } = require("../models");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

exports.createHoliday = async (holidayData) => {
  try {
    const existingHoliday = await OfficialHoliday.findOne({
      where: { holiday_date: holidayData.holiday_date },
    });

    if (existingHoliday) {
      throw new Error("A holiday already exists for this date");
    }

    const newHoliday = await OfficialHoliday.create({
      holiday_date: holidayData.holiday_date,
      holiday_name: holidayData.holiday_name,
    });

    return newHoliday;
  } catch (error) {
    throw new Error(error.message || "Could not create official holiday");
  }
};

exports.getAllHolidays = async () => {
  try {
    const holidays = await OfficialHoliday.findAll({
      order: [["holiday_date", "ASC"]],
    });
    return holidays;
  } catch (error) {
    throw new Error("Could not fetch official holidays");
  }
};

exports.getHolidaysByDateRange = async (start_date, end_date) => {
  try {
    const startDate = dayjs(start_date).startOf("day").toDate();
    const endDate = dayjs(end_date).endOf("day").toDate();

    const holidays = await OfficialHoliday.findAll({
      where: {
        holiday_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      order: [["holiday_date", "ASC"]],
    });

    return holidays;
  } catch (error) {
    throw new Error("Could not fetch holidays for the specified date range");
  }
};

exports.updateHoliday = async (holiday_id, updateData) => {
  try {
    const holiday = await OfficialHoliday.findByPk(holiday_id);

    if (!holiday) {
      throw new Error("Holiday not found");
    }

    if (
      updateData.holiday_date &&
      updateData.holiday_date !== holiday.holiday_date
    ) {
      const existingHoliday = await OfficialHoliday.findOne({
        where: {
          holiday_date: updateData.holiday_date,
          holiday_id: { [Op.ne]: holiday_id },
        },
      });

      if (existingHoliday) {
        throw new Error("A holiday already exists for this date");
      }
    }

    await holiday.update({
      holiday_date: updateData.holiday_date || holiday.holiday_date,
      holiday_name: updateData.holiday_name || holiday.holiday_name,
      updated_at: new Date(),
    });

    return holiday;
  } catch (error) {
    throw new Error(error.message || "Could not update official holiday");
  }
};

exports.deleteHoliday = async (holiday_id) => {
  try {
    const holiday = await OfficialHoliday.findByPk(holiday_id);

    if (!holiday) {
      throw new Error("Holiday not found");
    }

    await holiday.destroy();
    return { message: "Holiday deleted successfully" };
  } catch (error) {
    throw new Error(error.message || "Could not delete official holiday");
  }
};
