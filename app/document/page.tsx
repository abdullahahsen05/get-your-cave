import { redirect } from "next/navigation";

import VerificationDocumentsWorkspace from "@/components/document/VerificationDocumentsWorkspace";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VerificationDocumentsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/document");
  }

  return <VerificationDocumentsWorkspace currentUser={currentUser} />;
}

