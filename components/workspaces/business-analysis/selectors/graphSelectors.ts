import { GRAPH_PADDING, SVG_HEIGHT, SVG_WIDTH } from "../constants";
import { createGraphPoints } from "../graph";
import type { BreakEvenAnalysis } from "../types";

type ZonePaths = {
  lossZonePath: string;
  profitZonePath: string;
  lossCentroid: { x: number; y: number };
  profitCentroid: { x: number; y: number };
};

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

export function buildZonePaths(graphData: GraphData, breakEvenPoint: GraphPathData["breakEvenPoint"]): ZonePaths | null {
  if (!breakEvenPoint) return null;

  const toX = (units: number) => GRAPH_PADDING + (units / graphData.maxUnits) * (SVG_WIDTH - GRAPH_PADDING * 2);
  const toY = (amount: number) => SVG_HEIGHT - GRAPH_PADDING - (amount / graphData.maxAmount) * (SVG_HEIGHT - GRAPH_PADDING * 2);

  const bepEntry = { units: breakEvenPoint.units, totalRevenue: breakEvenPoint.amount, totalCost: breakEvenPoint.amount };

  const leftPoints = [...graphData.points.filter((p) => p.units <= breakEvenPoint.units), bepEntry];
  const rightPoints = [bepEntry, ...graphData.points.filter((p) => p.units >= breakEvenPoint.units)];

  const fmt = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

  const lossForward = leftPoints.map((p) => fmt(toX(p.units), toY(p.totalCost))).join(" L ");
  const lossBack = [...leftPoints].reverse().map((p) => fmt(toX(p.units), toY(p.totalRevenue))).join(" L ");
  const lossZonePath = `M ${lossForward} L ${lossBack} Z`;

  const profitForward = rightPoints.map((p) => fmt(toX(p.units), toY(p.totalRevenue))).join(" L ");
  const profitBack = [...rightPoints].reverse().map((p) => fmt(toX(p.units), toY(p.totalCost))).join(" L ");
  const profitZonePath = `M ${profitForward} L ${profitBack} Z`;

  const bepX = toX(breakEvenPoint.units);
  const plotLeft = toX(0);
  const plotRight = toX(graphData.maxUnits);
  const midY = (GRAPH_PADDING + SVG_HEIGHT - GRAPH_PADDING) / 2;

  return {
    lossZonePath,
    profitZonePath,
    lossCentroid: { x: (plotLeft + bepX) / 2, y: midY },
    profitCentroid: { x: (bepX + plotRight) / 2, y: midY },
  };
}
