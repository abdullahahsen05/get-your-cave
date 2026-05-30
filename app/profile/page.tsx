import { redirect } from "next/navigation";

import ProfileSettingsWorkspace from "@/components/profile/ProfileSettingsWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/profile");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-on-surface antialiased">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <header className="rounded-[28px] border border-outline-variant/60 bg-surface px-5 py-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
            {t("profile.title")}
          </p>
          <h1 className="mt-3 text-h1 font-h1 leading-[0.95] text-primary">
            {currentUser.fullName}
          </h1>
          <p className="mt-3 max-w-3xl text-body-md font-body-md leading-7 text-on-surface-variant">
            {t("profile.subtitle")}
          </p>
        </header>

        <ProfileSettingsWorkspace user={currentUser} />
      </div>
    </main>
  );
}
