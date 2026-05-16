import { NextResponse } from "next/server";

import {
  comparePassword,
  createSessionToken,
  getAuthCookieName,
  getAuthCookieOptions,
  safeUserSelect,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid login details.",
      },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...safeUserSelect,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
  });

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        ownerProfile: user.ownerProfile,
        renterProfile: user.renterProfile,
      },
    },
    { status: 200 },
  );
  response.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());
  return response;
}
