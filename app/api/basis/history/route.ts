import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BasisRow = {
  productName?: string;
  weightedBreakEvenUnits?: number;
  actualUnitsSoldToday?: number;
  deficitUnits?: number;
  revenueToday?: number;
  profitToday?: number;
};

type BasisRecord = {
  id: string;
  created_at: string;
  data: BasisRow[];
};

export async function GET(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { data, error } = await supabaseAdmin
    .from("business_analysis_data")
    .select("id, created_at, data")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ message: `Failed to load business analysis history: ${error.message}` }, { status: 500 });
  }

  const records: BasisRecord[] = (data ?? []).map((record) => {
    const mappedData = Array.isArray(record.data) ? (record.data as BasisRow[]) : [];

    return {
      id: String(record.id),
      created_at: String(record.created_at),
      data: mappedData
    };
  });

  return NextResponse.json({ records }, { status: 200 });
}
