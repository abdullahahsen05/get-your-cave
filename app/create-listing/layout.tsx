import { redirect } from "next/navigation";

import { getCurrentUser, getDashboardPath } from "@/lib/auth";

/**
 * Server-side auth guard for /create-listing.
 *
 * 1. No session        → /login
 * 2. Non-owner         → correct dashboard
 * 3. Unverified owner  → /document  (shows verification status, "upload to proceed")
 * 4. Active owner      → render children (the form)
 */
export default async function CreateListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/create-listing");
  }

  if (currentUser.role !== "OWNER") {
    redirect(getDashboardPath(currentUser.role));
  }

  if (currentUser.status !== "ACTIVE") {
    redirect("/document");
  }

  return <>{children}</>;
}
