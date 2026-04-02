import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeOrgSession } from "@/lib/authServer";
import { generateDeterministicForecast } from "@/lib/forecast";

const breakEvenResultSchema = z.object({
  breakEvenPointUnits: z.number(),
  breakEvenRevenue: z.number(),
  contributionMargin: z.number(),
  status: z.enum(["reachable", "unreachable"]),
  computedAt: z.string(),
  cacheKey: z.string()
});

const costModelSchema = z.object({
  fixedCost: z.number().nonnegative(),
  variableCostPerUnit: z.number().nonnegative(),
  sellingPricePerUnit: z.number().positive()
});

const forecastRequestSchema = z.object({
  breakEvenResult: breakEvenResultSchema,
  costModel: costModelSchema,
  marketSignals: z.object({
    marketTrends: z.array(z.string()),
    demandSignals: z.array(z.string()),
    pricingVolatility: z.enum(["low", "medium", "high"])
  })
});

export async function POST(request: Request) {
  const authResult = await authorizeOrgSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = await request.json();
  const parsed = forecastRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid forecast request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const forecastResult = generateDeterministicForecast(parsed.data);
  return NextResponse.json({ forecastResult }, { status: 200 });
}
