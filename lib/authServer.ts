import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const SERVER_AUTH_COOKIE = "org_auth_token";

type AuthorizedUser = {
  email: string;
};

type AuthorizationResult =
  | {
      ok: true;
      user: AuthorizedUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type TokenValidationResult =
  | {
      ok: true;
      user: AuthorizedUser;
    }
  | {
      ok: false;
      reason: "missing-token" | "invalid-session" | "missing-allowlist" | "unauthorized-account";
    };

export function getAllowedEmails() {
  return (process.env.ALLOWED_GOOGLE_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : null;
}

function readCookieValue(cookieHeader: string, cookieName: string): string | null {
  const parts = cookieHeader.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    if (name !== cookieName) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function readServerAuthCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const token = readCookieValue(cookieHeader, SERVER_AUTH_COOKIE);
  return token && token.length > 0 ? token : null;
}

export async function validateOrgToken(token: string | null): Promise<TokenValidationResult> {
  if (!token) {
    return {
      ok: false,
      reason: "missing-token"
    };
  }

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.email) {
    return {
      ok: false,
      reason: "invalid-session"
    };
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length === 0) {
    return {
      ok: false,
      reason: "missing-allowlist"
    };
  }

  const normalizedEmail = user.email.toLowerCase();
  if (!allowedEmails.includes(normalizedEmail)) {
    return {
      ok: false,
      reason: "unauthorized-account"
    };
  }

  return {
    ok: true,
    user: {
      email: normalizedEmail
    }
  };
}

export function setServerAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(SERVER_AUTH_COOKIE, encodeURIComponent(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60
  });
}

export function clearServerAuthCookie(response: NextResponse): void {
  response.cookies.set(SERVER_AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function authorizeOrgSession(request: Request): Promise<AuthorizationResult> {
  const token = extractBearerToken(request) ?? readServerAuthCookie(request);
  const validation = await validateOrgToken(token);

  if (validation.ok) {
    return {
      ok: true,
      user: validation.user
    };
  }

  if (validation.reason === "missing-token") {
    return {
      ok: false,
      response: NextResponse.json({ message: "Missing bearer token" }, { status: 401 })
    };
  }

  if (validation.reason === "invalid-session") {
    return {
      ok: false,
      response: NextResponse.json({ message: "Invalid or expired session" }, { status: 401 })
    };
  }

  if (validation.reason === "missing-allowlist") {
    return {
      ok: false,
      response: NextResponse.json({ message: "No allowed emails configured" }, { status: 500 })
    };
  }

  return {
    ok: false,
    response: NextResponse.json({ message: "Unauthorized account" }, { status: 403 })
  };
}