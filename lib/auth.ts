import type {
  AccountStatus,
  Prisma,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

const AUTH_COOKIE_NAME = "gyc_auth_token";
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export type SafeOwnerProfile = {
  id: string;
  userId: string;
  bio: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  responseRate: number | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SafeRenterProfile = {
  id: string;
  userId: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  ownerProfile: SafeOwnerProfile | null;
  renterProfile: SafeRenterProfile | null;
};

export const safeOwnerProfileSelect = {
  id: true,
  userId: true,
  bio: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  responseRate: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OwnerProfileSelect;

export const safeRenterProfileSelect = {
  id: true,
  userId: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RenterProfileSelect;

export const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  ownerProfile: {
    select: safeOwnerProfileSelect,
  },
  renterProfile: {
    select: safeRenterProfileSelect,
  },
} satisfies Prisma.UserSelect;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(value: string) {
  const binary = Array.from(encoder.encode(value), (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeBytes(value: Uint8Array) {
  const binary = Array.from(value, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "getyourcave-development-auth-secret";
}

async function getHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function buildJwtHeader() {
  return { alg: "HS256", typ: "JWT" } as const;
}

export function normalizeInternalPath(path: string | null | undefined) {
  if (!path || typeof path !== "string") {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }

  if (path === "/login" || path === "/signup") {
    return null;
  }

  return path;
}

export async function hashPassword(password: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(payload: {
  userId: string;
  role: UserRole;
}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload: AuthTokenPayload = {
    sub: payload.userId,
    role: payload.role,
    iat: issuedAt,
    exp: issuedAt + AUTH_TOKEN_TTL_SECONDS,
  };

  const secret = getAuthSecret();
  const headerPart = base64UrlEncode(JSON.stringify(buildJwtHeader()));
  const payloadPart = base64UrlEncode(JSON.stringify(tokenPayload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));

  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split(".");

  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  try {
    const header = JSON.parse(decoder.decode(base64UrlDecode(headerPart))) as {
      alg?: string;
      typ?: string;
    };
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(
      decoder.decode(base64UrlDecode(payloadPart)),
    ) as AuthTokenPayload;

    if (!payload.sub || !payload.role || !payload.exp) {
      return null;
    }

    if (payload.exp * 1000 <= Date.now()) {
      return null;
    }

    const secret = getAuthSecret();
    const key = await getHmacKey(secret);
    const signingInput = `${headerPart}.${payloadPart}`;
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signaturePart),
      encoder.encode(signingInput),
    );

    if (!isValid) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getDashboardPath(role: UserRole) {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  if (role === "OWNER") {
    return "/owner/dashboard";
  }

  return "/renter/dashboard";
}

export function hasRequiredRole(
  role: UserRole,
  allowedRoles: UserRole | UserRole[],
) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return allowed.includes(role);
}

export function mapUserToSafeUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  ownerProfile: SafeOwnerProfile | null;
  renterProfile: SafeRenterProfile | null;
}): SafeUser {
  return user;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const { prisma } = await import("./prisma");

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: safeUserSelect,
  });

  return user ? mapUserToSafeUser(user) : null;
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  };
}
