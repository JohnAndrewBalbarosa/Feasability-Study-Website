import { NextResponse } from "next/server";

import { SYSTEM_HOME_PATH } from "@/lib/authRoutes";
import { authorizeOrgSession } from "@/lib/authServer";

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  return NextResponse.json({ authorized: true, email: authResult.user.email, systemPath: SYSTEM_HOME_PATH }, { status: 200 });
}
