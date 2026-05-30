import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notifications";
import { emitNotificationsUpdated } from "@/lib/socket/server";

export const dynamic = "force-dynamic";

function canAccessMessaging(role: string) {
  return role === "OWNER" || role === "RENTER";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to update notifications." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can access notifications." },
      { status: 403 },
    );
  }

  const result = await markNotificationAsRead(id, currentUser.id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  emitNotificationsUpdated([currentUser.id], {
    unreadCount: result.unreadCount,
  });

  return NextResponse.json({
    notification: result.notification,
    unreadCount: result.unreadCount,
  });
}
