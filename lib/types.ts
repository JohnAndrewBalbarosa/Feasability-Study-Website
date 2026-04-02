export type ProcurementInput = {
  sourceName: string;
  marketPrice: number;
  quantityAvailable: number;
};

export type CostModel = {
  fixedCost: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
};

export type BreakEvenResult = {
  breakEvenPointUnits: number;
  breakEvenRevenue: number;
  contributionMargin: number;
  status: "reachable" | "unreachable";
  computedAt: string;
  cacheKey: string;
};

export type DemandForecast = {
  low: number;
  expected: number;
  high: number;
};

export type ForecastResult = {
  productionRecommendation: number;
  demandForecast: DemandForecast;
  pricingInsights: string;
  marketSignalSummary: string;
  promptVersion: string;
  generatedAt: string;
};

export type ProcurementDecision = {
  targetRawUnits: number;
  strategy: string;
};

export type PipelineFinalizeInput = {
  pipelineVersion: string;
  budgetAvailable: number;
  conversionRateRawToProduct: number;
  bundleSize: number;
  marketPrices: ProcurementInput[];
  costModel: CostModel;
  breakEvenResult: BreakEvenResult;
  forecastResult: ForecastResult;
  procurementDecision: ProcurementDecision;
};

export type ProcurementPlanItem = ProcurementInput & {
  quantityPurchased: number;
  transactionCost: number;
};

export type ProcurementPlan = {
  supplierMix: ProcurementPlanItem[];
  totalSpend: number;
  rawQuantityPurchased: number;
};

export type ProductionPlan = {
  producibleUnits: number;
  forecastedDemand: DemandForecast;
  demandGap: number;
};

export type FinalPipelineOutput = {
  breakEvenResult: BreakEvenResult;
  forecastResult: ForecastResult;
  procurementPlan: ProcurementPlan;
  productionPlan: ProductionPlan;
  expectedProfitOrLoss: number;
  recommendedProductionQuantity: number;
  breakEvenPointUnits: number;
  breakEvenRevenue: number;
  procurementLogs: ProcurementPlanItem[];
  budgetUsage: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  costPerUnit: number;
  packagingDistribution: {
    bundleSize: number;
    fullPackages: number;
    remainderUnits: number;
  };
  profitCurveGraph: Array<{ units: number; profit: number }>;
  aiRecommendations: {
    procurementStrategy: string;
    pricingAdjustment: string;
    explanation: string;
  };
  generatedAt: string;
  pipelineVersion: string;
};
