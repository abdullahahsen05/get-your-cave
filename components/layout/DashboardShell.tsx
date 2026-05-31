"use client";

import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  return <>{children}</>;
}
