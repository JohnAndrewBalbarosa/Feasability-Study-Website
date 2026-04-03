import type { GraphPoint } from "./types";

export function createGraphPoints(
  fixedCostTotal: number,
  weightedAverageSellingPrice: number,
  weightedAverageVariableCost: number,
  breakEvenUnits: number,
  totalUnitsSold: number
): { points: GraphPoint[]; maxUnits: number; maxAmount: number } {
  const candidateMaxUnits = Number.isFinite(breakEvenUnits)
    ? Math.max(totalUnitsSold * 1.4, breakEvenUnits * 1.25, 10)
    : Math.max(totalUnitsSold * 1.6, 10);

  const maxUnits = Math.ceil(candidateMaxUnits);
  const points: GraphPoint[] = [];
  const slices = 12;

  for (let index = 0; index <= slices; index += 1) {
    const units = (maxUnits / slices) * index;
    const totalRevenue = weightedAverageSellingPrice * units;
    const totalCost = fixedCostTotal + weightedAverageVariableCost * units;
    points.push({ units, totalRevenue, totalCost });
  }

  const maxAmount = Math.max(...points.map((point) => Math.max(point.totalRevenue, point.totalCost)), fixedCostTotal, 1);
  return { points, maxUnits, maxAmount };
}
