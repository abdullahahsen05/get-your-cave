import { AccountStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import AdminUsersWorkspace, {
  type AdminUserRow,
} from "@/components/admin/AdminUsersWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";
import { getAdminUsers } from "@/lib/admin";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeUserRole(value: string | string[] | undefined): UserRole | undefined {
  const first = firstValue(value);
  return first === "OWNER" || first === "RENTER" || first === "ADMIN"
    ? first
    : undefined;
}

function normalizeAccountStatus(
  value: string | string[] | undefined,
): AccountStatus | undefined {
  const first = firstValue(value);
  return first === "ACTIVE" || first === "SUSPENDED" || first === "PENDING_VERIFICATION"
    ? first
    : undefined;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/users");
  }

  if (currentUser.role !== "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  const users = await getAdminUsers({
    page: Number.parseInt(firstValue(searchParams?.page), 10) || 1,
    limit: 25,
    role: normalizeUserRole(searchParams?.role),
    status: normalizeAccountStatus(searchParams?.status),
    search: firstValue(searchParams?.search) || undefined,
  });

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-on-surface sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
        <header className="rounded-[28px] border border-outline-variant/60 bg-surface px-5 py-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
            {t("adminUsers.title")}
          </p>
          <h1 className="mt-3 text-h1 font-h1 leading-[0.95] text-primary">
            {t("adminUsers.subtitle")}
          </h1>
          <p className="mt-3 max-w-3xl text-body-md text-on-surface-variant">
            {t("adminUsers.description")}
          </p>
        </header>

        <section className="rounded-[28px] border border-outline-variant/60 bg-surface p-4 shadow-[0_16px_50px_rgba(17,24,39,0.05)] sm:p-6">
          <form className="grid gap-4 lg:grid-cols-12 lg:items-end" method="get">
            <div className="lg:col-span-5">
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                {t("common.search")}
              </label>
              <input
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
                defaultValue={firstValue(searchParams?.search)}
                name="search"
                placeholder={t("adminUsers.searchPlaceholder")}
                type="search"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                {t("adminUsers.role")}
              </label>
              <select
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
                defaultValue={firstValue(searchParams?.role)}
                name="role"
              >
                <option value="">{t("adminUsers.allRoles")}</option>
                <option value="OWNER">{t("common.owner")}</option>
                <option value="RENTER">{t("common.renter")}</option>
                <option value="ADMIN">{t("common.admin")}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                {t("common.status")}
              </label>
              <select
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
                defaultValue={firstValue(searchParams?.status)}
                name="status"
              >
                <option value="">{t("common.allStatuses")}</option>
                <option value="ACTIVE">{t("status.account.ACTIVE")}</option>
                <option value="PENDING_VERIFICATION">{t("status.account.PENDING_VERIFICATION")}</option>
                <option value="SUSPENDED">{t("status.account.SUSPENDED")}</option>
              </select>
            </div>

            <div className="flex gap-3 lg:col-span-2">
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f]"
                type="submit"
              >
                {t("common.apply")}
              </button>
            </div>
          </form>
        </section>

        <AdminUsersWorkspace users={users.rows as unknown as AdminUserRow[]} />
      </div>
    </main>
  );
}
