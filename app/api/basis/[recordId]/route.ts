import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: {
    recordId: string;
  };
};

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const recordId = context.params.recordId;
  if (!recordId) {
    return NextResponse.json({ message: "recordId is required" }, { status: 400 });
  }

  const { data: existingRecord, error: fetchError } = await supabaseAdmin
    .from("business_analysis_data")
    .select("id, created_at, created_by_email, data")
    .eq("id", recordId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ message: `Failed to fetch basis record: ${fetchError.message}` }, { status: 500 });
  }

  if (!existingRecord) {
    return NextResponse.json({ message: "Basis record not found" }, { status: 404 });
  }

  const { error: deleteError } = await supabaseAdmin.from("business_analysis_data").delete().eq("id", recordId);
  if (deleteError) {
    return NextResponse.json({ message: `Failed to delete basis record: ${deleteError.message}` }, { status: 500 });
  }

  await supabaseAdmin.from("basis_transaction_logs").insert({
    action: "delete",
    table_name: "business_analysis_data",
    record_id: recordId,
    created_by_email: authResult.user.email
  });

  return NextResponse.json({ deleted: true, id: recordId }, { status: 200 });
}
