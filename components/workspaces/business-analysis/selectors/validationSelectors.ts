import type { BreakEvenAnalysis, ProfitAnalysis, Step1Data, UnitsData, WeightedBreakEvenSummary } from "../types";
import type { GraphData, GraphPathData } from "./graphSelectors";

export function getStepValidationErrors(
  step: number,
  step1Data: Step1Data,
  unitsData: UnitsData,
  profitAnalysis: ProfitAnalysis | null,
  breakEvenAnalysis: BreakEvenAnalysis | null,
  graphData: GraphData | null,
  graphPathData: GraphPathData | null,
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null
): string[] {
  if (step === 1) {
    return step1Data.errors;
  }

  if (step === 3) {
    if (step1Data.errors.length > 0) {
      return ["Complete Step 1 before entering units sold."];
    }

    return unitsData.errors;
  }

  if (step === 4) {
    return profitAnalysis ? [] : ["Complete Steps 1 and 3 with valid values before profit analysis."];
  }

  if (step === 5) {
    if (!breakEvenAnalysis || !breakEvenAnalysis.canCompute) {
      return ["Break-even cannot be computed yet. Complete prior steps with valid data."];
    }

    return [];
  }

  if (step === 6) {
    return graphData && graphPathData ? [] : ["Line graph requires valid break-even data."];
  }

  if (step === 7 || step === 8) {
    return weightedBreakEvenSummary ? [] : ["Weighted break-even and revenue outputs require valid product sales for today."];
  }

  return [];
}
