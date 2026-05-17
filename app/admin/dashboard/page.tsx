import { redirect } from "next/navigation";

import AdminDashboardWorkspace from "@/components/admin/AdminDashboardWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/dashboard");
  }

  if (currentUser.role !== "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  return <AdminDashboardWorkspace />;
}
