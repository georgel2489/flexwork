"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";

export default function OfficialHolidaysPage() {
  const { data: session } = useSession();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState(null);
  const [formData, setFormData] = useState({
    holiday_date: null,
    holiday_name: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (session?.user?.token) {
      fetchHolidays();
    }
  }, [session]);

  const fetchHolidays = async () => {
    if (!session?.user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/holidays`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );
      setHolidays(response.data);
    } catch (error) {
      showSnackbar("Failed to fetch holidays", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setEditMode(true);
      setCurrentHoliday(holiday);
      setFormData({
        holiday_date: dayjs(holiday.holiday_date),
        holiday_name: holiday.holiday_name,
      });
    } else {
      setEditMode(false);
      setCurrentHoliday(null);
      setFormData({
        holiday_date: null,
        holiday_name: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentHoliday(null);
    setFormData({
      holiday_date: null,
      holiday_name: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.holiday_date || !formData.holiday_name) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    if (!session?.user?.token) {
      showSnackbar("Authentication required", "error");
      return;
    }

    try {
      const payload = {
        holiday_date: formData.holiday_date.format("YYYY-MM-DD"),
        holiday_name: formData.holiday_name,
      };

      if (editMode) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/holidays/${currentHoliday.holiday_id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.token}`,
            },
          }
        );
        showSnackbar("Holiday updated successfully", "success");
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/holidays`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.token}`,
            },
          }
        );
        showSnackbar("Holiday created successfully", "success");
      }

      handleCloseDialog();
      fetchHolidays();
    } catch (error) {
      showSnackbar(
        error.response?.data?.error || "Failed to save holiday",
        "error"
      );
    }
  };

  const handleDelete = async (holidayId) => {
    if (!confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    if (!session?.user?.token) {
      showSnackbar("Authentication required", "error");
      return;
    }

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/holidays/${holidayId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.token}`,
          },
        }
      );
      showSnackbar("Holiday deleted successfully", "success");
      fetchHolidays();
    } catch (error) {
      showSnackbar("Failed to delete holiday", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    {
      field: "holiday_date",
      headerName: "Date",
      width: 150,
      valueFormatter: (params) => dayjs(params.value).format("DD/MM/YYYY"),
    },
    {
      field: "holiday_name",
      headerName: "Holiday Name",
      width: 250,
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(params.row.holiday_id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Official Holidays
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Holiday
          </Button>
        </Box>

        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={holidays}
            columns={columns}
            getRowId={(row) => row.holiday_id}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        </Box>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editMode ? "Edit Holiday" : "Add New Holiday"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <DatePicker
                label="Holiday Date *"
                value={formData.holiday_date}
                onChange={(newValue) =>
                  setFormData({ ...formData, holiday_date: newValue })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
              <TextField
                label="Holiday Name"
                value={formData.holiday_name}
                onChange={(e) =>
                  setFormData({ ...formData, holiday_name: e.target.value })
                }
                required
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editMode ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
