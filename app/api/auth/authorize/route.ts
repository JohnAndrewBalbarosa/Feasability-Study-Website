import { NextResponse } from "next/server";

import { SYSTEM_HOME_PATH } from "@/lib/authRoutes";
import { authorizeOrgSession, extractBearerToken, setServerAuthCookie } from "@/lib/authServer";

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const response = NextResponse.json({ authorized: true, email: authResult.user.email, systemPath: SYSTEM_HOME_PATH }, { status: 200 });
  const bearerToken = extractBearerToken(request);

  if (bearerToken) {
    setServerAuthCookie(response, bearerToken);
  }

  return response;
}
