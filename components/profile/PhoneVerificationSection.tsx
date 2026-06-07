"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  currentPhone: string | null;
  phoneVerified: boolean;
  onVerified: (phone: string) => void;
};

type Step = "idle" | "sent" | "verified";

export default function PhoneVerificationSection({
  currentPhone,
  phoneVerified,
  onVerified,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(phoneVerified ? "verified" : "idle");
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentPhone, setSentPhone] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError(t("phoneVerification.errorPhoneRequired"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { sent?: boolean; phone?: string; error?: string };
      if (!res.ok || !data.sent) {
        setError(data.error ?? t("phoneVerification.errorSendFailed"));
        return;
      }
      setSentPhone(data.phone ?? phone);
      setStep("sent");
    } catch {
      setError(t("phoneVerification.errorSendFailed"));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      setError(t("phoneVerification.errorCodeRequired"));
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone: sentPhone ?? phone, code }),
      });
      const data = (await res.json()) as { verified?: boolean; phone?: string; error?: string };
      if (!res.ok || !data.verified) {
        setError(data.error ?? t("phoneVerification.errorVerifyFailed"));
        return;
      }
      setStep("verified");
      onVerified(data.phone ?? phone);
    } catch {
      setError(t("phoneVerification.errorVerifyFailed"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-outline-variant/60 bg-surface p-5 sm:p-6 space-y-4 shadow-[0_10px_32px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-h3 text-h3 text-primary">{t("phoneVerification.title")}</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {t("phoneVerification.subtitle")}
          </p>
        </div>
        {step === "verified" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4b6547]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4b6547]">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            {t("phoneVerification.verified")}
          </span>
        )}
      </div>

      {step === "verified" ? (
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#4b6547]">smartphone</span>
          <p className="text-body-sm text-on-surface font-medium">{currentPhone ?? phone}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {step === "idle" && (
            <div className="space-y-2">
              <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase">
                {t("phoneVerification.phoneLabel")}
              </label>
              <div className="flex gap-3">
                <input
                  className="flex-1 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                  placeholder={t("phoneVerification.phonePlaceholder")}
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null); }}
                />
                <button
                  className="rounded-full bg-secondary px-5 py-3 text-sm font-bold text-on-secondary hover:bg-[#d9590f] transition-colors disabled:opacity-50 whitespace-nowrap"
                  disabled={sending}
                  type="button"
                  onClick={() => void handleSendOtp()}
                >
                  {sending ? t("common.loading") : t("phoneVerification.sendCode")}
                </button>
              </div>
            </div>
          )}

          {step === "sent" && (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                {t("phoneVerification.codeSentTo", { phone: sentPhone ?? phone })}
              </p>
              <div className="space-y-2">
                <label className="block text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {t("phoneVerification.codeLabel")}
                </label>
                <div className="flex gap-3 flex-wrap">
                  <input
                    autoComplete="one-time-code"
                    className="w-40 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-body-md text-on-surface tracking-[0.3em] placeholder:text-on-surface-variant/50 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/10"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="000000"
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }}
                  />
                  <button
                    className="rounded-full bg-[#4b6547] px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    disabled={verifying}
                    type="button"
                    onClick={() => void handleVerify()}
                  >
                    {verifying ? t("common.loading") : t("phoneVerification.verify")}
                  </button>
                  <button
                    className="rounded-full border border-outline-variant/60 px-4 py-3 text-sm font-medium text-primary hover:bg-surface-container-low transition-colors"
                    type="button"
                    onClick={() => { setStep("idle"); setCode(""); setError(null); }}
                  >
                    {t("phoneVerification.changeNumber")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-error font-medium">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
