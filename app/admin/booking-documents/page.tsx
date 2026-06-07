import { redirect } from "next/navigation";

import AdminBookingDocumentsWorkspace from "@/components/admin/AdminBookingDocumentsWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { listPendingTempDocsForAdmin } from "@/lib/temporary-documents";

export const dynamic = "force-dynamic";

export default async function AdminBookingDocumentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/booking-documents");
  }

  if (currentUser.role !== "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  const data = await listPendingTempDocsForAdmin({ page: 1, limit: 50 });

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
        <AdminBookingDocumentsWorkspace
          initialDocs={data.documents}
          total={data.total}
        />
      </div>
    </main>
  );
}
