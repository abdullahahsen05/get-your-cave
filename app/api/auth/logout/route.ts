import { NextResponse } from "next/server";

import {
  getAuthCookieName,
  getAuthCookieOptions,
  getLoginChallengeCookieName,
  getLoginChallengeCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set({
    name: getAuthCookieName(),
    value: "",
    ...getAuthCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
  response.cookies.set({
    name: getLoginChallengeCookieName(),
    value: "",
    ...getLoginChallengeCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  const acceptHeader = request.headers.get("accept") ?? "";
  if (acceptHeader.includes("application/json")) {
    return response;
  }

  const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
  redirectResponse.cookies.set({
    name: getAuthCookieName(),
    value: "",
    ...getAuthCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
  redirectResponse.cookies.set({
    name: getLoginChallengeCookieName(),
    value: "",
    ...getLoginChallengeCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
  return redirectResponse;
}
