import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { data, error } = await supabaseAdmin
    .from("pipeline_runs")
    .select("id, created_at, output_payload")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      {
        message: "Failed to load run history",
        details: error.message,
        hint: "Verify pipeline_runs exists in Supabase and service-role key is valid for this project"
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ runs: data }, { status: 200 });
}
