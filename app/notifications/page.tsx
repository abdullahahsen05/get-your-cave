import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { listNotificationsForUser } from "@/lib/notifications";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

function formatTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/notifications");
  }

  if (currentUser.role !== "OWNER" && currentUser.role !== "RENTER") {
    redirect("/");
  }

  const { notifications, unreadCount } = await listNotificationsForUser(currentUser.id, {
    limit: 100,
  });

  return (
    <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-on-surface sm:px-6 sm:pb-24 sm:pt-32 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <header className="rounded-[28px] border border-outline-variant/60 bg-surface px-5 py-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
            {t("notifications.title")}
          </p>
          <h1 className="mt-3 text-h1 font-h1 leading-[0.95] text-primary">
            {t("notifications.subtitle")}
          </h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            {t("notifications.unreadCount", { count: unreadCount })}
          </p>
        </header>

        <section className="grid gap-4">
          {notifications.length ? (
            notifications.map((notification) => {
              const unread = !notification.readAt;

              return (
                <article
                  className={`rounded-[24px] border p-5 shadow-[0_8px_28px_rgba(17,24,39,0.05)] ${
                    unread
                      ? "border-secondary/30 bg-secondary-container/10"
                      : "border-outline-variant/60 bg-surface"
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-h3 text-h3 text-primary">{notification.title}</h2>
                      {notification.body ? (
                        <p className="mt-2 max-w-3xl text-body-sm text-on-surface-variant">
                          {notification.body}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
                      {formatTime(notification.createdAt, locale)}
                    </span>
                  </div>

                  {notification.linkUrl ? (
                    <Link
                      className="mt-4 inline-flex rounded-full border border-outline-variant/60 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low"
                      href={notification.linkUrl}
                    >
                      {t("common.open")}
                    </Link>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-8 text-on-surface-variant">
              {t("notifications.emptyDescription")}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
