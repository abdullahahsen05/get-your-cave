import { AccountStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  comparePassword,
  getCurrentUser,
  hashPassword,
  safeUserSelect,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.email("Please enter a valid email address.").trim().toLowerCase().optional(),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(250).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  iban: z.string().trim().min(10).max(34).optional().or(z.literal("")),
  emailNotificationsEnabled: z.boolean().optional(),
  smsNotificationsEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  currentPassword: z.string().min(8).optional().or(z.literal("")),
  newPassword: z.string().min(8).max(128).optional().or(z.literal("")),
});

function normalizeEmpty(value: string | undefined | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: safeUserSelect,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile details." },
      { status: 400 },
    );
  }

  const nextPassword = normalizeEmpty(parsed.data.newPassword);
  const currentPassword = normalizeEmpty(parsed.data.currentPassword);
  const nextEmail = normalizeEmpty(parsed.data.email);
  const nextFullName = normalizeEmpty(parsed.data.fullName);
  const nextPhone = normalizeEmpty(parsed.data.phone);
  const nextAddress = normalizeEmpty(parsed.data.address);
  const nextCity = normalizeEmpty(parsed.data.city);
  const nextPostalCode = normalizeEmpty(parsed.data.postalCode);
  const nextIban = normalizeEmpty(parsed.data.iban);
  const nextEmailNotificationsEnabled = parsed.data.emailNotificationsEnabled;
  const nextSmsNotificationsEnabled = parsed.data.smsNotificationsEnabled;
  const nextTwoFactorEnabled = parsed.data.twoFactorEnabled;

  const existing = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      email: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (nextPassword) {
    if (!currentPassword || !existing.passwordHash) {
      return NextResponse.json(
        { error: "Current password is required to change your password." },
        { status: 400 },
      );
    }

    const matches = await comparePassword(currentPassword, existing.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }
  }

  const emailChanged = Boolean(nextEmail && nextEmail !== existing.email);

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: existing.id },
      data: {
        fullName: nextFullName ?? undefined,
        email: nextEmail ?? undefined,
        phone: nextPhone,
        passwordHash: nextPassword ? await hashPassword(nextPassword) : undefined,
        emailNotificationsEnabled: nextEmailNotificationsEnabled,
        smsNotificationsEnabled: nextSmsNotificationsEnabled,
        twoFactorEnabled: nextTwoFactorEnabled,
        status: emailChanged ? AccountStatus.PENDING_VERIFICATION : undefined,
      },
      select: safeUserSelect,
    });

    if (existing.role === "OWNER") {
      await tx.ownerProfile.upsert({
        where: {
          userId: existing.id,
        },
        create: {
          userId: existing.id,
          address: nextAddress,
          city: nextCity,
          postalCode: nextPostalCode,
          iban: nextIban,
        },
        update: {
          address: nextAddress,
          city: nextCity,
          postalCode: nextPostalCode,
          iban: nextIban,
        },
      });
    }

    if (existing.role === "RENTER") {
      await tx.renterProfile.upsert({
        where: {
          userId: existing.id,
        },
        create: {
          userId: existing.id,
          address: nextAddress,
          city: nextCity,
          postalCode: nextPostalCode,
        },
        update: {
          address: nextAddress,
          city: nextCity,
          postalCode: nextPostalCode,
        },
      });
    }

    return user;
  });

  return NextResponse.json({ user: updated });
}
