"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ContractRow = {
  id: string;
  contractNumber: string;
  contractType: string;
  status: string;
  boldsignDocumentId: string | null;
  signatureProvider: string | null;
  ownerSignedAt: string | null;
  tenantSignedAt: string | null;
  signatureFailedReason: string | null;
  hasGeneratedPdf: boolean;
  hasSignedPdf: boolean;
  hasAuditTrail: boolean;
  generatedAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    listingTitle: string;
    listingCity: string;
    ownerName: string;
    ownerEmail: string;
    renterName: string;
    renterEmail: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  GENERATED: "bg-blue-500/10 text-blue-700",
  SENT: "bg-amber-500/10 text-amber-700",
  OWNER_SIGNED: "bg-secondary-container/20 text-secondary",
  SIGNED: "bg-[#4b6547]/10 text-[#4b6547]",
  CANCELLED: "bg-stone-100 text-stone-500",
  DRAFT: "bg-stone-100 text-stone-500",
  SIGNATURE_FAILED: "bg-error/10 text-error",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminContractsWorkspace() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busySyncId, setBusySyncId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ limit: "100" });
        if (search.trim()) qs.set("search", search.trim());
        if (statusFilter) qs.set("status", statusFilter);
        const res = await fetch(`/api/admin/contracts?${qs.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("errors.generic"));
        const data = (await res.json()) as { rows: ContractRow[]; total: number };
        if (!cancelled) {
          setRows(data.rows);
          setTotal(data.total);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("errors.generic"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, statusFilter, t]);

  async function syncBoldsign(id: string) {
    setBusySyncId(id);
    setSyncError(null);
    try {
      const res = await fetch(`/api/contracts/${id}/sync-boldsign`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as { boldsignStatus?: string; error?: string };
      if (!res.ok) {
        setSyncError(data.error ?? t("errors.generic"));
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status: (data as { localStatus?: string }).localStatus ?? row.status,
              }
            : row,
        ),
      );
    } catch {
      setSyncError(t("errors.generic"));
    } finally {
      setBusySyncId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] text-primary">
            {t("admin.contracts.title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t("admin.contracts.subtitle", { count: total })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
            search
          </span>
          <input
            className="w-full rounded-full border border-outline-variant/60 bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:ring-0"
            placeholder={t("admin.contracts.searchPlaceholder")}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-full border border-outline-variant/60 bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:ring-0"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t("admin.contracts.allStatuses")}</option>
          <option value="GENERATED">Generated</option>
          <option value="SENT">Sent</option>
          <option value="OWNER_SIGNED">Owner Signed</option>
          <option value="SIGNED">Signed</option>
          <option value="SIGNATURE_FAILED">Signature Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-secondary/20 bg-secondary-container/15 px-4 py-3 text-sm text-primary">
          {error}
        </div>
      ) : null}

      {syncError ? (
        <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {syncError}
        </div>
      ) : null}

      <div className="tonal-card overflow-hidden rounded-[1.75rem] border border-outline-variant/60 bg-surface/75 shadow-[0_12px_40px_rgba(17,24,39,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
              <tr>
                {[
                  t("admin.contracts.col.contract"),
                  t("admin.contracts.col.booking"),
                  t("admin.contracts.col.owner"),
                  t("admin.contracts.col.renter"),
                  t("admin.contracts.col.status"),
                  t("admin.contracts.col.boldsign"),
                  t("admin.contracts.col.signed"),
                  t("admin.contracts.col.actions"),
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-on-surface-variant" colSpan={8}>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-on-surface-variant" colSpan={8}>
                    {t("admin.contracts.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.contractNumber}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(row.generatedAt)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.bookingNumber}</p>
                      <p className="text-xs text-on-surface-variant">
                        {row.booking.listingTitle} · {row.booking.listingCity}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.ownerName}</p>
                      <p className="text-xs text-on-surface-variant">{row.booking.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-primary">{row.booking.renterName}</p>
                      <p className="text-xs text-on-surface-variant">{row.booking.renterEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[row.status] ?? "bg-stone-100 text-stone-500"}`}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {row.boldsignDocumentId ? (
                        <p className="max-w-[120px] truncate text-xs text-on-surface-variant font-mono">
                          {row.boldsignDocumentId}
                        </p>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-on-surface-variant">
                        {t("admin.contracts.ownerSigned")}: {formatDate(row.ownerSignedAt)}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {t("admin.contracts.tenantSigned")}: {formatDate(row.tenantSignedAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {row.hasGeneratedPdf ? (
                          <a
                            href={`/api/contracts/${row.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">download</span>
                            {t("admin.contracts.downloadPdf")}
                          </a>
                        ) : null}
                        {row.hasSignedPdf ? (
                          <a
                            href={`/api/contracts/${row.id}/signed-pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-[#4b6547]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#4b6547] hover:bg-[#4b6547]/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            {t("admin.contracts.signedPdf")}
                          </a>
                        ) : null}
                        {row.hasAuditTrail ? (
                          <a
                            href={`/api/contracts/${row.id}/audit-trail`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">history</span>
                            {t("admin.contracts.auditTrail")}
                          </a>
                        ) : null}
                        {row.boldsignDocumentId ? (
                          <button
                            type="button"
                            disabled={busySyncId === row.id}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-50"
                            onClick={() => void syncBoldsign(row.id)}
                          >
                            <span className="material-symbols-outlined text-[12px]">sync</span>
                            {busySyncId === row.id ? t("common.loading") : t("admin.contracts.syncStatus")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && total > 0 ? (
          <div className="border-t border-outline-variant/60 bg-surface px-4 py-3 text-sm text-on-surface-variant">
            {t("admin.contracts.showing", { count: rows.length, total })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
