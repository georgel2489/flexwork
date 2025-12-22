"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Paper,
  IconButton,
  Grid,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from "axios";

const SchedulePage = () => {
  const { data: session } = useSession();
  const theme = useTheme();
  const [token, setToken] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [teamSchedules, setTeamSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [displayFilter, setDisplayFilter] = useState('Work home');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  const fetchOrganizationSchedules = async (month) => {
    if (!token) return;

    setLoading(true);
    try {
      const startOfMonth = dayjs(month).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = dayjs(month).endOf('month').format('YYYY-MM-DD');

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/hr/?start_date=${startOfMonth}&end_date=${endOfMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const schedulesByDate = {};
      Object.keys(response.data).forEach(date => {
        const allStaff = {};
        Object.keys(response.data[date]).forEach(dept => {
          if (dept !== 'CEO') {
            Object.keys(response.data[date][dept]).forEach(role => {
              const roleData = response.data[date][dept][role];
              Object.keys(roleData).forEach(location => {
                if (!allStaff[location]) {
                  allStaff[location] = [];
                }
                allStaff[location] = [...allStaff[location], ...roleData[location]];
              });
            });
          }
        });
        schedulesByDate[date] = allStaff;
      });

      setTeamSchedules(schedulesByDate);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrganizationSchedules(selectedMonth);
    }
  }, [selectedMonth, token]);

  const handleMonthChange = (direction) => {
    setSelectedMonth((prev) =>
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
  };

  const handleFilterChange = (event) => {
    setDisplayFilter(event.target.value);
  };

  const handleDayClick = (day, scheduleForDay) => {
    if (!day || !scheduleForDay) return;

    setSelectedDayData({
      date: day.format('MMMM D, YYYY'),
      scheduleType: displayFilter,
      users: scheduleForDay[displayFilter] || [],
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDayData(null);
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Display</InputLabel>
            <Select
              value={displayFilter}
              onChange={handleFilterChange}
              label="Display"
              size="small"
            >
              <MenuItem value="In office">In Office</MenuItem>
              <MenuItem value="Work home">Work home</MenuItem>
              <MenuItem value="Day off">Day off</MenuItem>
              <MenuItem value="Vacation">Vacation</MenuItem>
              <MenuItem value="Official holiday">Official Holiday</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <IconButton onClick={() => handleMonthChange('prev')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {selectedMonth.format('MMMM YYYY')}
          </Typography>
          <IconButton onClick={() => handleMonthChange('next')}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>

        <Grid container spacing={1}>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography variant="subtitle2" align="center">{day}</Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          {getDaysInMonthWithPadding(selectedMonth).map((day, index) => {
            const formattedDay = day ? day.format('YYYY-MM-DD') : null;
            const scheduleForDay = formattedDay ? teamSchedules[formattedDay] : null;
            const users = scheduleForDay ? (scheduleForDay[displayFilter] || []) : [];
            const isToday = day && day.isSame(dayjs(), 'day');
            const isOfficialHoliday = scheduleForDay?.['Official holiday']?.length > 0;

            return (
              <Grid item xs={12 / 7} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: '10px',
                    minHeight: '120px',
                    maxHeight: '120px',
                    overflow: 'auto',
                    backgroundColor: isToday ? (theme.palette.mode === 'dark' ? '#3a3a3a' : '#e0e0e0') : 'transparent',
                    cursor: scheduleForDay ? 'pointer' : 'default',
                    '&:hover': scheduleForDay ? {
                      backgroundColor: isToday
                        ? (theme.palette.mode === 'dark' ? '#4a4a4a' : '#d0d0d0')
                        : (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'),
                    } : {},
                  }}
                  onClick={() => handleDayClick(day, scheduleForDay)}
                >
                  {day ? (
                    <>
                      <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {day.format('D')}
                      </Typography>
                      {isOfficialHoliday && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#FFC107',
                            fontWeight: 'bold',
                            mb: 0.5,
                            fontSize: '0.75rem',
                          }}
                        >
                          Official holiday
                        </Typography>
                      )}
                      {users.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {users.map((user, userIndex) => (
                            <Chip
                              key={userIndex}
                              label={user}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                fontSize: '0.7rem',
                                height: '22px',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box sx={{ minHeight: '40px' }}></Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedDayData?.date}
          </DialogTitle>
          <DialogContent>
            {selectedDayData && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  {selectedDayData.scheduleType} ({selectedDayData.users.length})
                </Typography>
                {selectedDayData.users.length > 0 ? (
                  <List dense>
                    {selectedDayData.users.map((user, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={user} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No users for this schedule type
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
}

function getDaysInMonthWithPadding(selectedMonth) {
  const firstDayOfMonth = selectedMonth.startOf('month');
  const daysInMonth = selectedMonth.daysInMonth();
  const startDayOfWeek = firstDayOfMonth.day();
  const daysArray = [];

  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  for (let i = 0; i < adjustedStartDay; i++) {
    daysArray.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(dayjs(selectedMonth).date(i));
  }

  return daysArray;
}

export default SchedulePage;
