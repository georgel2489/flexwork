"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Paper,
  IconButton,
  Chip,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar, PickersDay } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from "@mui/icons-material/Add";
import dayjs from 'dayjs';
import axios from 'axios';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Custom day component showing list of users based on filter
function CustomDay(props) {
  const { day, outsideCurrentMonth, teamSchedules, displayFilter, ...other } = props;

  const formattedDay = day.format('YYYY-MM-DD');
  const scheduleForDay = teamSchedules[formattedDay] || {};
  
  // Get people based on selected filter
  const users = scheduleForDay[displayFilter] || [];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        minHeight: '80px',
        p: 1,
      }}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      <Box sx={{ mt: 0.5, width: '100%' }}>
        {users.slice(0, 3).map((user, index) => (
          <Chip
            key={index}
            label={user}
            size="small"
            color="success"
            variant="outlined"
            sx={{
              mb: 0.3,
              width: '100%',
              justifyContent: 'flex-start',
              fontSize: '0.65rem',
              height: '20px',
            }}
          />
        ))}
        {users.length > 3 && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            +{users.length - 3} more
          </Typography>
        )}
      </Box>
    </Box>
  );
}

const RequestGroupsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [teamSchedules, setTeamSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [displayFilter, setDisplayFilter] = useState('In Office');

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  const fetchTeamSchedules = async (month) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const startOfMonth = dayjs(month).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = dayjs(month).endOf('month').format('YYYY-MM-DD');
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules/staff/team/?start_date=${startOfMonth}&end_date=${endOfMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Transform response data to be indexed by date
      const schedulesByDate = {};
      Object.keys(response.data).forEach(date => {
        const dept = session?.user?.dept;
        if (response.data[date] && response.data[date][dept]) {
          // Flatten all roles into one object per date
          const allStaff = {};
          Object.keys(response.data[date][dept]).forEach(role => {
            const roleData = response.data[date][dept][role];
            Object.keys(roleData).forEach(location => {
              if (!allStaff[location]) {
                allStaff[location] = [];
              }
              allStaff[location] = [...allStaff[location], ...roleData[location]];
            });
          });
          schedulesByDate[date] = allStaff;
        }
      });
      
      setTeamSchedules(schedulesByDate);
    } catch (error) {
      console.error("Error fetching team schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTeamSchedules(selectedMonth);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Box sx={{ p: 2 }}>
          {/* Filter Select and Apply Button */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Display</InputLabel>
              <Select
                value={displayFilter}
                onChange={handleFilterChange}
                label="Display"
                size="small"
              >
                <MenuItem value="In Office">In Office</MenuItem>
                <MenuItem value="Work from home">Work from Home</MenuItem>
                <MenuItem value="Off day">Off Day</MenuItem>
                <MenuItem value="Vacation">Vacation</MenuItem>
                <MenuItem value="Official holiday">Official Holiday</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push("/arrangement/apply-arrangement")}
            >
              Apply for Arrangement
            </Button>
          </Box>

          {/* Full Width Calendar */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={() => handleMonthChange('prev')}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                {selectedMonth.format('MMMM YYYY')}
              </Typography>
              <IconButton onClick={() => handleMonthChange('next')}>
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <DateCalendar
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slots={{
                day: CustomDay,
              }}
              slotProps={{
                day: {
                  teamSchedules,
                  displayFilter,
                },
              }}
              views={['day']}
              onMonthChange={(newMonth) => setSelectedMonth(newMonth)}
              sx={{
                width: '100%',
                maxWidth: 'none',
                height: 'auto',
                '& .MuiDayCalendar-header': {
                  justifyContent: 'space-between',
                },
                '& .MuiDayCalendar-weekContainer': {
                  justifyContent: 'space-between',
                  margin: 0,
                },
                '& .MuiPickersDay-root': {
                  width: 'auto',
                  minWidth: '100px',
                  maxWidth: '140px',
                },
                '& .MuiDayCalendar-slideTransition': {
                  minHeight: '400px',
                },
              }}
            />
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default RequestGroupsPage;
