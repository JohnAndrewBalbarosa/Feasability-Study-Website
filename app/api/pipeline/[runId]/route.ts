import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const paramsSchema = z.object({
  runId: z.string().uuid()
});

type RouteContext = {
  params: {
    runId: string;
  };
};

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ message: "Invalid run id" }, { status: 400 });
  }

  const runId = parsedParams.data.runId;

  const { data: runRecord, error: readError } = await supabaseAdmin
    .from("pipeline_runs")
    .select("id, created_at, pipeline_version, finalized, input_payload, output_payload")
    .eq("id", runId)
    .single();

  if (readError || !runRecord) {
    return NextResponse.json(
      {
        message: "Run not found",
        details: readError?.message
      },
      { status: 404 }
    );
  }

  const { data: logRow, error: logError } = await supabaseAdmin
    .from("pipeline_deletion_logs")
    .insert({
      run_id: runRecord.id,
      pipeline_version: runRecord.pipeline_version,
      deleted_by_email: authResult.user.email,
      deleted_payload: runRecord
    })
    .select("id, created_at, run_id, pipeline_version, deleted_by_email")
    .single();

  if (logError || !logRow) {
    return NextResponse.json(
      {
        message: "Failed to write deletion log",
        details: logError?.message
      },
      { status: 500 }
    );
  }

  const { data: deletedRun, error: deleteError } = await supabaseAdmin.from("pipeline_runs").delete().eq("id", runId).select("id").single();

  if (deleteError || !deletedRun) {
    await supabaseAdmin.from("pipeline_deletion_logs").delete().eq("id", logRow.id);

    return NextResponse.json(
      {
        message: "Failed to delete run",
        details: deleteError?.message,
        runId
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      deleted: true,
      runId,
      log: logRow
    },
    { status: 200 }
  );
}
