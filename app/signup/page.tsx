"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import {
  getDashboardPath,
  normalizeInternalPath,
} from "@/lib/auth-routing";
import type { SignupInput } from "@/lib/validations/auth";
import { authRoles, signupSchema } from "@/lib/validations/auth";

type FormState = SignupInput & {
  confirmPassword: string;
};

type SignupStep = {
  labelKey: string;
  icon: string;
};

const steps: SignupStep[] = [
  { labelKey: "auth.signupStepAccount", icon: "info" },
  { labelKey: "auth.signupStepProfile", icon: "person" },
  { labelKey: "auth.signupStepVerify", icon: "description" },
  { labelKey: "auth.signupStepFinish", icon: "check_circle" },
];

const initialState: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "RENTER",
};

export default function SignUpPage() {
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
  const [formState, setFormState] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLastStep = step === steps.length - 1;

  function validateStep(currentStepIndex: number) {
    if (currentStepIndex === 0) {
      const parsed = signupSchema.pick({ fullName: true, email: true }).safeParse({
        fullName: formState.fullName,
        email: formState.email,
      });

      if (!parsed.success) {
        return (
          parsed.error.issues[0]?.message ?? t("auth.formError")
        );
      }

      return null;
    }

    if (currentStepIndex === 1) {
      if (formState.password.length < 8) {
        return t("auth.passwordTooShort");
      }

      if (formState.password !== formState.confirmPassword) {
        return t("auth.passwordMismatch");
      }

      return null;
    }

    if (currentStepIndex === 2) {
      const parsed = signupSchema.pick({ role: true }).safeParse({
        role: formState.role,
      });

      if (!parsed.success) {
        return (
          parsed.error.issues[0]?.message ?? t("auth.chooseAccountType")
        );
      }

      return null;
    }

    const parsed = signupSchema.safeParse({
      fullName: formState.fullName,
      email: formState.email,
      password: formState.password,
      role: formState.role,
    });

    if (!parsed.success) {
      return parsed.error.issues[0]?.message ?? t("auth.formError");
    }

    if (formState.password !== formState.confirmPassword) {
      return t("auth.passwordMismatch");
    }

    return null;
  }

  function goBack() {
    setErrorMessage(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  function goToStep(nextStep: number) {
    if (nextStep > step) {
      return;
    }

    setErrorMessage(null);
    setStep(nextStep);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const stepError = validateStep(step);
    if (stepError) {
      setErrorMessage(stepError);
      return;
    }

    if (!isLastStep) {
      setStep((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    const parsed = signupSchema.safeParse({
      fullName: formState.fullName,
      email: formState.email,
      password: formState.password,
      role: formState.role,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Please check the form fields.");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: formState.fullName,
          email: formState.email,
          password: formState.password,
          role: formState.role,
        }),
      });

      const data = (await response.json()) as {
        user?: { role?: "ADMIN" | "OWNER" | "RENTER"; status?: string };
        error?: string;
      };

      const user = data.user;

      if (!response.ok || !user?.role) {
        setErrorMessage(t("auth.signupError"));
        return;
      }

      const destination =
        user.role === "OWNER" || user.role === "RENTER"
          ? `/document${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
          : nextPath ?? getDashboardPath(user.role) ?? "/renter/dashboard";

      router.replace(destination);
      router.refresh();
    } catch {
      setErrorMessage(t("auth.signupError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-on-surface antialiased flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 px-4 sm:px-6">
      <div className="w-full max-w-[1180px] bg-surface rounded-[22px] sm:rounded-[28px] shadow-[0_24px_80px_rgba(17,24,39,0.08)] overflow-hidden border border-outline-variant/60">
        <section className="w-full bg-[#1d2330] border-b border-white/10 px-5 sm:px-8 lg:px-10 pt-5 sm:pt-6 pb-4">
          <div className="flex flex-col gap-4 mb-4 px-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="font-label-caps text-label-caps text-white uppercase tracking-[0.16em]">
                {t("auth.stepIndicator", {
                  current: step + 1,
                  total: steps.length,
                  label: t(currentStep.labelKey),
                })}
              </span>
              <span className="font-label-caps text-label-caps text-secondary tracking-[0.14em]">
                {t("auth.percentComplete", { value: Math.round(progress) })}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {steps.map((item, index) => {
                const isActive = index === step;
                const isComplete = index < step;

                return (
                  <button
                    className="flex min-h-[50px] flex-col sm:flex-row items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2 sm:px-3 py-2 text-center transition-all hover:border-white/20 hover:bg-white/12 disabled:cursor-default disabled:hover:bg-white/8"
                    disabled={index > step || isSubmitting}
                    key={item.labelKey}
                    onClick={() => goToStep(index)}
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isActive || isComplete
                          ? "text-secondary"
                          : "text-white/55"
                      }`}
                    >
                      {isComplete ? "check_circle" : item.icon}
                    </span>
                    <span
                      className={`hidden sm:inline font-label-caps text-[10px] uppercase ${
                        isActive || isComplete
                          ? "text-white"
                          : "text-white/55"
                      }`}
                    >
                      {t(item.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <div className="flex flex-col lg:flex-row min-h-[620px]">
          <aside className="w-full lg:w-[41%] bg-[#1d2330] relative p-6 sm:p-8 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="absolute inset-0 opacity-14 grayscale pointer-events-none">
              <img
                alt={t("app.signup.page.alt.a.clean.professionally.organized.high.end.83eb8cd8")}
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABaZjB_-aytvUuKveqUINV1YI1WXjyMSJ3dYyiCqOq_D4utxkOrqErgjJmQKWQXrc4IIDv-6PR_mAEE-uZgPAQyHaFlzBj3Aoclm38lS9n9RboAo3gEU6cdOwMw9uUM966NJbfem2kElH7gebXA9hq5WM940SYJ-ewFe1YDSSTzMkbT_cfYWDtTTUy6sfzAyur0zhmOY8nrhc_qtFpHM6WndltIV-bL4_zl5aB9vlEk81-EQLJ2vRh10uqB2QnZ1AZgcZ4E_wnL7U"
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,106,27,0.24),transparent_42%),linear-gradient(180deg,rgba(29,35,48,0.04),rgba(29,35,48,0.32))] pointer-events-none" />

            <div className="relative z-10">
              <h1 className="font-h2 text-h2 text-white mb-8 sm:mb-10 lg:mb-12 max-w-[360px] leading-tight">
                {t("auth.earnFromUnusedSpace")}
              </h1>

              <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                <div className="flex items-start gap-4 rounded-2xl bg-white/8 p-4 border border-white/10 backdrop-blur-sm">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#fdeee4] flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-secondary">
                      verified
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-body-md">
                      {t("auth.verifiedOwnersTitle")}
                    </p>
                    <p className="text-white/72 text-body-sm leading-relaxed">
                      {t("auth.verifiedOwnersDescription")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-white/8 p-4 border border-white/10 backdrop-blur-sm">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#fdeee4] flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-secondary">
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-body-md">
                      {t("auth.securePaymentsTitle")}
                    </p>
                    <p className="text-white/72 text-body-sm leading-relaxed">
                      {t("auth.securePaymentsDescription")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-white/8 p-4 border border-white/10 backdrop-blur-sm">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#fdeee4] flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-secondary">
                      description
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-body-md">
                      {t("auth.easyContractsTitle")}
                    </p>
                    <p className="text-white/72 text-body-sm leading-relaxed">
                      {t("auth.easyContractsDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <p className="text-xs text-white/72 italic leading-relaxed max-w-[360px]">
                {t("auth.joinHosts")}
              </p>
            </div>
          </aside>

          <section className="w-full lg:w-[59%] p-6 sm:p-8 lg:p-12 flex flex-col justify-between bg-surface">
            <div className="max-w-[500px] mx-auto w-full">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <section>
                  <div className="mb-8 sm:mb-10">
                    <h3 className="font-h1 text-h1 text-primary mb-3 leading-tight">
                      {t("auth.joinTitle")}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-[440px]">
                      {step === 0 && t("auth.joinDescriptionAccount")}
                      {step === 1 && t("auth.joinDescriptionPassword")}
                      {step === 2 && t("auth.joinDescriptionRole")}
                      {step === 3 && t("auth.joinDescriptionReview")}
                    </p>
                  </div>

                  <div className="space-y-5 sm:space-y-6">
                    {step === 0 && (
                      <>
                        <div className="space-y-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                            htmlFor="full-name"
                          >
                            {t("auth.fullNameLabel")}
                          </label>
                          <input
                            autoComplete="name"
                            className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                            id="full-name"
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                fullName: event.target.value,
                              }))
                            }
                            placeholder={t("auth.fullNamePlaceholder")}
                            type="text"
                            value={formState.fullName}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                            htmlFor="email"
                          >
                            {t("auth.emailAddressLabel")}
                          </label>
                          <input
                            autoComplete="email"
                            className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                            id="email"
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                            placeholder={t("auth.emailPlaceholder")}
                            type="email"
                            value={formState.email}
                          />
                        </div>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <div className="space-y-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                            htmlFor="password"
                          >
                            {t("auth.passwordLabel")}
                          </label>
                          <input
                            autoComplete="new-password"
                            className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                            id="password"
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            placeholder={t("auth.passwordPlaceholder")}
                            type="password"
                            value={formState.password}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                            htmlFor="confirm-password"
                          >
                            {t("auth.confirmPasswordLabel")}
                          </label>
                          <input
                            autoComplete="new-password"
                            className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                            id="confirm-password"
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                confirmPassword: event.target.value,
                              }))
                            }
                            placeholder={t("auth.passwordPlaceholder")}
                            type="password"
                            value={formState.confirmPassword}
                          />
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="space-y-2">
                          <label
                            className="font-label-caps text-label-caps text-on-surface-variant ml-1"
                            htmlFor="role"
                          >
                            {t("auth.accountTypeLabel")}
                          </label>
                          <select
                            className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-secondary/10 focus:border-secondary transition-all outline-none"
                            id="role"
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                role: event.target.value as FormState["role"],
                              }))
                            }
                            value={formState.role}
                          >
                            {authRoles
                              .filter((role) => role !== "ADMIN")
                              .map((role) => (
                                <option key={role} value={role}>
                                  {role === "OWNER" ? t("auth.owner") : t("auth.renter")}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="rounded-2xl border border-[#EBEBE8] bg-surface-container-lowest px-5 py-4 shadow-[0_4px_20px_rgba(15,61,62,0.03)]">
                          <p className="font-label-caps text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">
                            {t("auth.whyThisMatters")}
                          </p>
                          <p className="text-body-sm text-on-surface-variant">
                            {t("auth.whyThisMattersDescription")}
                          </p>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest px-5 py-5 space-y-4 shadow-[0_4px_20px_rgba(17,24,39,0.04)]">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-label-caps text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                              {t("auth.review")}
                            </span>
                            <span className="text-xs text-secondary font-semibold">
                              {t("auth.everythingLooksReady")}
                            </span>
                          </div>

                          <div className="space-y-3 text-body-sm text-on-surface-variant">
                            <div className="flex items-start justify-between gap-4 rounded-xl bg-white/60 px-4 py-3">
                              <span className="text-on-surface-variant">
                                {t("auth.fullNameLabel")}
                              </span>
                              <span className="font-semibold text-primary text-right break-all">
                                {formState.fullName || t("auth.notAddedYet")}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 rounded-xl bg-white/60 px-4 py-3">
                              <span className="text-on-surface-variant">
                                {t("auth.emailAddressLabel")}
                              </span>
                              <span className="font-semibold text-primary text-right break-all">
                                {formState.email || t("auth.notAddedYet")}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 rounded-xl bg-white/60 px-4 py-3">
                              <span className="text-on-surface-variant">
                                {t("auth.accountTypeLabel")}
                              </span>
                              <span className="font-semibold text-primary text-right break-all">
                                {formState.role === "OWNER" ? t("auth.owner") : t("auth.renter")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          className="w-full bg-surface-container-low border border-outline-variant/70 text-primary py-4 rounded-full font-bold text-body-md flex items-center justify-center gap-3 hover:bg-secondary-container active:scale-[0.98] transition-all shadow-sm"
                          type="button"
                        >
                          <img
                            alt={t("app.signup.page.alt.google.logo.2b6f80a5")}
                            className="w-5 h-5"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdEhsntc5vjig4w7WeMCyVcxWJRhdfs8cA1tzBPR-yD02LbeRo4LNKwd5__u5oOd-dOufYAluR4AiON_W3fBKoWUYtByIF26S06tbeVzKLBvFRietmTamoueAsw57ysu57iUiZxNoRSn7UYCtGhWpubYdVs7xED1jDdXfPrPvt74enUUPjkDRDZfyXXinK1QzEKyZcipaYxb4nhRx1Nli7s-TO_ngZbQfxMluvyUoXaSVDZoHMU0ah7AzVYUxmIpkQsLdx8D07Z7Q"
                          />
                          {t("auth.continueWithGoogle")}
                        </button>
                      </>
                    )}

                    {errorMessage ? (
                      <div className="rounded-lg border border-[#f3c8ae] bg-[#fff3ea] px-4 py-3 text-sm text-[#8f3d12]">
                        {errorMessage}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className="pt-6 sm:pt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    className="w-full sm:w-auto justify-center px-8 py-3 rounded-full text-primary font-bold text-sm hover:bg-secondary-container transition-colors flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent"
                    disabled={step === 0 || isSubmitting}
                    onClick={goBack}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      arrow_back
                    </span>
                    {t("auth.back")}
                  </button>

                  <button
                    className="w-full sm:w-auto justify-center bg-secondary text-on-primary px-10 py-4 rounded-full font-bold text-body-md hover:bg-[#d9590f] active:scale-[0.98] transition-all shadow-[0_12px_28px_rgba(242,106,27,0.22)] flex items-center gap-2 disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting
                      ? t("auth.creating")
                      : isLastStep
                        ? t("auth.createAccount")
                        : t("auth.nextStep")}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-8 sm:mt-10 text-center">
                <p className="text-body-sm text-stone-500">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Link
                    className="text-secondary font-bold hover:underline decoration-[#F6AE5E] underline-offset-4"
                    href="/login"
                  >
                    {t("auth.logIn")}
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
