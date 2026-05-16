import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getAuthCookieName,
  getAuthCookieOptions,
  hashPassword,
  safeUserSelect,
} from "@/lib/auth";
import { signupSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid signup details.",
      },
      { status: 400 },
    );
  }

  const { fullName, email, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
        ownerProfile:
          role === "OWNER"
            ? {
                create: {},
              }
            : undefined,
        renterProfile:
          role === "RENTER"
            ? {
                create: {},
              }
            : undefined,
      },
      select: safeUserSelect,
    });

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());
    return response;
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
