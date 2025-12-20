"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Switch,
  TablePagination,
} from "@mui/material";
import { useSession } from "next-auth/react";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { useNotification } from "../../contexts/NotificationContext";

const UsersPage = () => {
  const { data: session } = useSession();
  const { showSuccess, showError } = useNotification();
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    staff_fname: "",
    staff_lname: "",
    email: "",
    dept: "Corlab",
    position: "",
    country: "Moldova",
    password: "",
    role_id: 2,
    is_active: true,
  });

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload();
    }
  }, [session]);

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users?page=${page + 1}&limit=${rowsPerPage}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, page, rowsPerPage]);

  const handleOpenDialog = () => {
    setFormData(prev => ({
      ...prev,
      dept: "Corlab",
      country: "Moldova"
    }));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      staff_fname: "",
      staff_lname: "",
      email: "",
      dept: "Corlab",
      position: "",
      country: "Moldova",
      password: "",
      role_id: 2,
      is_active: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/createuser`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            role_id: parseInt(formData.role_id),
            reporting_manager_id: session?.user?.id || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      await fetchUsers();
      handleCloseDialog();
      showSuccess("User created successfully!");
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.staff_id);
    const [fname, lname] = user.name.split(' ');
    setEditedData({
      staff_fname: fname || '',
      staff_lname: lname || '',
      position: user.position || '',
      is_active: user.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedData({});
  };

  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async (userId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      await fetchUsers();
      setEditingUserId(null);
      setEditedData({});
      showSuccess("User updated successfully!");
    } catch (err) {
      showError(`Error: ${err.message}`);
    }
  };

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Employee";
      case 3:
        return "Manager";
      default:
        return "Unknown";
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="end" alignItems="end" mb={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenDialog}
        >
          Invite User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Staff ID</strong></TableCell>
              <TableCell><strong>First Name</strong></TableCell>
              <TableCell><strong>Last Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Country</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const isEditing = editingUserId === user.staff_id;
              const [fname, lname] = user.name.split(' ');
              
              return (
                <TableRow key={user.staff_id}>
                  <TableCell>{user.staff_id}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editedData.staff_fname}
                        onChange={(e) => handleEditChange('staff_fname', e.target.value)}
                        fullWidth
                      />
                    ) : (
                      fname || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editedData.staff_lname}
                        onChange={(e) => handleEditChange('staff_lname', e.target.value)}
                        fullWidth
                      />
                    ) : (
                      lname || '-'
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.dept || "-"}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editedData.position}
                        onChange={(e) => handleEditChange('position', e.target.value)}
                        fullWidth
                      />
                    ) : (
                      user.position || "-"
                    )}
                  </TableCell>
                  <TableCell>{user.country || "-"}</TableCell>
                  <TableCell>{getRoleName(user.role_id)}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Switch
                        checked={editedData.is_active}
                        onChange={(e) => handleEditChange('is_active', e.target.checked)}
                        color="success"
                      />
                    ) : (
                      <Chip
                        label={user.is_active ? "Active" : "Inactive"}
                        color={user.is_active ? "success" : "default"}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSaveEdit(user.staff_id)}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={handleCancelEdit}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="First Name"
              name="staff_fname"
              value={formData.staff_fname}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="staff_lname"
              value={formData.staff_lname}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Department"
              name="dept"
              value={formData.dept}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value={1}>Admin</MenuItem>
                <MenuItem value={2}>Employee</MenuItem>
                <MenuItem value={3}>Manager</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreateUser} color="primary" variant="contained">
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
