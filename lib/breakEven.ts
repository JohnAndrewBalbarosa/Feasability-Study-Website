import type { BreakEvenResult, CostModel } from "@/lib/types";

export function buildBreakEvenCacheKey(costModel: CostModel): string {
  return JSON.stringify({
    fixedCost: Number(costModel.fixedCost.toFixed(4)),
    variableCostPerUnit: Number(costModel.variableCostPerUnit.toFixed(4)),
    sellingPricePerUnit: Number(costModel.sellingPricePerUnit.toFixed(4))
  });
}

export function computeBreakEvenResult(costModel: CostModel): BreakEvenResult {
  const contributionMargin = costModel.sellingPricePerUnit - costModel.variableCostPerUnit;
  const breakEvenPointUnits = contributionMargin > 0 ? Math.ceil(costModel.fixedCost / contributionMargin) : Number.POSITIVE_INFINITY;
  const breakEvenRevenue = Number.isFinite(breakEvenPointUnits)
    ? breakEvenPointUnits * costModel.sellingPricePerUnit
    : Number.POSITIVE_INFINITY;

  return {
    breakEvenPointUnits,
    breakEvenRevenue,
    contributionMargin,
    status: Number.isFinite(breakEvenPointUnits) ? "reachable" : "unreachable",
    computedAt: new Date().toISOString(),
    cacheKey: buildBreakEvenCacheKey(costModel)
  };
}

export async function computeBreakEvenResultAsync(costModel: CostModel): Promise<BreakEvenResult> {
  await new Promise((resolve) => setTimeout(resolve, 140));
  return computeBreakEvenResult(costModel);
}
