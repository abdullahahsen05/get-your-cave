"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/components/ui/UserAvatar";
import type { SafeUser } from "@/lib/auth";

export default function ProfileSettingsWorkspace({ user }: { user: SafeUser }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.ownerProfile?.address ?? user.renterProfile?.address ?? "");
  const [city, setCity] = useState(user.ownerProfile?.city ?? user.renterProfile?.city ?? "");
  const [postalCode, setPostalCode] = useState(
    user.ownerProfile?.postalCode ?? user.renterProfile?.postalCode ?? "",
  );
  const [iban, setIban] = useState(user.ownerProfile?.iban ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotificationsEnabled);
  const [smsNotifications, setSmsNotifications] = useState(user.smsNotificationsEnabled);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled);

  useEffect(() => {
    setAvatarUrl(user.avatarUrl ?? "");
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setAddress(user.ownerProfile?.address ?? user.renterProfile?.address ?? "");
    setCity(user.ownerProfile?.city ?? user.renterProfile?.city ?? "");
    setPostalCode(user.ownerProfile?.postalCode ?? user.renterProfile?.postalCode ?? "");
    setIban(user.ownerProfile?.iban ?? "");
    setEmailNotifications(user.emailNotificationsEnabled);
    setSmsNotifications(user.smsNotificationsEnabled);
    setTwoFactorEnabled(user.twoFactorEnabled);
  }, [
    user.avatarUrl,
    user.email,
    user.emailNotificationsEnabled,
    user.fullName,
    user.ownerProfile?.address,
    user.ownerProfile?.city,
    user.ownerProfile?.iban,
    user.ownerProfile?.postalCode,
    user.phone,
    user.renterProfile?.address,
    user.renterProfile?.city,
    user.renterProfile?.postalCode,
    user.smsNotificationsEnabled,
    user.twoFactorEnabled,
  ]);

  async function handleAvatarUpload(file: File | null) {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { user?: { avatarUrl?: string | null }; error?: string }
        | null;

      if (!response.ok || !payload?.user?.avatarUrl) {
        throw new Error(payload?.error ?? t("profile.unableToUpdate"));
      }

      setAvatarUrl(payload.user.avatarUrl ?? "");
      setFormSuccess(t("profile.profileUpdated"));
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("profile.unableToUpdate"));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          city,
          postalCode,
          iban,
          emailNotificationsEnabled: emailNotifications,
          smsNotificationsEnabled: smsNotifications,
          twoFactorEnabled,
          currentPassword,
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { user?: SafeUser; error?: string }
        | null;

      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error ?? t("profile.unableToUpdate"));
      }

      setFormSuccess(t("profile.profileUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("profile.unableToUpdate"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form
        className="space-y-6 rounded-[28px] border border-outline-variant/60 bg-surface p-6 shadow-[0_16px_50px_rgba(17,24,39,0.05)] sm:p-8"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="flex items-start gap-4">
          <UserAvatar avatarUrl={avatarUrl || null} name={user.fullName} size="xl" />
          <div className="space-y-2">
            <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
              {t("profile.photo")}
            </p>
            <h2 className="font-h2 text-h2 text-primary">{user.fullName}</h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              {t("profile.photoHint")}
            </p>
            <label className="inline-flex cursor-pointer items-center rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container">
              {isUploading ? t("common.loading") : t("profile.uploadPhoto")}
              <input
                accept="image/*"
                className="hidden"
                type="file"
                onChange={(event) => {
                  void handleAvatarUpload(event.target.files?.[0] ?? null);
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.fullName")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.email")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.phone")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>

          {user.role === "OWNER" ? (
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
                {t("profile.iban")}
              </span>
              <input
                className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
                value={iban}
                onChange={(event) => setIban(event.target.value)}
              />
            </label>
          ) : (
            <div className="space-y-2 rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-low px-4 py-4 sm:col-span-2">
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
                {t("profile.iban")}
              </span>
              <p className="text-sm text-on-surface-variant">
                {t("profile.ibanOwnerOnly", {
                  defaultValue:
                    "IBAN is used for owner payouts only, so it is not shown for renter accounts.",
                })}
              </p>
            </div>
          )}

          <label className="space-y-2 sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.address")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.city")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.postalCode")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.currentPassword")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
              {t("profile.newPassword")}
            </span>
            <input
              className="w-full rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 outline-none focus:border-secondary"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
        </div>

        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#d9590f] disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? t("common.loading") : t("common.save")}
        </button>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
        {formSuccess ? <p className="text-sm text-secondary">{formSuccess}</p> : null}
      </form>

      <section className="space-y-6">
        <div className="grid gap-6 rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-6 shadow-[0_16px_50px_rgba(17,24,39,0.04)] sm:p-8">
          <div>
            <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
              {t("profile.notifications")}
            </p>
            <h2 className="mt-2 font-h3 text-h3 text-primary">{t("profile.preferencesTitle")}</h2>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface px-4 py-4">
            <span>
              <span className="block font-semibold text-primary">{t("profile.emailNotifications")}</span>
              <span className="block text-sm text-on-surface-variant">{t("profile.emailNotificationsHint")}</span>
            </span>
            <input
              checked={emailNotifications}
              className="h-5 w-5 accent-[#f26a1b]"
              type="checkbox"
              onChange={(event) => setEmailNotifications(event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface px-4 py-4">
            <span>
              <span className="block font-semibold text-primary">{t("profile.smsNotifications")}</span>
              <span className="block text-sm text-on-surface-variant">{t("profile.smsNotificationsHint")}</span>
            </span>
            <input
              checked={smsNotifications}
              className="h-5 w-5 accent-[#f26a1b]"
              type="checkbox"
              onChange={(event) => setSmsNotifications(event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface px-4 py-4">
            <span>
              <span className="block font-semibold text-primary">{t("profile.twoFactorAuth")}</span>
              <span className="block text-sm text-on-surface-variant">{t("profile.twoFactorAuthHint")}</span>
            </span>
            <input
              checked={twoFactorEnabled}
              className="h-5 w-5 accent-[#f26a1b]"
              type="checkbox"
              onChange={(event) => setTwoFactorEnabled(event.target.checked)}
            />
          </label>
        </div>

        <div className="rounded-[28px] border border-outline-variant/60 bg-surface-container-low p-6 shadow-[0_16px_50px_rgba(17,24,39,0.04)] sm:p-8">
          <p className="font-label-caps text-label-caps uppercase tracking-[0.22em] text-secondary">
            {t("profile.account")}
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {t("profile.profileHint")}
          </p>
        </div>
      </section>
    </div>
  );
}
