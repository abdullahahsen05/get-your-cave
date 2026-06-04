"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const [tokenStatus, setTokenStatus] = useState<"pending" | "valid" | "invalid">(
    token ? "pending" : "valid",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let ignore = false;

    async function verifyToken() {
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const response = await fetch(
          `/api/auth/forgot-password/verify?token=${encodeURIComponent(token ?? "")}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = (await response.json().catch(() => null)) as
          | { valid?: boolean; expiresAt?: string; error?: string }
          | null;

        if (ignore) {
          return;
        }

        if (!response.ok || !data?.valid) {
          setTokenStatus("invalid");
          setErrorMessage(data?.error ?? t("auth.resetLinkInvalid"));
          return;
        }

        setTokenStatus("valid");
        setExpiresAt(data.expiresAt ?? null);
      } catch {
        if (!ignore) {
          setTokenStatus("invalid");
          setErrorMessage(t("auth.resetLinkInvalid"));
        }
      } finally {
        if (!ignore) {
          setIsSubmitting(false);
        }
      }
    }

    void verifyToken();

    return () => {
      ignore = true;
    };
  }, [t, token]);

  async function requestResetEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = forgotPasswordRequestSchema.safeParse({
      email: requestEmail,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t("auth.formError"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        ok?: boolean;
      } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? t("auth.resetLinkError"));
        return;
      }

      setStatusMessage(t("auth.resetLinkSent"));
    } catch {
      setErrorMessage(t("auth.resetLinkError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setErrorMessage(t("auth.resetLinkInvalid"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("auth.passwordMismatch"));
      return;
    }

    const parsed = forgotPasswordResetSchema.safeParse({
      token,
      password,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? t("auth.formError"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        ok?: boolean;
      } | null;

      if (!response.ok) {
        setErrorMessage(data?.error ?? t("auth.resetPasswordError"));
        return;
      }

      setStatusMessage(t("auth.resetPasswordSuccess"));
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      setErrorMessage(t("auth.resetPasswordError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToRequestMode() {
    setErrorMessage(null);
    setStatusMessage(null);
    setExpiresAt(null);
    setPassword("");
    setConfirmPassword("");
    router.replace("/forget_password_page");
  }

  const isRequestMode = !token;
  const isResetMode = Boolean(token) && tokenStatus === "valid";
  const isInvalidMode = Boolean(token) && tokenStatus === "invalid";

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-on-surface antialiased sm:px-6 sm:py-14 flex items-center justify-center">
      <div className="w-full max-w-[980px] overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_24px_80px_rgba(17,24,39,0.08)]">
        <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-[#1d2330] p-6 sm:p-8 lg:min-h-full lg:p-12 xl:p-14">
            <div className="absolute inset-0 opacity-[0.14] grayscale pointer-events-none">
              <img
                alt={t("auth.resetImageAlt")}
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=70"
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,106,27,0.24),transparent_42%),linear-gradient(180deg,rgba(29,35,48,0.08),rgba(29,35,48,0.32))] pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <span className="font-label-caps text-label-caps text-white uppercase tracking-[0.18em]">
                  GetYour<b className="text-secondary">Cave</b>
                </span>
              </div>

              <div className="max-w-[420px] space-y-3">
                <h1 className="font-h2 text-h2 leading-tight text-white">
                  {isRequestMode ? t("auth.resetRequestTitle") : t("auth.resetPasswordTitle")}
                </h1>
                <p className="font-body-md text-body-md leading-relaxed text-white/72">
                  {isRequestMode
                    ? t("auth.resetRequestDescription")
                    : isResetMode
                      ? t("auth.resetPasswordDescription")
                      : t("auth.resetLinkInvalid")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    title: t("auth.resetStepVerify"),
                    description: t("auth.resetStepVerifyDescription"),
                    icon: "mail",
                  },
                  {
                    title: t("auth.resetStepChoose"),
                    description: t("auth.resetStepChooseDescription"),
                    icon: "lock",
                  },
                  {
                    title: t("auth.resetStepReturn"),
                    description: t("auth.resetStepReturnDescription"),
                    icon: "login",
                  },
                ].map((item) => (
                  <div
                    className="group rounded-2xl border border-white/10 bg-white/8 p-4 shadow-[0_8px_26px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                    key={item.title}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdeee4] shadow-sm transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
                        <span className="material-symbols-outlined text-[22px] text-secondary">
                          {item.icon}
                        </span>
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-bold text-body-md leading-snug text-white">{item.title}</p>
                        <p className="mt-1 text-body-sm leading-relaxed text-white/72">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 hidden lg:block">
              <div className="mb-5 h-px w-full bg-white/10" />
              <p className="max-w-[360px] text-xs italic leading-relaxed text-white/72">
                {t("auth.resetSidebarFooter")}
              </p>
            </div>
          </aside>

          <section className="flex items-center bg-surface p-6 sm:p-8 lg:p-12 xl:p-16">
            <div className="mx-auto w-full max-w-[500px]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-secondary-container"
                  href="/login"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  {t("auth.backToLogin")}
                </Link>
                {token ? (
                  <span className="rounded-full border border-secondary/20 bg-secondary-container/20 px-3 py-1 text-xs font-semibold text-primary">
                    {t("auth.resetLinkVerified")}
                  </span>
                ) : null}
              </div>

              <form
                className="space-y-8 sm:space-y-10"
                onSubmit={isRequestMode ? requestResetEmail : resetPassword}
              >
                <section className="space-y-8">
                  <div className="space-y-3">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-[0.18em]">
                      {isRequestMode ? t("auth.resetRequestEyebrow") : t("auth.resetPasswordEyebrow")}
                    </span>
                    <div className="space-y-2">
                      <h2 className="font-h1 text-h1 leading-tight text-primary">
                        {isRequestMode ? t("auth.resetRequestTitle") : t("auth.resetPasswordTitle")}
                      </h2>
                      <p className="max-w-[430px] font-body-md text-body-md leading-relaxed text-on-surface-variant">
                        {isRequestMode
                          ? t("auth.resetRequestBody")
                          : t("auth.resetPasswordBody")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    {isRequestMode ? (
                      <div className="space-y-2.5">
                        <label
                          className="ml-1 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-surface-variant"
                          htmlFor="request-email"
                        >
                          {t("auth.email")}
                        </label>
                        <div className="group relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-primary/45 transition-colors group-focus-within:text-secondary">
                            mail
                          </span>
                          <input
                            autoComplete="email"
                            className="w-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest py-4 pl-12 pr-5 font-body-md text-body-md text-primary outline-none transition-all placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/10 sm:py-[18px]"
                            id="request-email"
                            onChange={(event) => setRequestEmail(event.target.value)}
                            placeholder={t("auth.emailPlaceholder")}
                            type="email"
                            value={requestEmail}
                          />
                        </div>
                      </div>
                    ) : isResetMode ? (
                      <>
                        <div className="rounded-2xl border border-secondary/20 bg-secondary-container/20 px-4 py-4 text-sm text-primary">
                          <p className="font-semibold text-primary">{t("auth.resetTokenTitle")}</p>
                          <p className="mt-1 text-on-surface-variant">{t("auth.resetTokenDescription")}</p>
                          {expiresAt ? (
                            <p className="mt-2 text-xs text-on-surface-variant">
                              {t("auth.codeExpiresAt", {
                                time: new Date(expiresAt).toLocaleTimeString(),
                              })}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2.5">
                          <label
                            className="ml-1 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-surface-variant"
                            htmlFor="new-password"
                          >
                            {t("auth.newPassword")}
                          </label>
                          <div className="group relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-primary/45 transition-colors group-focus-within:text-secondary">
                              lock
                            </span>
                            <input
                              autoComplete="new-password"
                              className="w-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest py-4 pl-12 pr-5 font-body-md text-body-md text-primary outline-none transition-all placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/10 sm:py-[18px]"
                              id="new-password"
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder={t("auth.passwordPlaceholder")}
                              type="password"
                              value={password}
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <label
                            className="ml-1 font-label-caps text-label-caps uppercase tracking-[0.14em] text-on-surface-variant"
                            htmlFor="confirm-new-password"
                          >
                            {t("auth.confirmNewPassword")}
                          </label>
                          <div className="group relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-primary/45 transition-colors group-focus-within:text-secondary">
                              verified_user
                            </span>
                            <input
                              autoComplete="new-password"
                              className="w-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest py-4 pl-12 pr-5 font-body-md text-body-md text-primary outline-none transition-all placeholder:text-stone-400 focus:border-secondary focus:ring-2 focus:ring-secondary/10 sm:py-[18px]"
                              id="confirm-new-password"
                              onChange={(event) => setConfirmPassword(event.target.value)}
                              placeholder={t("auth.passwordPlaceholder")}
                              type="password"
                              value={confirmPassword}
                            />
                          </div>
                        </div>
                      </>
                    ) : isInvalidMode ? (
                      <div className="rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-4 text-sm leading-relaxed text-[#8f3d12]">
                        <p className="font-semibold text-[#8f3d12]">{t("auth.resetLinkInvalid")}</p>
                        <p className="mt-1 text-[#8f3d12]/85">{t("auth.resetLinkError")}</p>
                      </div>
                    ) : null}

                    {errorMessage ? (
                      <div className="rounded-2xl border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3.5 text-sm leading-relaxed text-[#8f3d12]">
                        {errorMessage}
                      </div>
                    ) : null}

                    {statusMessage ? (
                      <div className="rounded-2xl border border-[#cce7d0] bg-[#edf9ef] px-4 py-3.5 text-sm leading-relaxed text-[#1f6d35]">
                        {statusMessage}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    {!isRequestMode ? (
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-secondary-container sm:w-auto sm:px-8"
                        type="button"
                        onClick={goToRequestMode}
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        {t("auth.requestNewLink")}
                      </button>
                    ) : null}
                    <Link
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-secondary-container sm:w-auto sm:px-8"
                      href="/login"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      {t("auth.backToLogin")}
                    </Link>
                  </div>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-8 py-4 font-bold text-body-md text-on-primary shadow-[0_12px_28px_rgba(242,106,27,0.22)] transition-all hover:bg-[#d9590f] active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:px-10"
                    disabled={isSubmitting || isInvalidMode}
                    type="submit"
                  >
                    {isSubmitting
                      ? isRequestMode
                        ? t("auth.sendingResetLink")
                        : t("auth.resettingPassword")
                      : isRequestMode
                        ? t("auth.sendResetLink")
                        : t("auth.resetPassword")}
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
