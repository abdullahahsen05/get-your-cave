import { redirect } from "next/navigation";

import { getCurrentUser, getDashboardPath } from "@/lib/auth";

/**
 * Server-side auth guard for /create-listing.
 *
 * 1. No session  → /login
 * 2. Non-owner   → correct dashboard
 * 3. Any owner   → render children immediately (no verification gate)
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

  return <>{children}</>;
}
