import { NextRequest, NextResponse } from "next/server";

import { SERVER_AUTH_COOKIE, clearServerAuthCookie, validateOrgToken } from "@/lib/authServer";

const PUBLIC_ROUTES = new Set<string>(["/login", "/unauthorized", "/auth/verify"]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/auth/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SERVER_AUTH_COOKIE)?.value ?? null;
  const validation = await validateOrgToken(token);

  if (validation.ok) {
    return NextResponse.next();
  }

  const redirectPath = validation.reason === "unauthorized-account" ? "/unauthorized" : "/login";
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  clearServerAuthCookie(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
