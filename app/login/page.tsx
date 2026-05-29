"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  getDashboardPath,
  normalizeInternalPath,
} from "@/lib/auth-routing";
import { loginSchema } from "@/lib/validations/auth";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

const loginFeatures = [
  {
    icon: "verified",
    titleKey: "auth.secureAccess",
    descriptionKey: "auth.secureAccessDescription",
  },
  {
    icon: "route",
    titleKey: "auth.roleRouting",
    descriptionKey: "auth.roleRoutingDescription",
  },
  {
    icon: "lock",
    titleKey: "auth.protectedSession",
    descriptionKey: "auth.protectedSessionDescription",
  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [nextPath] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return normalizeInternalPath(
      new URLSearchParams(window.location.search).get("next"),
    );
  });
  const [formState, setFormState] = useState<LoginFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse(formState);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t("auth.formError"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = (await response.json()) as {
        user?: { role?: "ADMIN" | "OWNER" | "RENTER"; status?: string };
        error?: string;
      };

      const user = data.user;

      if (!response.ok || !user?.role) {
        setErrorMessage(t("auth.loginError"));
        return;
      }

      const destination =
        user.status !== "ACTIVE" && (user.role === "OWNER" || user.role === "RENTER")
          ? `/document${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
          : nextPath ?? getDashboardPath(user.role) ?? "/renter/dashboard";

      router.replace(destination);
      router.refresh();
    } catch {
      setErrorMessage(t("auth.loginError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    setErrorMessage(null);
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 px-4 sm:px-6">
      <div className="w-full max-w-[1160px] bg-surface rounded-[28px] sm:rounded-[32px] shadow-[0_24px_80px_rgba(17,24,39,0.08)] overflow-hidden border border-outline-variant/60">
        <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] min-h-[640px]">
          <aside className="relative bg-[#1d2330] overflow-hidden p-6 sm:p-8 lg:p-12 xl:p-14 flex flex-col justify-between gap-10 min-h-[360px] lg:min-h-full">
            <div className="absolute inset-0 opacity-[0.14] grayscale pointer-events-none">
              <img
                alt={t("app.login.page.alt.a.clean.professionally.organized.high.end.a735372d")}
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABaZjB_-aytvUuKveqUINV1YI1WXjyMSJ3dYyiCqOq_D4utxkOrqErgjJmQKWQXrc4IIDv-6PR_mAEE-uZgPAQyHaFlzBj3Aoclm38lS9n9RboAo3gEU6cdOwMw9uUM966NJbfem2kElH7gebXA9hq5WM940SYJ-ewFe1YDSSTzMkbT_cfYWDtTTUy6sfzAyur0zhmOY8nrhc_qtFpHM6WndltIV-bL4_zl5aB9vlEk81-EQLJ2vRh10uqB2QnZ1AZgcZ4E_wnL7U"
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,106,27,0.24),transparent_42%),linear-gradient(180deg,rgba(29,35,48,0.08),rgba(29,35,48,0.32))] pointer-events-none" />

            <div className="relative z-10 space-y-10 sm:space-y-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 shadow-sm backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span className="font-label-caps text-label-caps text-white uppercase tracking-[0.18em]">
                    GetYour<b className="text-secondary">Cave</b>
                  </span>
                </div>

                <div className="space-y-3 max-w-[420px]">
                  <h1 className="font-h2 text-h2 text-white leading-tight">
                    {t("auth.welcomeBack")}
                  </h1>
                  <p className="font-body-md text-body-md text-white/72 leading-relaxed">
                    {t("auth.loginHint")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-3 lg:gap-5">
                {loginFeatures.map((item) => (
                  <div
                    className="group rounded-2xl border border-white/10 bg-white/8 p-4 sm:p-5 shadow-[0_8px_26px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                    key={item.titleKey}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#fdeee4] flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-105">
                        <span className="material-symbols-outlined text-secondary text-[22px]">
                          {item.icon}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-bold text-white text-body-md leading-snug">
                          {t(item.titleKey)}
                        </p>
                        <p className="mt-1 text-white/72 text-body-sm leading-relaxed">
                          {t(item.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 hidden lg:block">
              <div className="h-px w-full bg-white/10 mb-5" />
              <p className="text-xs text-white/72 italic leading-relaxed max-w-[360px]">
                {t("auth.secureAccessDescription")}
              </p>
            </div>
          </aside>

          <section className="bg-surface p-6 sm:p-8 lg:p-12 xl:p-16 flex items-center">
            <div className="max-w-[500px] mx-auto w-full">
              <form className="space-y-8 sm:space-y-10" onSubmit={handleSubmit}>
                <section className="space-y-8">
                  <div className="space-y-3">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.18em]">
                      {t("auth.signInTitle")}
                    </span>
                    <div className="space-y-2">
                      <h2 className="font-h1 text-h1 text-primary leading-tight">
                        {t("auth.login")}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-[430px]">
                        {t("auth.loginDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-2.5">
                      <label
                        className="font-label-caps text-label-caps text-on-surface-variant ml-1 uppercase tracking-[0.14em]"
                        htmlFor="email"
                      >
                        {t("auth.email")}
                      </label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-primary/45 transition-colors group-focus-within:text-secondary">
                          mail
                        </span>
                        <input
                          autoComplete="email"
                          className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-2xl pl-12 pr-5 py-4 sm:py-[18px] font-body-md text-body-md text-primary placeholder:text-stone-400 focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                          id="email"
                          onChange={(event) => updateField("email", event.target.value)}
                          placeholder={t("auth.emailPlaceholder")}
                          type="email"
                          value={formState.email}
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label
                        className="font-label-caps text-label-caps text-on-surface-variant ml-1 uppercase tracking-[0.14em]"
                        htmlFor="password"
                      >
                        {t("auth.password")}
                      </label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-primary/45 transition-colors group-focus-within:text-secondary">
                          lock
                        </span>
                        <input
                          autoComplete="current-password"
                          className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-2xl pl-12 pr-5 py-4 sm:py-[18px] font-body-md text-body-md text-primary placeholder:text-stone-400 focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                          id="password"
                          onChange={(event) => updateField("password", event.target.value)}
                          placeholder={t("auth.passwordPlaceholder")}
                          type="password"
                          value={formState.password}
                        />
                      </div>
                    </div>

                    {errorMessage ? (
                      <div className="rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3.5 text-sm text-[#8f3d12] leading-relaxed">
                        {errorMessage}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <Link
                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-full text-primary font-bold text-sm hover:bg-secondary-container transition-colors flex items-center justify-center gap-2"
                    href="/signup"
                  >
                    <span className="material-symbols-outlined text-sm">
                      arrow_back
                    </span>
                    {t("auth.signUp")}
                  </Link>

                  <button
                    className="w-full sm:w-auto bg-secondary text-on-primary px-8 sm:px-10 py-4 rounded-full font-bold text-body-md hover:bg-[#d9590f] active:scale-[0.98] transition-all shadow-[0_12px_28px_rgba(242,106,27,0.22)] flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? t("auth.signingIn") : t("auth.login")}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
