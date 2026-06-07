import { redirect } from "next/navigation";

import AdminWithdrawalsWorkspace from "@/components/admin/AdminWithdrawalsWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { listWithdrawalsForAdmin } from "@/lib/withdrawals";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/withdrawals");
  }

  if (currentUser.role !== "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  const data = await listWithdrawalsForAdmin({ page: 1, limit: 100 });

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
        <AdminWithdrawalsWorkspace
          initialWithdrawals={data.withdrawals}
          total={data.total}
        />
      </div>
    </main>
  );
}
