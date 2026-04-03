import { NextResponse } from "next/server";

import { authorizeOrgSession } from "@/lib/authServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TableStatus = {
  table: string;
  exists: boolean;
  available: boolean;
};

async function getTableStatus(table: string): Promise<TableStatus> {
  const { count, error } = await supabaseAdmin.from(table).select("*", { head: true, count: "exact" });

  if (error) {
    return {
      table,
      exists: false,
      available: false
    };
  }

  return {
    table,
    exists: (count ?? 0) > 0,
    available: true
  };
}

export async function GET(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const [businessAnalysisStatus, materialsStatus] = await Promise.all([
    getTableStatus("business_analysis_data"),
    getTableStatus("materials_data")
  ]);

  const lockEnabled = businessAnalysisStatus.exists && materialsStatus.exists;

  return NextResponse.json(
    {
      lockEnabled,
      businessAnalysisDataExists: businessAnalysisStatus.exists,
      materialsDataExists: materialsStatus.exists,
      businessAnalysisDataAvailable: businessAnalysisStatus.available,
      materialsDataAvailable: materialsStatus.available
    },
    { status: 200 }
  );
}
