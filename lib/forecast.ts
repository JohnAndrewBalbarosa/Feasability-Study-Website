import type { BreakEvenResult, CostModel, DemandForecast, ForecastResult } from "@/lib/types";

export type MarketSignal = {
  marketTrends: string[];
  demandSignals: string[];
  pricingVolatility: "low" | "medium" | "high";
};

type ForecastInput = {
  breakEvenResult: BreakEvenResult;
  costModel: CostModel;
  marketSignals: MarketSignal;
};

function volatilityMultiplier(volatility: MarketSignal["pricingVolatility"]): number {
  if (volatility === "high") {
    return 1.16;
  }
  if (volatility === "medium") {
    return 1.1;
  }
  return 1.05;
}

export function generateDeterministicForecast(input: ForecastInput): ForecastResult {
  const baseDemand = Number.isFinite(input.breakEvenResult.breakEvenPointUnits) ? input.breakEvenResult.breakEvenPointUnits : 0;
  const demandSignalBonus = Math.max(0, input.marketSignals.demandSignals.length * 8);
  const recommended = Math.ceil((baseDemand + demandSignalBonus) * volatilityMultiplier(input.marketSignals.pricingVolatility));

  const demandForecast: DemandForecast = {
    low: Math.max(0, Math.floor(recommended * 0.85)),
    expected: recommended,
    high: Math.ceil(recommended * 1.2)
  };

  const margin = input.costModel.sellingPricePerUnit - input.costModel.variableCostPerUnit;
  const pricingInsights =
    margin > 0
      ? `Margin positive at ${margin.toFixed(2)} per unit; maintain price floor above ${(input.costModel.variableCostPerUnit * 1.15).toFixed(2)}.`
      : "Negative margin detected. Raise price or reduce procurement cost before scaling production.";

  return {
    productionRecommendation: recommended,
    demandForecast,
    pricingInsights,
    marketSignalSummary: `${input.marketSignals.marketTrends.length} trends, ${input.marketSignals.demandSignals.length} demand signals, volatility ${input.marketSignals.pricingVolatility}`,
    promptVersion: "promptAI.v2.structured-json",
    generatedAt: new Date().toISOString()
  };
}
