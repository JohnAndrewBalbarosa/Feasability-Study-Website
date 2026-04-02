import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { data, error } = await supabaseAdmin
    .from("pipeline_deletion_logs")
    .select("id, created_at, run_id, pipeline_version, deleted_by_email")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      {
        message: "Failed to load deletion logs",
        details: error.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: data ?? [] }, { status: 200 });
}
