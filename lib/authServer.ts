import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

function getAllowedEmails() {
  return (process.env.ALLOWED_GOOGLE_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function authorizeOrgSession(request: Request): Promise<AuthorizationResult> {
  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Missing bearer token" }, { status: 401 })
    };
  }

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Invalid or expired session" }, { status: 401 })
    };
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ message: "No allowed emails configured" }, { status: 500 })
    };
  }

  const normalizedEmail = user.email.toLowerCase();
  if (!allowedEmails.includes(normalizedEmail)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized account" }, { status: 403 })
    };
  }

  return {
    ok: true,
    user: {
      email: normalizedEmail
    }
  };
}