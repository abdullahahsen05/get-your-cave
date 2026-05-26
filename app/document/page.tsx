import { redirect } from "next/navigation";

import VerificationDocumentsWorkspace from "@/components/document/VerificationDocumentsWorkspace";
import { getCurrentUser, getDashboardPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VerificationDocumentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/document");
  }

  if (currentUser.role === "ADMIN") {
    redirect(getDashboardPath(currentUser.role));
  }

  return <VerificationDocumentsWorkspace currentUser={currentUser} />;
}
