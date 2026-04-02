import { NextResponse } from "next/server";

import { clearServerAuthCookie } from "@/lib/authServer";

export async function POST() {
  const response = NextResponse.json({ loggedOut: true }, { status: 200 });
  clearServerAuthCookie(response);
  return response;
}
