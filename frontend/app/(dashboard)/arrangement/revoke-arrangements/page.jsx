"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Select, MenuItem, Divider, Box, Stack, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { format } from 'date-fns';
import { useSession } from "next-auth/react";

const RevokeRequestsPage = () => {
  const [sortBy, setSortBy] = useState('request_created_date');
  const [requestGroups, setRequestGroups] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { data: session } = useSession();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    } else {
      window.location.reload()
    }
  }, [session]);


  const fetchApprovedRequests = async () => {
    if (!token) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/approved/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setRequestGroups(data.request_groups || []);
      setDataLoading(false);
    } catch (error) {
      console.error("Error fetching approved requests:", error);
      setError("Failed to load approved requests");
      setDataLoading(false);
    }
  };

  useEffect(() => {

    fetchApprovedRequests();
  }, [token]);


  const handleSort = (sortField) => {
    const sortedGroups = [...requestGroups].sort((a, b) => {
      const firstDate = new Date(a[sortField]);
      const secondDate = new Date(b[sortField]);
      return firstDate - secondDate;
    });
    setRequestGroups(sortedGroups);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    handleSort(event.target.value);
  };


  const handleRevoke = async () => {
    const { groupId, arrangementId, comment } = selectedRequest;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/arrangements/manager/revoke/${groupId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to revoke the request.');
      }


      setRequestGroups(prevGroups =>
        prevGroups.map(group =>
          group.request_group_id === groupId
            ? {
              ...group,
              arrangement_requests: group.arrangement_requests.filter(req => req.arrangement_id !== arrangementId),
            }
            : group
        )
      );

      setOpenSuccessDialog(true);
    } catch (error) {
      console.error("Error revoking request:", error);
      setError(error.message || "Failed to revoke the request.");
    } finally {
      setLoading(false);
      setOpenConfirmDialog(false);
    }
  };

  const handleCommentChange = (arrangementId, event) => {
    setComments({
      ...comments,
      [arrangementId]: event.target.value,
    });
  };

  const handleOpenConfirmDialog = (groupId, arrangementId) => {
    const comment = comments[arrangementId] || "";
    setSelectedRequest({ groupId, arrangementId, comment });
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
  };

  return (
    <Box p={2}>

      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Revoke Approved Requests</Typography>
        <Select value={sortBy} onChange={handleSortChange}>
          <MenuItem value="request_created_date">Sort by Creation Date</MenuItem>
          <MenuItem value="arrangement_requests.0.start_date">Sort by Request Date</MenuItem>
        </Select>
      </Box>


      {dataLoading ? (
        <Typography>Loading approved requests...</Typography>
      ) : (
        <>

          <Stack spacing={3}>
            {requestGroups.length > 0 ? (
              requestGroups.map((group) => (
                <Card
                  key={group.request_group_id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: 3,
                    p: 2,
                    width: '100%',
                  }}
                >

                  <CardContent>
                    <Typography variant="h6">
                      {group.staff.staff_fname} {group.staff.staff_lname}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">{group.staff.dept} - {group.staff.position}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Created on: {format(new Date(group.request_created_date), 'dd/MM/yyyy')}
                    </Typography>
                    <Typography variant="body2">Number of Approved Requests: {group.arrangement_requests.length}</Typography>


                    <Stack spacing={2} mt={2}>
                      {group.arrangement_requests.map((request) => (
                        <Box key={request.arrangement_id}>
                          <Typography>
                            Start Date: {format(new Date(request.start_date), 'dd/MM/yyyy')}
                          </Typography>
                          <Typography>
                            Session Type: {request.session_type || 'N/A'}
                          </Typography>
                          <Typography color="green">
                            Status: {request.request_status}
                          </Typography>
                          <TextField
                            label="Reason for Revoking"
                            multiline
                            rows={2}
                            variant="outlined"
                            fullWidth
                            value={comments[request.arrangement_id] || ''}
                            onChange={(event) => handleCommentChange(request.arrangement_id, event)}
                            sx={{ mt: 1 }}
                          />
                          <Divider sx={{ my: 2 }} />
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            onClick={() => handleOpenConfirmDialog(group.request_group_id, request.arrangement_id)}
                            disabled={loading}
                          >
                            {loading ? 'Revoking...' : 'Revoke'}
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography>No approved requests available.</Typography>
            )}
          </Stack>
        </>
      )}


      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirm Revocation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke this arrangement?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRevoke} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
      >
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The arrangement has been successfully revoked.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>


      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
    </Box>
  );
};

export default RevokeRequestsPage;
