const {
  Schedule,
  Staff,
  ArrangementRequest,
  RequestGroup,
  OfficialHoliday,
} = require("../models");
const dayjs = require("dayjs");
const { Op } = require("sequelize");
const moment = require("moment");
const staff = require("../models/staff");

const isWeekend = (date) => {
  const day = moment(date).day();
  return day === 0 || day === 6;
};

exports.createSchedule = async (data) => {
  return await Schedule.create(data);
};

exports.getSchedulePersonal = async ({ staff_id, start_date, end_date }) => {
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);

  const startDate = dayjs(start_date).startOf("day").toDate();
  const endDate = dayjs(end_date).endOf("day").toDate();

  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
      staff_id,
    },
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  const pendingRequests = await ArrangementRequest.findAll({
    where: {
      request_status: "Pending",
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: RequestGroup,
        where: {
          staff_id,
        },
      },
    ],
  });

  const officialHolidays = await OfficialHoliday.findAll({
    where: {
      holiday_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
  });

  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        dates.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate = currentDate.add(1, "days");
    }

    return dates;
  };

  const allDates = generateDateRange(start_date, end_date);

  const result = {};

  const scheduleLookup = {};
  schedules.forEach((schedule) => {
    const dateKey = moment(schedule.start_date).format("YYYY-MM-DD");
    if (!scheduleLookup[dateKey]) {
      scheduleLookup[dateKey] = {
        session_type: schedule.session_type,
      };
    }
  });

  const pendingRequestLookup = {};
  pendingRequests.forEach((request) => {
    const dateKey = moment(request.start_date).format("YYYY-MM-DD");
    pendingRequestLookup[dateKey] = "Pending Request";
  });

  const holidayLookup = {};
  officialHolidays.forEach((holiday) => {
    const dateKey = moment(holiday.holiday_date).format("YYYY-MM-DD");
    holidayLookup[dateKey] = "Official holiday";
  });

  allDates.forEach((date) => {
    if (!result[date]) {
      result[date] = "";
    }

    if (holidayLookup[date]) {
      result[date] = holidayLookup[date];
    } else if (pendingRequestLookup[date]) {
      result[date] = pendingRequestLookup[date];
    } else if (scheduleLookup[date]) {
      const scheduleForDate = scheduleLookup[date];

      if (scheduleForDate.session_type === "Work home") {
        result[date] = "Work home";
      } else if (scheduleForDate.session_type === "Day off") {
        result[date] = "Day off";
      } else if (scheduleForDate.session_type === "Vacation") {
        result[date] = "Vacation";
      } else {
        result[date] = "In office";
      }
    } else {
      result[date] = "In office";
    }
  });

  return {
    staff_id: staff_id,
    schedules: result,
  };
};

exports.getScheduleByTeam = async ({ staff_id, start_date, end_date }) => {
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);
  const position = currStaff.position;
  const department = currStaff.dept;

  const staffQuery = {
    where: {
      dept: department,
      position,
    },
  };

  const allStaff = await Staff.findAll(staffQuery);

  const startDate = dayjs(start_date).startOf("day").toDate();
  const endDate = dayjs(end_date).endOf("day").toDate();
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          dept: department,
          position,
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  const officialHolidays = await OfficialHoliday.findAll({
    where: {
      holiday_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
  });

  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        dates.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate = currentDate.add(1, "days");
    }

    return dates;
  };

  const allDates = generateDateRange(start_date, end_date);

  const result = {};

  allDates.forEach((date) => {
    result[date] = {};
  });

  const scheduleLookup = {};

  const positionKey = position;
  const departmentKey = department;

  schedules.forEach((schedule) => {
    const dateKey = moment(schedule.start_date).format("YYYY-MM-DD");
    const staffId = schedule.staff_id;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  const holidayLookup = {};
  officialHolidays.forEach((holiday) => {
    const dateKey = moment(holiday.holiday_date).format("YYYY-MM-DD");
    holidayLookup[dateKey] = true;
  });

  allStaff.forEach((staff) => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach((date) => {
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {};
      }

      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work home": [],
          "Day off": [],
          Vacation: [],
          "Official holiday": [],
        };
      }

      if (holidayLookup[date]) {
        result[date][departmentKey][positionKey]["Official holiday"].push(
          staffName
        );
      } else if (
        scheduleLookup[staff.staff_id] &&
        scheduleLookup[staff.staff_id][date]
      ) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        if (scheduleForDate.session_type === "Work home") {
          result[date][departmentKey][positionKey]["Work home"].push(staffName);
        } else if (scheduleForDate.session_type === "Day off") {
          result[date][departmentKey][positionKey]["Day off"].push(staffName);
        } else if (scheduleForDate.session_type === "Vacation") {
          result[date][departmentKey][positionKey]["Vacation"].push(staffName);
        } else if (scheduleForDate.session_type === "Official holiday") {
          result[date][departmentKey][positionKey]["Official holiday"].push(
            staffName
          );
        } else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};

exports.getScheduleByDepartment = async ({
  staff_id,
  start_date,
  end_date,
}) => {
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);
  const position = currStaff.position;
  const departmentname = currStaff.dept;

  const staffQuery = {
    where: {
      dept: departmentname,
      position: {
        [Op.ne]: "Director",
      },
    },
  };

  const allStaff = await Staff.findAll(staffQuery);

  const startDate = dayjs(start_date).startOf("day").toDate();
  const endDate = dayjs(end_date).endOf("day").toDate();
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          ...(departmentname && { dept: departmentname }),
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  const officialHolidays = await OfficialHoliday.findAll({
    where: {
      holiday_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
  });

  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        dates.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate = currentDate.add(1, "days");
    }

    return dates;
  };

  const allDates = generateDateRange(start_date, end_date);

  const result = {};

  allDates.forEach((date) => {
    result[date] = {};
  });

  const scheduleLookup = {};

  schedules.forEach((schedule) => {
    const dateKey = moment(schedule.start_date).format("YYYY-MM-DD");
    const staffId = schedule.staff_id;
    const positionKey = schedule.Staff.position;
    const departmentKey = schedule.Staff.dept;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  const holidayLookup = {};
  officialHolidays.forEach((holiday) => {
    const dateKey = moment(holiday.holiday_date).format("YYYY-MM-DD");
    holidayLookup[dateKey] = true;
  });

  allStaff.forEach((staff) => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach((date) => {
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {};
      }

      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work home": [],
          "Day off": [],
          Vacation: [],
          "Official holiday": [],
        };
      }

      if (holidayLookup[date]) {
        result[date][departmentKey][positionKey]["Official holiday"].push(
          staffName
        );
      } else if (
        scheduleLookup[staff.staff_id] &&
        scheduleLookup[staff.staff_id][date]
      ) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        if (scheduleForDate.session_type === "Work home") {
          result[date][departmentKey][positionKey]["Work home"].push(staffName);
        } else if (scheduleForDate.session_type === "Day off") {
          result[date][departmentKey][positionKey]["Day off"].push(staffName);
        } else if (scheduleForDate.session_type === "Vacation") {
          result[date][departmentKey][positionKey]["Vacation"].push(staffName);
        } else if (scheduleForDate.session_type === "Official holiday") {
          result[date][departmentKey][positionKey]["Official holiday"].push(
            staffName
          );
        } else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};

exports.getScheduleGlobal = async ({
  departmentname,
  position,
  start_date,
  end_date,
}) => {
  const staffQuery = {
    where: {
      ...(departmentname && { dept: departmentname }),
      ...(position && { position }),
    },
  };

  const allStaff = await Staff.findAll(staffQuery);

  const startDate = dayjs(start_date).startOf("day").toDate();
  const endDate = dayjs(end_date).endOf("day").toDate();
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          ...(departmentname && { dept: departmentname }),
          ...(position && { position }),
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  const officialHolidays = await OfficialHoliday.findAll({
    where: {
      holiday_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
  });

  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) {
        dates.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate = currentDate.add(1, "days");
    }

    return dates;
  };

  const allDates = generateDateRange(start_date, end_date);

  const result = {};

  allDates.forEach((date) => {
    result[date] = {};
  });

  const scheduleLookup = {};

  schedules.forEach((schedule) => {
    const dateKey = moment(schedule.start_date).format("YYYY-MM-DD");
    const staffId = schedule.staff_id;
    const positionKey = schedule.Staff.position;
    const departmentKey = schedule.Staff.dept;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  const holidayLookup = {};
  officialHolidays.forEach((holiday) => {
    const dateKey = moment(holiday.holiday_date).format("YYYY-MM-DD");
    holidayLookup[dateKey] = true;
  });

  allStaff.forEach((staff) => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach((date) => {
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {};
      }

      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work home": [],
          "Day off": [],
          Vacation: [],
          "Official holiday": [],
        };
      }

      if (holidayLookup[date]) {
        result[date][departmentKey][positionKey]["Official holiday"].push(
          staffName
        );
      } else if (
        scheduleLookup[staff.staff_id] &&
        scheduleLookup[staff.staff_id][date]
      ) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        if (scheduleForDate.session_type === "Work home") {
          result[date][departmentKey][positionKey]["Work home"].push(staffName);
        } else if (scheduleForDate.session_type === "Day off") {
          result[date][departmentKey][positionKey]["Day off"].push(staffName);
        } else if (scheduleForDate.session_type === "Vacation") {
          result[date][departmentKey][positionKey]["Vacation"].push(staffName);
        } else if (scheduleForDate.session_type === "Official holiday") {
          result[date][departmentKey][positionKey]["Official holiday"].push(
            staffName
          );
        } else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};
