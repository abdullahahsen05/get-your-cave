import { getCurrentUser } from "@/lib/auth";
import { getContractsForViewer } from "@/lib/contracts/generateContract";
import { ContractsWorkspace } from "@/components/contracts/ContractsWorkspace";

export default async function ContractsRoutePage() {
  const currentUser = await getCurrentUser();

  const contracts = currentUser
    ? await getContractsForViewer({
        role: currentUser.role,
        ownerProfileId: currentUser.ownerProfile?.id ?? null,
        renterProfileId: currentUser.renterProfile?.id ?? null,
      })
    : [];

  return (
    <main className="min-h-screen bg-background text-on-background pt-32 pb-32 mx-auto max-w-[1200px] px-6">
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

      <header className="mb-12">
        <h1 className="font-h1 text-h1 text-primary">Your Contracts</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Manage your secure storage agreements and legal documentation.
        </p>
      </header>

      {currentUser ? (
        <ContractsWorkspace
          canGenerate={currentUser.role === "OWNER" || currentUser.role === "ADMIN"}
          initialContracts={contracts}
        />
      ) : (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-8 text-on-surface-variant">
          Please sign in to view your contracts.
        </div>
      )}
    </main>
  );
}

