import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
} from "@/lib/notifications";
import { emitNotificationsUpdated } from "@/lib/socket/server";

export const dynamic = "force-dynamic";

function canAccessMessaging(role: string) {
  return role === "OWNER" || role === "RENTER";
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You must be signed in to view notifications." },
      { status: 401 },
    );
  }

  if (!canAccessMessaging(currentUser.role)) {
    return NextResponse.json(
      { error: "Only owners and renters can access notifications." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);
  const data = await listNotificationsForUser(currentUser.id, {
    limit: Number.isFinite(limit) ? limit : 20,
  });

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
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

  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const action =
    typeof body === "object" && body !== null && "action" in body
      ? (body as { action?: string }).action
      : null;

  if (action !== "mark-all-read") {
    return NextResponse.json(
      { error: "Unsupported notifications action." },
      { status: 400 },
    );
  }

  const updated = await markAllNotificationsAsRead(currentUser.id);
  const data = await listNotificationsForUser(currentUser.id, { limit: 20 });

  emitNotificationsUpdated([currentUser.id], {
    unreadCount: updated.unreadCount,
  });

  return NextResponse.json({
    ...data,
    unreadCount: updated.unreadCount,
  });
}
