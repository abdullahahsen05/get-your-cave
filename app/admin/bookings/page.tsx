import { redirect } from "next/navigation";

import AdminBookingsWorkspace from "@/components/admin/AdminBookingsWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/bookings");
  }

  if (currentUser.role !== "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
        <AdminBookingsWorkspace />
      </div>
    </main>
  );
}
