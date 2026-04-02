import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { runFinalizedPipeline } from "@/lib/pipeline";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizedPipelineSchema } from "@/lib/validation/pipelineSchemas";

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const raw = await request.json();
  const parsed = finalizedPipelineSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid request body",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const output = runFinalizedPipeline(parsed.data);

  const persistedInput = {
    ...parsed.data,
    finalizedAt: new Date().toISOString(),
    finalized: true
  };

  const { data: insertedRun, error } = await supabaseAdmin
    .from("pipeline_runs")
    .insert({
      pipeline_version: parsed.data.pipelineVersion,
      input_payload: persistedInput,
      output_payload: output,
      finalized: true
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        message: "Pipeline computed but failed to persist run",
        details: error.message,
        output
      },
      { status: 500 }
    );
  }

  const { error: auditError } = await supabaseAdmin.from("pipeline_audit_logs").insert({
    run_id: insertedRun.id,
    event_type: "RUN_FINALIZED",
    event_payload: {
      breakEvenResult: parsed.data.breakEvenResult,
      forecastResult: parsed.data.forecastResult,
        procurementDecision: parsed.data.procurementDecision,
      procurementSummary: output.procurementPlan,
      productionSummary: output.productionPlan,
      pipelineVersion: parsed.data.pipelineVersion
    }
  });

  if (auditError) {
    return NextResponse.json(
      {
        message: "Pipeline finalized but failed to write audit log",
        details: auditError.message,
        output
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ output }, { status: 200 });
}
