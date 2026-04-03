import { GRAPH_PADDING, SVG_HEIGHT, SVG_WIDTH } from "../constants";
import { createGraphPoints } from "../graph";
import type { BreakEvenAnalysis } from "../types";

export type GraphData = {
  points: Array<{ units: number; totalRevenue: number; totalCost: number }>;
  maxUnits: number;
  maxAmount: number;
};

export type GraphPathData = {
  revenuePath: string;
  costPath: string;
  breakEvenPoint: {
    x: number;
    y: number;
    units: number;
    amount: number;
  } | null;
};

export function buildGraphData(
  breakEvenAnalysis: BreakEvenAnalysis | null,
  fixedCostTotal: number | null
): GraphData | null {
  if (!breakEvenAnalysis || !breakEvenAnalysis.canCompute || !breakEvenAnalysis.totalUnitsSold || fixedCostTotal === null) {
    return null;
  }

  const { points, maxUnits, maxAmount } = createGraphPoints(
    fixedCostTotal,
    breakEvenAnalysis.weightedAverageSellingPrice,
    breakEvenAnalysis.weightedAverageVariableCost,
    breakEvenAnalysis.breakEvenUnits,
    breakEvenAnalysis.totalUnitsSold
  );

  return { points, maxUnits, maxAmount };
}

export function buildGraphPathData(graphData: GraphData | null, breakEvenAnalysis: BreakEvenAnalysis | null): GraphPathData | null {
  if (!graphData) {
    return null;
  }

  const toX = (units: number) => GRAPH_PADDING + (units / graphData.maxUnits) * (SVG_WIDTH - GRAPH_PADDING * 2);
  const toY = (amount: number) => SVG_HEIGHT - GRAPH_PADDING - (amount / graphData.maxAmount) * (SVG_HEIGHT - GRAPH_PADDING * 2);

  const revenuePath = graphData.points.map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.units)} ${toY(point.totalRevenue)}`).join(" ");
  const costPath = graphData.points.map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.units)} ${toY(point.totalCost)}`).join(" ");

  const breakEvenPoint =
    breakEvenAnalysis && Number.isFinite(breakEvenAnalysis.breakEvenUnits)
      ? {
          x: toX(breakEvenAnalysis.breakEvenUnits),
          y: toY(breakEvenAnalysis.breakEvenRevenue),
          units: breakEvenAnalysis.breakEvenUnits,
          amount: breakEvenAnalysis.breakEvenRevenue
        }
      : null;

  return {
    revenuePath,
    costPath,
    breakEvenPoint
  };
}
