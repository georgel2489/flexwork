import * as React from "react";
import { AppProvider } from "@toolpad/core/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import LanguageIcon from "@mui/icons-material/Language";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LockResetIcon from "@mui/icons-material/LockReset";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import { auth } from "../auth";
import theme from "../theme";

const NAVIGATION = [
  {
    segment: "",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    kind: "header",
    title: "Schedules",
  },
  {
    segment: "schedule/own-schedule",
    title: "My Schedule",
    icon: <PersonIcon />,
  },
  {
    segment: "schedule/team-schedule",
    title: "Team's Schedule",
    icon: <GroupIcon />,
    roles: [3],
  },
  {
    segment: "schedule/organization-schedule",
    title: "Team's Schedule",
    icon: <LanguageIcon />,
    roles: [1],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Arrangement Requests",
  },
  {
    segment: "arrangement/my-requests",
    title: "My Requests",
    icon: <CalendarTodayIcon />,
  },
  {
    kind: "divider",
    roles: [1, 3],
  },
  {
    kind: "header",
    title: "Approve Requests",
    roles: [1, 3],
  },
  {
    segment: "arrangement/approve-arrangements",
    title: "Arrangements",
    icon: <AssignmentIcon />,
    roles: [1, 3],
  },
  {
    kind: "divider",
    roles: [1],
  },
  {
    kind: "header",
    title: "User Management",
    roles: [1],
  },
  {
    segment: "users",
    title: "Users",
    icon: <PeopleIcon />,
    roles: [1],
  },
  {
    segment: "holidays",
    title: "Official Holidays",
    icon: <EventIcon />,
    roles: [1],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Account Setting",
  },
  {
    segment: "account/change-password",
    title: "Reset Password",
    icon: <LockResetIcon />,
  },
];

const BRANDING = {
  title: "Corlab",
};

const AUTHENTICATION = {
  signIn,
  signOut,
};

export default async function RootLayout(props) {
  const session = await auth();
  const userRoles = session?.user?.roles;

  const accessibleNavigation = NAVIGATION.filter(
    (item) => !item.roles || item.roles.includes(userRoles)
  );

  return (
    <html lang="en" data-toolpad-color-scheme="light" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <AppProvider
              navigation={accessibleNavigation}
              branding={BRANDING}
              session={session}
              authentication={AUTHENTICATION}
              theme={theme}
            >
              {props.children}
            </AppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
