"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Topbar from "./Topbar";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { normalizeNavigationRole } from "./navigation";

const PUBLIC_AUTH_ROUTES = new Set(["/login", "/signup"]);

type AppChromeProps = {
  children: ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const { user } = useNotifications();
  const normalizedRole = normalizeNavigationRole(user?.role ?? null);
  const showPublicChrome = PUBLIC_AUTH_ROUTES.has(pathname) || !normalizedRole;

  if (showPublicChrome) {
    return (
      <>
        <PublicNavbar />
        {children}
        <Footer />
      </>
    );
  }

  return (
    <>
      <Topbar />
      {children}
    </>
  );
}
