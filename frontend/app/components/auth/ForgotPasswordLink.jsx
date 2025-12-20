"use client";

import * as React from "react";
import { Link } from "@mui/material";

function ForgotPasswordLink() {
  return (
    <Link href="/auth/forget-password" variant="body2">
      Forgot password?
    </Link>
  );
}

export default ForgotPasswordLink;
