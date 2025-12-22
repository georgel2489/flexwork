"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  Container,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";
import { useMediaQuery } from "@mui/material";

const SchedulePage = () => {
  const { data: session } = useSession();
  const [token, setToken] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departmentName, setDepartmentName] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
      setDepartmentName(session.user.dept);
    } else {
      window.location.reload();
    }
  }, [session]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!token) {
        setToken(session?.user?.token);
        return;
      }
      setLoading(true);
      try {
        const formattedDate = selectedDate.format("YYYY-MM-DD");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/schedules/manager/?start_date=${formattedDate}&end_date=${formattedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSchedules(response.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [selectedDate, departmentName, token]);

  const roles = schedules
    ? Object.keys(
        schedules[selectedDate.format("YYYY-MM-DD")]?.[departmentName] || {}
      )
    : [];

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(dayjs(event.target.value));
    setSelectedRole("");
  };

  const renderMobileCards = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const departmentSchedules = schedules?.[dateKey]?.[departmentName];

    if (!departmentSchedules) {
      return (
        <Typography>
          No schedules available for this date and department.
        </Typography>
      );
    }

    const filteredSchedules = selectedRole
      ? { [selectedRole]: departmentSchedules[selectedRole] }
      : departmentSchedules;

    if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      return (
        <Typography>
          No schedules available for this date, department, and role.
        </Typography>
      );
    }

    return (
      <>
        {Object.keys(filteredSchedules).map((role) => {
          const roleSchedule = filteredSchedules[role];
          return (
            <Card key={role} style={{ marginBottom: "15px" }}>
              <CardContent>
                <Typography variant="h6">{role}</Typography>
                {roleSchedule["In office"] &&
                  roleSchedule["In office"].length > 0 && (
                    <div>
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        In office:
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["In office"].join(", ")}
                      </Typography>
                    </div>
                  )}

                {roleSchedule["Work home"] &&
                  roleSchedule["Work home"].length > 0 && (
                    <div>
                      <br />
                      <Typography
                        variant="h7"
                        style={{ textDecoration: "underline" }}
                      >
                        Work home:
                        <br />
                      </Typography>
                      <Typography variant="body2">
                        {roleSchedule["Work home"].join(", ")}
                      </Typography>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </>
    );
  };

  const renderTable = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const departmentSchedules = schedules?.[dateKey]?.[departmentName];

    if (!departmentSchedules) {
      return (
        <Typography>
          No schedules available for this date and department.
        </Typography>
      );
    }

    const filteredSchedules = selectedRole
      ? { [selectedRole]: departmentSchedules[selectedRole] }
      : departmentSchedules;

    if (!filteredSchedules || Object.keys(filteredSchedules).length === 0) {
      return (
        <Typography>
          No schedules available for this date, department, and role.
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "16.66%", fontWeight: "bold" }}>
                Role
              </TableCell>
              <TableCell sx={{ width: "41.67%", fontWeight: "bold" }}>
                In Office
              </TableCell>
              <TableCell sx={{ width: "41.67%", fontWeight: "bold" }}>
                Work home
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(filteredSchedules).map((role) => {
              const roleSchedule = filteredSchedules[role];

              const renderWFHCell = () => {
                const wfhRegular = roleSchedule["Work home"] || [];
                return (
                  <Typography variant="subtitle2">
                    {wfhRegular.join(", ")}
                  </Typography>
                );
              };

              return (
                <TableRow key={role}>
                  <TableCell sx={{ width: "16.66%" }}>{role}</TableCell>
                  <TableCell sx={{ width: "41.67%" }}>
                    {(roleSchedule["In office"] || []).join(", ")}
                  </TableCell>
                  <TableCell sx={{ width: "41.67%" }}>
                    {renderWFHCell()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container>
      <TextField
        type="date"
        value={selectedDate.format("YYYY-MM-DD")}
        onChange={handleDateChange}
        style={{ marginBottom: "20px" }}
      />

      <FormControl fullWidth style={{ marginBottom: "20px" }}>
        <InputLabel id="role-select-label">Select Role</InputLabel>
        <Select
          labelId="role-select-label"
          value={selectedRole}
          onChange={handleRoleChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {roles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <CircularProgress />
      ) : isMobile ? (
        renderMobileCards()
      ) : (
        renderTable()
      )}
    </Container>
  );
};

export default SchedulePage;
