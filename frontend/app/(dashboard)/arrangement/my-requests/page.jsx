"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  Divider,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const RequestGroupsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [sortBy, setSortBy] = useState("request_created_date");
  const [filterByStatus, setFilterByStatus] = useState("all");
  const [requestGroups, setRequestGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [withdrawComment, setWithdrawComment] = useState("");

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return { bg: '#4caf50', text: '#fff' };
    if (statusLower === 'pending') return { bg: '#ff9800', text: '#fff' };
    if (statusLower === 'rejected') return { bg: '#f44336', text: '#fff' };
    if (statusLower === 'withdrawn') return { bg: '#9e9e9e', text: '#fff' };
    if (statusLower === 'revoked') return { bg: '#ff5722', text: '#fff' };
    return { bg: '#757575', text: '#fff' };
  };

  useEffect(() => {
    if (session?.user) {
      setToken(session.user.token);
    }
  }, [session]);

  const fetchData = async (pageNum = 1, append = false) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/arrangements/staff/?page=${pageNum}&limit=10&status=${filterByStatus}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (append) {
        setRequestGroups(prev => [...prev, ...(data.request_groups || [])]);
      } else {
        setRequestGroups(data.request_groups || []);
      }

      setTotalCount(data.pagination?.total || 0);
      setHasMore(pageNum < (data.pagination?.totalPages || 0));
      setError(null);
    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setPage(1);
      setRequestGroups([]);
      fetchData(1, false);
    }
  }, [token, filterByStatus]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 100
      ) {
        if (hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page]);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterByStatus(event.target.value);
  };

  const openWithdrawDialog = (groupId) => {
    setSelectedGroupId(groupId);
    setOpenDialog(true);
  };

  const closeWithdrawDialog = () => {
    setOpenDialog(false);
    setSelectedGroupId(null);
  };

  const confirmWithdraw = async () => {
    if (!selectedGroupId) return;

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/arrangements/staff/withdraw/${selectedGroupId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: withdrawComment }),
      });

      if (!response.ok) throw new Error("Failed to withdraw the request");

      updateGroupStatus(selectedGroupId, "Withdrawn");
      closeWithdrawDialog();
    } catch (err) {
      setError(err.message);
      closeWithdrawDialog();
    }
  };

  const updateGroupStatus = (groupId, newStatus) => {
    setRequestGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.request_group_id === groupId
          ? {
            ...group,
            arrangement_requests: group.arrangement_requests.map((request) => ({
              ...request,
              request_status: newStatus,
            })),
          }
          : group
      )
    );
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Select value={sortBy} onChange={handleSortChange}>
            <MenuItem value="request_created_date">Sort by Creation Date</MenuItem>
            <MenuItem value="arrangement_requests.0.start_date">Sort by Request Date</MenuItem>
          </Select>
          <Select value={filterByStatus} onChange={handleFilterChange}>
            <MenuItem value="all">Show All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="history">History</MenuItem>
          </Select>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push("/arrangement/apply-arrangement")}
        >
          Apply for Arrangement
        </Button>
      </Box>

      <Stack spacing={3}>
        {requestGroups.map((group) => (
          <Card key={group.request_group_id} sx={{ display: "flex", flexDirection: "column", borderRadius: 2, boxShadow: 3, p: 2, width: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="flex-end" mb={1}>
                <Chip
                  label={group.arrangement_requests[0].request_status}
                  sx={{
                    backgroundColor: getStatusColor(group.arrangement_requests[0].request_status).bg,
                    color: getStatusColor(group.arrangement_requests[0].request_status).text,
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    px: 1,
                  }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">Created on: {format(new Date(group.request_created_date), "dd/MM/yyyy")}</Typography>
              <Typography variant="body2">Number of Requests: {group.arrangement_requests.length}</Typography>

              <Stack spacing={1} mt={2}>
                {group.arrangement_requests.slice(0, 1).map((request) => (
                  <Box key={request.arrangement_id}>
                    <Typography>Start Date: {format(new Date(request.start_date), "dd/MM/yyyy")}</Typography>
                    <Typography>Session Type: {request.session_type}</Typography>
                    <Typography>Description: {request.description || "No description provided"}</Typography>
                  </Box>
                ))}
              </Stack>

              {group.arrangement_requests[0].request_status === "Pending" && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => openWithdrawDialog(group.request_group_id)}
                  sx={{ mt: 2 }}
                >
                  Withdraw Request
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {loading && page > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Typography>Loading more...</Typography>
        </Box>
      )}

      {!hasMore && requestGroups.length > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Typography color="textSecondary">No more requests to load</Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={closeWithdrawDialog}>
        <DialogTitle>Withdraw Request</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to withdraw this request?</Typography>
          <TextField
            label="Optional Comment"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={withdrawComment}
            onChange={(e) => setWithdrawComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWithdrawDialog} color="primary">Cancel</Button>
          <Button onClick={confirmWithdraw} color="error" variant="contained">Withdraw</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestGroupsPage;
