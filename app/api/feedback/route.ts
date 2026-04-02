import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const feedbackSchema = z.object({
  runId: z.string().uuid(),
  actualDemand: z.number().int().nonnegative(),
  actualUnitsSold: z.number().int().nonnegative(),
  actualRevenue: z.number().nonnegative(),
  notes: z.string().max(1000).optional()
});

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const raw = await request.json();
  const parsed = feedbackSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid feedback payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { data: runData, error: runError } = await supabaseAdmin
    .from("pipeline_runs")
    .select("id, output_payload")
    .eq("id", parsed.data.runId)
    .single();

  if (runError || !runData) {
    return NextResponse.json(
      {
        message: "Run not found",
        details: runError?.message
      },
      { status: 404 }
    );
  }

  const expectedDemand = Number(runData.output_payload?.forecastResult?.demandForecast?.expected ?? 0);
  const demandVariance = parsed.data.actualDemand - expectedDemand;
  const varianceRatio = expectedDemand > 0 ? demandVariance / expectedDemand : 0;

  const { error: feedbackError } = await supabaseAdmin.from("feedback_loops").insert({
    run_id: parsed.data.runId,
    actual_demand: parsed.data.actualDemand,
    actual_units_sold: parsed.data.actualUnitsSold,
    actual_revenue: parsed.data.actualRevenue,
    expected_demand: expectedDemand,
    demand_variance: demandVariance,
    variance_ratio: varianceRatio,
    notes: parsed.data.notes ?? null
  });

  if (feedbackError) {
    return NextResponse.json(
      {
        message: "Failed to persist feedback",
        details: feedbackError.message
      },
      { status: 500 }
    );
  }

  const { error: auditError } = await supabaseAdmin.from("pipeline_audit_logs").insert({
    run_id: parsed.data.runId,
    event_type: "FEEDBACK_INGESTED",
    event_payload: {
      actualDemand: parsed.data.actualDemand,
      expectedDemand,
      demandVariance,
      varianceRatio,
      actualUnitsSold: parsed.data.actualUnitsSold,
      actualRevenue: parsed.data.actualRevenue
    }
  });

  if (auditError) {
    return NextResponse.json(
      {
        message: "Feedback saved but audit log failed",
        details: auditError.message
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      feedback: {
        runId: parsed.data.runId,
        expectedDemand,
        demandVariance,
        varianceRatio
      }
    },
    { status: 200 }
  );
}
