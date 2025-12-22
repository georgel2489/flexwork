"use client";

import * as React from "react";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { NotificationProvider } from "../contexts/NotificationContext";
import { Box } from "@mui/material";

export default function Layout(props) {
  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <NotificationProvider>{props.children}</NotificationProvider>
      </Box>
    </DashboardLayout>
  );
}
