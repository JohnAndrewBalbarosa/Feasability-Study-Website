import type { FinalPipelineOutput, PipelineFinalizeInput, ProcurementPlanItem } from "@/lib/types";

function computeProcurementPlan(input: PipelineFinalizeInput): { plan: ProcurementPlanItem[]; remainingBudget: number } {
  const sortedSources = [...input.marketPrices].sort((a, b) => a.marketPrice - b.marketPrice);
  let budgetLeft = input.budgetAvailable;
  const rawUnitsNeeded = input.procurementDecision.targetRawUnits;
  let rawUnitsPurchased = 0;

  const plan: ProcurementPlanItem[] = [];
  for (const source of sortedSources) {
    if (budgetLeft <= 0 || rawUnitsPurchased >= rawUnitsNeeded) {
      break;
    }

    const remainingRawUnits = rawUnitsNeeded - rawUnitsPurchased;
    const maxAffordableQty = Math.floor(budgetLeft / source.marketPrice);
    const quantityPurchased = Math.max(0, Math.min(source.quantityAvailable, maxAffordableQty, remainingRawUnits));
    const transactionCost = quantityPurchased * source.marketPrice;

    plan.push({
      ...source,
      quantityPurchased,
      transactionCost
    });

    budgetLeft -= transactionCost;
    rawUnitsPurchased += quantityPurchased;
  }

  return { plan, remainingBudget: budgetLeft };
}

function makeProfitCurve(costPerUnit: number, fixedCost: number, sellingPricePerUnit: number) {
  const points: Array<{ units: number; profit: number }> = [];
  for (let units = 0; units <= 1000; units += 100) {
    const revenue = units * sellingPricePerUnit;
    const totalCost = fixedCost + units * costPerUnit;
    points.push({ units, profit: revenue - totalCost });
  }
  return points;
}

export function runFinalizedPipeline(input: PipelineFinalizeInput): FinalPipelineOutput {
  const { plan: procurementLogs, remainingBudget } = computeProcurementPlan(input);
  const procurementSpend = procurementLogs.reduce((sum, item) => sum + item.transactionCost, 0);
  const rawQuantity = procurementLogs.reduce((sum, item) => sum + item.quantityPurchased, 0);

  const recommendedProductionQuantity = Math.floor(rawQuantity * input.conversionRateRawToProduct);
  const variableCostPerUnit = recommendedProductionQuantity > 0 ? procurementSpend / recommendedProductionQuantity : input.costModel.variableCostPerUnit;

  const revenueAtRecommended = recommendedProductionQuantity * input.costModel.sellingPricePerUnit;
  const totalCostAtRecommended = input.costModel.fixedCost + recommendedProductionQuantity * variableCostPerUnit;
  const expectedProfitOrLoss = revenueAtRecommended - totalCostAtRecommended;

  const fullPackages = Math.floor(recommendedProductionQuantity / input.bundleSize);
  const remainderUnits = recommendedProductionQuantity % input.bundleSize;
  const forecastedDemand = input.forecastResult.demandForecast;
  const demandGap = recommendedProductionQuantity - forecastedDemand.expected;

  return {
    breakEvenResult: input.breakEvenResult,
    forecastResult: input.forecastResult,
    procurementPlan: {
      supplierMix: procurementLogs,
      totalSpend: procurementSpend,
      rawQuantityPurchased: rawQuantity
    },
    productionPlan: {
      producibleUnits: recommendedProductionQuantity,
      forecastedDemand,
      demandGap
    },
    pipelineVersion: input.pipelineVersion,
    recommendedProductionQuantity,
    breakEvenPointUnits: input.breakEvenResult.breakEvenPointUnits,
    breakEvenRevenue: input.breakEvenResult.breakEvenRevenue,
    expectedProfitOrLoss,
    procurementLogs,
    budgetUsage: {
      allocated: input.budgetAvailable,
      spent: procurementSpend,
      remaining: remainingBudget
    },
    costPerUnit: variableCostPerUnit,
    packagingDistribution: {
      bundleSize: input.bundleSize,
      fullPackages,
      remainderUnits
    },
    profitCurveGraph: makeProfitCurve(variableCostPerUnit, input.costModel.fixedCost, input.costModel.sellingPricePerUnit),
    aiRecommendations: {
      procurementStrategy: procurementLogs.length > 0 ? `Allocate first purchases to ${procurementLogs[0].sourceName} then expand to secondary suppliers only if demand gap persists.` : "No procurement executed due to zero affordable quantity.",
      pricingAdjustment: `Keep selling price above ${(variableCostPerUnit * 1.2).toFixed(2)} and monitor volatility before discounting.`,
      explanation: "AI forecast determines demand target first; procurement and production then execute deterministically against that target."
    },
    generatedAt: new Date().toISOString()
  };
}
