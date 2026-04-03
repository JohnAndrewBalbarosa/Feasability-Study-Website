import { loadMaterialRequirements, normalizePlanningLabel } from "@/lib/planningStorage";

import type {
  BreakEvenAnalysis,
  MaterialProcurementRecommendation,
  Step1Data,
  UnitsData,
  WeightedBreakEvenRow,
  WeightedBreakEvenSummary
} from "../types";

export type WeightedBreakEvenTotals = {
  totalDeficitUnits: number;
  totalRevenueToday: number;
  totalProfitToday: number;
  productsNeedingMoreSales: number;
};

export function buildWeightedBreakEvenSummary(
  step1Data: Step1Data,
  unitsData: UnitsData,
  breakEvenAnalysis: BreakEvenAnalysis | null
): WeightedBreakEvenSummary | null {
  if (
    step1Data.errors.length > 0 ||
    unitsData.errors.length > 0 ||
    !breakEvenAnalysis ||
    !breakEvenAnalysis.canCompute ||
    !Number.isFinite(breakEvenAnalysis.breakEvenUnits)
  ) {
    return null;
  }

  const totalUnitsToday = step1Data.parsedProducts.reduce((sum, product) => sum + (unitsData.unitsByProductId.get(product.id) ?? 0), 0);
  if (totalUnitsToday <= 0) {
    return null;
  }

  const rows = step1Data.parsedProducts.map((product) => {
    const actualUnitsSoldToday = unitsData.unitsByProductId.get(product.id) ?? 0;
    const salesRatio = actualUnitsSoldToday / totalUnitsToday;
    const weightedBreakEvenUnits = salesRatio * breakEvenAnalysis.breakEvenUnits;
    const status: WeightedBreakEvenRow["status"] = actualUnitsSoldToday < weightedBreakEvenUnits ? "needs more sales" : "meets requirement";
    const deficitUnits = status === "needs more sales" ? weightedBreakEvenUnits - actualUnitsSoldToday : 0;
    const weightedTargetProfit = weightedBreakEvenUnits * product.sellingPrice;
    const revenueToday = actualUnitsSoldToday * product.sellingPrice;
    const profitToday = weightedTargetProfit - revenueToday;

    return {
      productName: product.productName,
      revenuePerItem: product.sellingPrice,
      actualUnitsSoldToday,
      salesRatio,
      weightedBreakEvenUnits,
      weightedTargetProfit,
      status,
      deficitUnits,
      revenueToday,
      profitToday
    };
  });

  return {
    totalUnitsToday,
    totalBreakEvenUnits: breakEvenAnalysis.breakEvenUnits,
    rows
  };
}

export function buildWeightedBreakEvenTotals(summary: WeightedBreakEvenSummary | null): WeightedBreakEvenTotals | null {
  if (!summary) {
    return null;
  }

  return {
    totalDeficitUnits: summary.rows.reduce((sum, row) => sum + row.deficitUnits, 0),
    totalRevenueToday: summary.rows.reduce((sum, row) => sum + row.revenueToday, 0),
    totalProfitToday: summary.rows.reduce((sum, row) => sum + row.profitToday, 0),
    productsNeedingMoreSales: summary.rows.filter((row) => row.status === "needs more sales").length
  };
}

export function buildMaterialProcurementRecommendations(summary: WeightedBreakEvenSummary | null): MaterialProcurementRecommendation[] {
  if (!summary) {
    return [];
  }

  const materialsData = loadMaterialRequirements();
  if (materialsData.length === 0) {
    return [];
  }

  const weightedUnitsByProduct = new Map<string, number>();
  summary.rows.forEach((row) => {
    weightedUnitsByProduct.set(normalizePlanningLabel(row.productName), row.weightedBreakEvenUnits);
  });

  const totalsByMaterial = new Map<string, MaterialProcurementRecommendation>();
  materialsData.forEach((materialRow) => {
    const productKey = normalizePlanningLabel(materialRow.product);
    const requiredUnits = weightedUnitsByProduct.get(productKey);
    if (requiredUnits === undefined) {
      return;
    }

    const materialKey = normalizePlanningLabel(materialRow.material);
    if (!materialKey) {
      return;
    }

    const requiredQuantity = requiredUnits * materialRow.quantityNeededPerProduct;
    const existing = totalsByMaterial.get(materialKey) ?? { material: materialRow.material.trim(), requiredQuantity: 0 };
    existing.requiredQuantity += requiredQuantity;
    totalsByMaterial.set(materialKey, existing);
  });

  return Array.from(totalsByMaterial.values())
    .filter((row) => row.requiredQuantity > 0)
    .sort((a, b) => a.material.localeCompare(b.material));
}
