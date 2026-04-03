import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const payloadSchema = z.object({
  businessAnalysisData: z.array(z.record(z.string(), z.unknown())).default([]),
  materialsData: z.array(z.record(z.string(), z.unknown())).default([]),
  procurementData: z.array(z.record(z.string(), z.unknown())).default([])
});

function isMissingTableOrSchemaCacheError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("could not find the table") || normalized.includes("schema cache");
}

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const raw = await request.json();
  const parsed = payloadSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid basis payload" }, { status: 400 });
  }

  if (parsed.data.businessAnalysisData.length === 0) {
    return NextResponse.json({ message: "business_analysis_data cannot be empty" }, { status: 400 });
  }

  const createdByEmail = authResult.user.email;

  const { error: businessError } = await supabaseAdmin.from("business_analysis_data").insert({
    created_by_email: createdByEmail,
    data: parsed.data.businessAnalysisData
  });

  if (businessError) {
    if (isMissingTableOrSchemaCacheError(businessError.message)) {
      return NextResponse.json(
        {
          message:
            "business_analysis_data table is missing or not yet visible in schema cache. Run supabase/schema.sql in Supabase SQL Editor, then run: NOTIFY pgrst, 'reload schema';"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: `Failed to insert business_analysis_data: ${businessError.message}` }, { status: 500 });
  }

  if (parsed.data.materialsData.length > 0) {
    const { error: materialsError } = await supabaseAdmin.from("materials_data").insert({
      created_by_email: createdByEmail,
      data: parsed.data.materialsData
    });

    if (materialsError) {
      if (isMissingTableOrSchemaCacheError(materialsError.message)) {
        return NextResponse.json(
          {
            message:
              "materials_data table is missing or not yet visible in schema cache. Run supabase/schema.sql in Supabase SQL Editor, then run: NOTIFY pgrst, 'reload schema';"
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: `Failed to insert materials_data: ${materialsError.message}` }, { status: 500 });
    }
  }

  if (parsed.data.procurementData.length > 0) {
    const { error: procurementError } = await supabaseAdmin.from("procurement_data").insert({
      created_by_email: createdByEmail,
      data: parsed.data.procurementData
    });

    if (procurementError) {
      if (isMissingTableOrSchemaCacheError(procurementError.message)) {
        return NextResponse.json(
          {
            message:
              "procurement_data table is missing or not yet visible in schema cache. Run supabase/schema.sql in Supabase SQL Editor, then run: NOTIFY pgrst, 'reload schema';"
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: `Failed to insert procurement_data: ${procurementError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ saved: true, message: "Basis data inserted successfully." }, { status: 200 });
}
