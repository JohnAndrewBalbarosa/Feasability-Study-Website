"use client";

import { supabaseClient } from "@/lib/supabaseClient";

export async function getSessionAuthHeaders(headers: Record<string, string> = {}) {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("No active session. Please sign in again.");
  }

  return {
    ...headers,
    Authorization: `Bearer ${accessToken}`
  };
}