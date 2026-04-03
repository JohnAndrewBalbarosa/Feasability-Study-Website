import { useMemo } from "react";

import { computeInferredVariableCostByProduct } from "@/lib/planningStorage";

import { formatNumber, formatPhp, getStep8ProfitDisplay } from "../formatters";
import type { CostRow, ProductRow } from "../types";
import { buildGraphData, buildGraphPathData } from "../selectors/graphSelectors";
import { buildBreakEvenAnalysis, buildProfitAnalysis, getBreakEvenInsight, getProfitabilityStatus } from "../selectors/profitSelectors";
import { buildStep1Data, buildUnitsData } from "../selectors/stepDataSelectors";
import {
  buildMaterialProcurementRecommendations,
  buildWeightedBreakEvenSummary,
  buildWeightedBreakEvenTotals
} from "../selectors/weightedSelectors";

export function useBusinessAnalysisDerivedData(products: ProductRow[], costRows: CostRow[], planningDataVersion: number) {
  const inferredVariableCostByProduct = useMemo(
    () => computeInferredVariableCostByProduct(products.map((product) => product.productName)),
    [products, planningDataVersion]
  );

  const step1Data = useMemo(() => buildStep1Data(products, costRows, inferredVariableCostByProduct), [products, costRows, inferredVariableCostByProduct]);
  const unitsData = useMemo(() => buildUnitsData(products), [products]);
  const profitAnalysis = useMemo(() => buildProfitAnalysis(step1Data, unitsData), [step1Data, unitsData]);
  const breakEvenAnalysis = useMemo(() => buildBreakEvenAnalysis(profitAnalysis, step1Data, unitsData), [profitAnalysis, step1Data, unitsData]);
  const graphData = useMemo(() => buildGraphData(breakEvenAnalysis, step1Data.fixedCostTotal), [breakEvenAnalysis, step1Data.fixedCostTotal]);
  const graphPathData = useMemo(() => buildGraphPathData(graphData, breakEvenAnalysis), [graphData, breakEvenAnalysis]);
  const weightedBreakEvenSummary = useMemo(
    () => buildWeightedBreakEvenSummary(step1Data, unitsData, breakEvenAnalysis),
    [step1Data, unitsData, breakEvenAnalysis]
  );
  const weightedBreakEvenTotals = useMemo(() => buildWeightedBreakEvenTotals(weightedBreakEvenSummary), [weightedBreakEvenSummary]);
  const materialProcurementRecommendations = useMemo(
    () => buildMaterialProcurementRecommendations(weightedBreakEvenSummary),
    [weightedBreakEvenSummary]
  );
  const step8ProfitDisplay = useMemo(
    () => (weightedBreakEvenTotals ? getStep8ProfitDisplay(weightedBreakEvenTotals.totalProfitToday) : null),
    [weightedBreakEvenTotals]
  );
  const profitabilityStatus = useMemo(() => getProfitabilityStatus(profitAnalysis), [profitAnalysis]);
  const breakEvenInsight = useMemo(
    () => getBreakEvenInsight(breakEvenAnalysis, formatNumber, formatPhp),
    [breakEvenAnalysis]
  );

  return {
    inferredVariableCostByProduct,
    step1Data,
    unitsData,
    profitAnalysis,
    breakEvenAnalysis,
    graphData,
    graphPathData,
    weightedBreakEvenSummary,
    weightedBreakEvenTotals,
    materialProcurementRecommendations,
    step8ProfitDisplay,
    profitabilityStatus,
    breakEvenInsight
  };
}
