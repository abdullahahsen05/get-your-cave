import { redirect } from "next/navigation";

import MessagingWorkspace from "@/components/messages/MessagingWorkspace";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function MessagingPage({ searchParams }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/messaging");
  }

  const params = await searchParams;
  const initialConversationId = getSingleValue(
    params.conversation ?? params.conversationId,
  );

  return (
    <MessagingWorkspace
      currentUser={currentUser}
      initialConversationId={initialConversationId || null}
    />
  );
}
