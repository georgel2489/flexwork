"use client";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Grid,
  Box,
  Typography,
  Paper,
  useMediaQuery,
  Badge,
  IconButton,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import React, { useState, useEffect } from "react";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import axios from "axios";
import { useSession } from "next-auth/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

function CustomDay(props) {
  const { day, outsideCurrentMonth, schedules, ...other } = props;

  const formattedDay = day.format("YYYY-MM-DD");
  const scheduleForDay = schedules[formattedDay] || null;

  const badgeContent = scheduleForDay
    ? scheduleForDay === "Work home"
      ? "🏡"
      : scheduleForDay === "Day off"
        ? "🌴"
        : scheduleForDay === "Vacation"
          ? "✈️"
          : scheduleForDay === "Official holiday"
            ? "🎉"
            : scheduleForDay === "Pending Request"
              ? "⏳"
              : "🏢"
    : undefined;

  return (
    <Badge key={day.toString()} overlap="circular" badgeContent={badgeContent}>
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

export default function ResponsiveCalendar() {
  const { data: session } = useSession();
  const theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [schedules, setSchedules] = useState({});
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (session?.user?.token) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  const fetchScheduleData = async (month) => {
    try {
      if (!token) {
        return;
      }
      const startOfMonth = dayjs(month).startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs(month).endOf("month").format("YYYY-MM-DD");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/staff/?start_date=${startOfMonth}&end_date=${endOfMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSchedules(response.data.schedules);
    } catch (error) {}
  };

  useEffect(() => {
    if (token) {
      fetchScheduleData(selectedMonth);
    }
  }, [selectedMonth, token]);

  const handleMonthChange = (direction) => {
    setSelectedMonth((prev) =>
      direction === "prev" ? prev.subtract(1, "month") : prev.add(1, "month")
    );
  };

  const handleMonthChangeMobile = (newMonth) => {
    setSelectedMonth(newMonth);
  };

  const getScheduleColor = (scheduleType) => {
    if (scheduleType.startsWith("Work home")) return "#2196F3";
    if (scheduleType.startsWith("In office")) return "#4CAF50";
    if (scheduleType === "Pending Request") return "#FF9800";
    if (scheduleType === "Day off") return "#9C27B0";
    if (scheduleType === "Vacation") return "#FF5722";
    if (scheduleType === "Official holiday") return "#FFC107";
    return "inherit";
  };

  return (
    <Box sx={{ padding: "20px" }}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        {isMobile ? (
          <>
            <DateCalendar
              value={selectedMonth}
              onChange={(newValue) => setSelectedMonth(newValue)}
              onMonthChange={handleMonthChangeMobile}
              dayOfWeekFormatter={(day) => day.format("dd").toUpperCase()}
              renderDay={(day, _value, DayComponentProps) => {
                const schedule = schedules[day.format("YYYY-MM-DD")];
                const color = schedule ? getScheduleColor(schedule) : null;
                const isToday = day.isSame(dayjs(), "day");

                return (
                  <Box
                    sx={{
                      borderRadius: "50%",
                      width: "30px",
                      height: "30px",
                      backgroundColor:
                        color ||
                        (isToday
                          ? theme.palette.mode === "dark"
                            ? "#3a3a3a"
                            : "#e0e0e0"
                          : "transparent"),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: color ? "#fff" : "#000",
                    }}
                  >
                    {day.format("D")}
                  </Box>
                );
              }}
              slots={{
                day: (props) => <CustomDay {...props} schedules={schedules} />,
              }}
              showDaysOutsideCurrentMonth
              allowKeyboardControl={false}
            />
          </>
        ) : (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <IconButton onClick={() => handleMonthChange("prev")}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5">
                {selectedMonth.format("MMMM YYYY")}
              </Typography>
              <IconButton onClick={() => handleMonthChange("next")}>
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <Grid container spacing={1}>
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                <Grid item xs={12 / 7} key={day}>
                  <Typography variant="subtitle2" align="center">
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              {getDaysInMonthWithPadding(selectedMonth).map((day, index) => {
                const isToday = day && day.isSame(dayjs(), "day");
                const scheduleForDay = day
                  ? schedules[day.format("YYYY-MM-DD")]
                  : null;

                const getEmoji = (scheduleType) => {
                  if (!scheduleType) return null;
                  if (scheduleType === "Work home") return "🏡";
                  if (scheduleType === "Day off") return "🌴";
                  if (scheduleType === "Vacation") return "✈️";
                  if (scheduleType === "Official holiday") return "🎉";
                  if (scheduleType === "Pending Request") return "⏳";
                  if (scheduleType === "In office") return "🏢";
                  return null;
                };

                const emoji = getEmoji(scheduleForDay);

                return (
                  <Grid item xs={12 / 7} key={index}>
                    <Paper
                      elevation={3}
                      sx={{
                        padding: "10px",
                        minHeight: "100px",
                        maxHeight: "100px",
                        overflow: "hidden",
                        backgroundColor: isToday
                          ? theme.palette.mode === "dark"
                            ? "#3a3a3a"
                            : "#e0e0e0"
                          : "transparent",
                      }}
                    >
                      {day ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="h6">
                              {day.format("D")}
                            </Typography>
                            {emoji && (
                              <Typography variant="body2">{emoji}</Typography>
                            )}
                          </Box>
                          {scheduleForDay && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: getScheduleColor(scheduleForDay),
                                fontWeight: "bold",
                                mb: 0.5,
                                fontSize: "0.75rem",
                              }}
                            >
                              {scheduleForDay}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Box sx={{ minHeight: "40px" }}></Box>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </LocalizationProvider>
    </Box>
  );
}

function getDaysInMonthWithPadding(selectedMonth) {
  const firstDayOfMonth = selectedMonth.startOf("month");
  const daysInMonth = selectedMonth.daysInMonth();
  const startDayOfWeek = firstDayOfMonth.day();
  const daysArray = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(dayjs(selectedMonth).date(i));
  }

  return daysArray;
}
