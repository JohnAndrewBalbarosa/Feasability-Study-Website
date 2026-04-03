import type { BreakEvenAnalysis, ProfitAnalysis, Step1Data, UnitsData } from "../types";

export function buildProfitAnalysis(step1Data: Step1Data, unitsData: UnitsData): ProfitAnalysis | null {
  if (step1Data.errors.length > 0 || step1Data.fixedCostTotal === null || unitsData.errors.length > 0) {
    return null;
  }

  const rows = step1Data.parsedProducts.map((product) => {
    const unitsSold = unitsData.unitsByProductId.get(product.id) ?? 0;
    const revenue = product.sellingPrice * unitsSold;
    const variableCost = product.variableCost * unitsSold;
    const contributionMargin = revenue - variableCost;

    return {
      productName: product.productName,
      unitsSold,
      revenue,
      variableCost,
      contributionMargin
    };
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalVariableCost = rows.reduce((sum, row) => sum + row.variableCost, 0);
  const totalContributionMargin = totalRevenue - totalVariableCost;
  const netProfit = totalContributionMargin - step1Data.fixedCostTotal;
  const totalUnitsSold = rows.reduce((sum, row) => sum + row.unitsSold, 0);

  return {
    rows,
    totalRevenue,
    totalVariableCost,
    totalContributionMargin,
    netProfit,
    totalUnitsSold
  };
}

export function buildBreakEvenAnalysis(
  profitAnalysis: ProfitAnalysis | null,
  step1Data: Step1Data,
  unitsData: UnitsData
): BreakEvenAnalysis | null {
  if (!profitAnalysis || step1Data.fixedCostTotal === null) {
    return null;
  }

  const totalUnitsSold = profitAnalysis.totalUnitsSold;
  if (totalUnitsSold <= 0) {
    return {
      canCompute: false,
      weightedAverageContributionMargin: 0,
      weightedAverageSellingPrice: 0,
      weightedAverageVariableCost: 0,
      breakEvenUnits: Number.POSITIVE_INFINITY,
      breakEvenRevenue: Number.POSITIVE_INFINITY,
      totalUnitsSold
    };
  }

  const weightedAverageContributionMargin =
    step1Data.parsedProducts.reduce((sum, product) => {
      const units = unitsData.unitsByProductId.get(product.id) ?? 0;
      return sum + product.contributionMargin * units;
    }, 0) / totalUnitsSold;

  const weightedAverageSellingPrice =
    step1Data.parsedProducts.reduce((sum, product) => {
      const units = unitsData.unitsByProductId.get(product.id) ?? 0;
      return sum + product.sellingPrice * units;
    }, 0) / totalUnitsSold;

  const weightedAverageVariableCost =
    step1Data.parsedProducts.reduce((sum, product) => {
      const units = unitsData.unitsByProductId.get(product.id) ?? 0;
      return sum + product.variableCost * units;
    }, 0) / totalUnitsSold;

  if (weightedAverageContributionMargin <= 0) {
    return {
      canCompute: false,
      weightedAverageContributionMargin,
      weightedAverageSellingPrice,
      weightedAverageVariableCost,
      breakEvenUnits: Number.POSITIVE_INFINITY,
      breakEvenRevenue: Number.POSITIVE_INFINITY,
      totalUnitsSold
    };
  }

  const breakEvenUnits = Math.ceil(step1Data.fixedCostTotal / weightedAverageContributionMargin);
  const breakEvenRevenue = breakEvenUnits * weightedAverageSellingPrice;

  return {
    canCompute: true,
    weightedAverageContributionMargin,
    weightedAverageSellingPrice,
    weightedAverageVariableCost,
    breakEvenUnits,
    breakEvenRevenue,
    totalUnitsSold
  };
}

export function getBreakEvenInsight(breakEvenAnalysis: BreakEvenAnalysis | null, formatNumber: (value: number) => string, formatPhp: (value: number) => string): string {
  return breakEvenAnalysis && breakEvenAnalysis.canCompute
    ? `Break-even is reached at approximately ${formatNumber(breakEvenAnalysis.breakEvenUnits)} units and ${formatPhp(breakEvenAnalysis.breakEvenRevenue)} revenue.`
    : "Break-even cannot be computed with the current sales mix. Increase contribution margin or units sold mix.";
}

export function getProfitabilityStatus(profitAnalysis: ProfitAnalysis | null): string {
  if (!profitAnalysis || !Number.isFinite(profitAnalysis.netProfit)) {
    return "Unavailable";
  }

  if (profitAnalysis.netProfit > 0) {
    return "PROFIT";
  }

  if (profitAnalysis.netProfit === 0) {
    return "BREAK EVEN";
  }

  return "LOSS";
}
