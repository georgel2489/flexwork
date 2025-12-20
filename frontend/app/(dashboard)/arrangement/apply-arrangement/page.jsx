"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Import isSameOrAfter plugin
dayjs.extend(isSameOrAfter); // Extend Day.js

import {
  Radio,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControlLabel,
  FormGroup,
  Box,
} from "@mui/material";
import axios from "axios";
import { useNotification } from "../../../contexts/NotificationContext";

const ApplyArrangementPage = () => {
  const { data: session } = useSession();
  const { showSuccess, showError, showWarning } = useNotification();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  // Function to calculate 2 working days in advance
  const calculateTwoWorkingDays = () => {
    const today = dayjs().startOf("day");
    let daysToAdd = 2;
    let adjustedDate = today;

    while (daysToAdd > 0) {
      adjustedDate = adjustedDate.add(1, "day");
      if (adjustedDate.day() !== 0 && adjustedDate.day() !== 6) {
        // Skip weekends
        daysToAdd--;
      }
    }
    return adjustedDate;
  };

  // Set placeholder to 2 working days in advance
  const [selectedDate, setSelectedDate] = useState(calculateTwoWorkingDays());
  const [startDate, setStartDate] = useState(calculateTwoWorkingDays());
  const [loading, setLoading] = useState(false);
  const [applyMode, setApplyMode] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [desc, setDesc] = useState("");

  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState("");
  const [numOccurrences, setNumOccurrences] = useState(1);
  const [repeatType, setRepeatType] = useState("weekly");

  const handleSessionType = (event) => {
    setSessionType(event.target.value);
  };

  const handleDescChange = (event) => {
    setDesc(event.target.value);
  };

  const handleDateChange = (event) => {
    const newDate = dayjs(event.target.value);
    const adjustedDate = calculateTwoWorkingDays();

    if (newDate.day() === 0 || newDate.day() === 6) {
      showWarning("You cannot apply for WFH on weekends. Please select a weekday.");
    } else if (newDate.isSameOrAfter(adjustedDate, "day")) {
      setSelectedDate(newDate);
    } else {
      showWarning("Please select a date that is at least 2 working days in advance.");
    }
  };

  const handleStartDateChange = (event) => {
    const newStartDate = dayjs(event.target.value);
    const adjustedDate = calculateTwoWorkingDays();

    if (newStartDate.day() === 0 || newStartDate.day() === 6) {
      showWarning("The start date cannot be on a weekend. Please select a weekday.");
    } else if (newStartDate.isSameOrAfter(adjustedDate, "day")) {
      setStartDate(newStartDate);
    } else {
      showWarning("The start date must be at least 2 working days in advance.");
    }
  };

  const handleDayOfWeekChange = (day) => {
    setSelectedDaysOfWeek({
      ...selectedDaysOfWeek,
      [day]: !selectedDaysOfWeek[day],
    });
  };

  const handleNumOccurrencesChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setNumOccurrences(value > 0 ? Math.min(value, 12) : 1); // Ensure minimum of 1 and maximum of 12 occurrences
  };

  const submitAdhocRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }
    if (!sessionType) {
      alert("Please select a session type before submitting.");
      return;
    }

    try {
      const formattedDate = selectedDate.format("YYYY-MM-DD");

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/`,
        {
          session_type: sessionType,
          start_date: formattedDate,
          description: desc || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSuccess("Your WFH request has been submitted successfully!");
      
      // Reset form
      setApplyMode("");
      setSessionType("");
      setDesc("");
      setSelectedDate(calculateTwoWorkingDays());
    } catch (error) {
      console.error("Error applying:", error);
      showError("There was an error processing your request. Please try again.");
    }
  };

  const submitBatchRequest = async () => {
    if (!token) {
      setToken(session?.user?.token);
      return;
    }

    if (!sessionType) {
      showWarning("Please select a session type before submitting.");
      return;
    }

    if (!selectedDaysOfWeek) {
      showWarning("Please select a day of the week.");
      return;
    }

    // Check if the start date matches the selected day of the week
    const selectedDayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(selectedDaysOfWeek);
    if (startDate.day() !== selectedDayIndex) {
      showWarning(`The start date must match the selected day (${selectedDaysOfWeek}).`);
      return;
    }

    try {
      const batchData = {
        staff_id: session.user.staff_id, // Send the staff_id from session data
        session_type: sessionType,
        description: desc || null, // Optional description
        num_occurrences: numOccurrences,
        repeat_type: repeatType,
        start_date: startDate.format("YYYY-MM-DD"),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/batch/`,
        batchData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { message, new_requests, cancelled_requests } = response.data;
      let successMessage = message;

      if (new_requests.length > 0) {
        successMessage += `\nNew Requests Created: ${new_requests.map((req) => dayjs(req.start_date).format("DD MMM YYYY")).join(", ")}`;
      }
      if (cancelled_requests.length > 0) {
        successMessage += `\nCancelled Requests: ${cancelled_requests.map((req) => dayjs(req.start_date).format("DD MMM YYYY")).join(", ")}`;
      }

      showSuccess(successMessage);
      
      // Reset form
      setApplyMode("");
      setSessionType("");
      setDesc("");
      setSelectedDaysOfWeek("");
      setNumOccurrences(1);
      setRepeatType("weekly");
      setStartDate(calculateTwoWorkingDays());
    } catch (error) {
      console.error("Error applying batch request:", error);
      showError(
        "There was an error processing your batch request. Please try again."
      );
    }
  };

  return (
    <Container>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
        {/* Dropdown to switch between Ad-hoc and Batch Apply */}
        <FormControl fullWidth>
          <InputLabel id="apply-mode-select-label">Apply Mode</InputLabel>
          <Select
            labelId="apply-mode-select-label"
            id="apply-mode-select"
            label="Apply Mode"
            value={applyMode}
            onChange={(e) => setApplyMode(e.target.value)}
          >
            <MenuItem value="ad-hoc">Ad-hoc</MenuItem>
            <MenuItem value="batch">Batch Apply</MenuItem>
          </Select>
        </FormControl>

        {/* Session Type Selection */}
        <FormControl fullWidth>
          <InputLabel id="session-type-label">Session Type</InputLabel>
          <Select
            labelId="session-type-label"
            id="session-type-select"
            label="Session Type"
            value={sessionType}
            onChange={handleSessionType}
          >
            <MenuItem value={"Work from home"}>Work from Home</MenuItem>
            <MenuItem value={"Off day"}>Off Day</MenuItem>
            <MenuItem value={"Vacation"}>Vacation</MenuItem>
            {session?.user?.role === 1 && (
              <MenuItem value={"Official holiday"}>Official Holiday</MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Ad-hoc Apply Form */}
        {applyMode === "ad-hoc" && (
          <>
            <TextField
              label="Date"
              type="date"
              value={selectedDate.format("YYYY-MM-DD")}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              id="description"
              label="Description (Optional)"
              variant="outlined"
              onChange={handleDescChange}
              fullWidth
            />
          </>
        )}

        {/* Batch Apply Form */}
        {applyMode === "batch" && (
          <>
            <TextField
              label="Batch Start Date"
              type="date"
              value={startDate.format("YYYY-MM-DD")}
              onChange={handleStartDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography>Choose Day of the Week:</Typography>
              <FormGroup>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                  (day) => (
                    <FormControlLabel
                      control={
                        <Radio
                          checked={selectedDaysOfWeek === day}
                          onChange={() => setSelectedDaysOfWeek(day)}
                        />
                      }
                      label={day}
                      key={day}
                    />
                  )
                )}
              </FormGroup>
            </Box>

            <TextField
              label="Number of Occurrences"
              type="number"
              value={numOccurrences}
              onChange={handleNumOccurrencesChange}
              inputProps={{ min: 1, max: 12 }}
              fullWidth
            />

            {/* Repeat Options */}
            <FormControl fullWidth>
              <InputLabel id="repeat-type-label">Repeat Type</InputLabel>
              <Select
                labelId="repeat-type-label"
                id="repeat-type-select"
                label="Repeat Type"
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value)}
              >
                <MenuItem value="weekly">Repeat Weekly</MenuItem>
                <MenuItem value="bi-weekly">Repeat Bi-weekly</MenuItem>
              </Select>
            </FormControl>

            {/* Description (Optional) */}
            <TextField
              id="description"
              label="Description (Optional)"
              variant="outlined"
              onChange={handleDescChange}
              fullWidth
            />
          </>
        )}

        {/* Submit Button */}
        <Button
          variant="contained"
          size="large"
          onClick={
            applyMode === "ad-hoc" ? submitAdhocRequest : submitBatchRequest
          }
          disabled={!applyMode || !sessionType}
          fullWidth
        >
          Submit Request
        </Button>
      </Box>
    </Container>
  );
};

export default ApplyArrangementPage;
