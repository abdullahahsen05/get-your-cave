import { getCurrentUser } from "@/lib/auth";
import { getContractsForViewer } from "@/lib/contracts/generateContract";
import { ContractsWorkspace } from "@/components/contracts/ContractsWorkspace";
import { createTranslator } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n.server";

export default async function ContractsRoutePage() {
  const locale = await getServerLocale();
  const t = createTranslator(locale);
  const currentUser = await getCurrentUser();

  const contracts = currentUser
    ? await getContractsForViewer({
        role: currentUser.role,
        ownerProfileId: currentUser.ownerProfile?.id ?? null,
        renterProfileId: currentUser.renterProfile?.id ?? null,
      })
    : [];

  return (
    <main className="min-h-screen bg-background text-on-background px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28">
      <style>{`
        .pdf-preview-canvas {
          background-image:
            linear-gradient(45deg, #f0eded 25%, transparent 25%),
            linear-gradient(-45deg, #f0eded 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0eded 75%),
            linear-gradient(-45deg, transparent 75%, #f0eded 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>

      <div className="mx-auto flex max-w-[1480px] flex-col gap-8">
      <header className="space-y-2">
        <h1 className="font-h1 text-h1 text-primary">{t("contracts.title")}</h1>
        <p className="max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
          {t("contracts.subtitle")}
        </p>
      </header>

      {currentUser ? (
        <ContractsWorkspace
          canGenerate={currentUser.role === "OWNER" || currentUser.role === "ADMIN"}
          initialContracts={contracts}
          isAdmin={currentUser.role === "ADMIN"}
        />
      ) : (
        <div className="rounded-[28px] border border-outline-variant/30 bg-surface-container-low p-6 text-on-surface-variant shadow-[0_8px_30px_rgba(15,61,62,0.04)] sm:p-8">
          {t("contracts.signInRequired")}
        </div>
      )}
      </div>
    </main>
  );
}
