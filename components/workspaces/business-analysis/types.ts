export type ProductRow = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: string;
  variableCost: string;
  unitsSoldToday: string;
};

export type CostRow = {
  id: string;
  costName: string;
  amount: string;
  isBudget?: boolean;
};

export type ParsedProduct = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: number;
  variableCost: number;
  contributionMargin: number;
  contributionMarginRatio: number;
};

export type ParsedCost = {
  id: string;
  costName: string;
  amount: number;
  isBudget: boolean;
};

export type Step1Data = {
  errors: string[];
  parsedProducts: ParsedProduct[];
  parsedCosts: ParsedCost[];
  budget: number | null;
  fixedCostTotal: number | null;
};

export type UnitsData = {
  errors: string[];
  unitsByProductId: Map<string, number>;
};

export type ProfitAnalysis = {
  rows: Array<{
    productName: string;
    unitsSold: number;
    revenue: number;
    variableCost: number;
    contributionMargin: number;
  }>;
  totalRevenue: number;
  totalVariableCost: number;
  totalContributionMargin: number;
  netProfit: number;
  totalUnitsSold: number;
};

export type BreakEvenAnalysis = {
  canCompute: boolean;
  weightedAverageContributionMargin: number;
  weightedAverageSellingPrice: number;
  weightedAverageVariableCost: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  totalUnitsSold: number;
};

export type GraphPoint = {
  units: number;
  totalRevenue: number;
  totalCost: number;
};

export type WeightedBreakEvenRow = {
  productName: string;
  revenuePerItem: number;
  actualUnitsSoldToday: number;
  salesRatio: number;
  weightedBreakEvenUnits: number;
  weightedTargetProfit: number;
  status: "needs more sales" | "meets requirement";
  deficitUnits: number;
  revenueToday: number;
  profitToday: number;
};

export type WeightedBreakEvenSummary = {
  totalUnitsToday: number;
  totalBreakEvenUnits: number;
  rows: WeightedBreakEvenRow[];
};

export type MaterialProcurementRecommendation = {
  material: string;
  requiredQuantity: number;
};

export type ProcurementRow = {
  id: string;
  material: string;
  unit: string;
  totalAvailable: string;
  totalProcurementCost: string;
};

export type LatestBusinessSnapshotResponse = {
  business?: {
    products?: Array<{
      productName?: string;
      packSize?: string;
      sellingPrice?: number;
      unitsSoldToday?: number;
    }>;
    costRows?: Array<{
      costName?: string;
      amount?: number;
      isBudget?: boolean;
    }>;
  };
  materials?: Array<{
    product?: string;
    material?: string;
    quantityNeededPerProduct?: number;
  }>;
  procurement?: Array<{
    material?: string;
    unit?: string;
    totalAvailable?: number;
    totalProcurementCost?: number;
  }>;
};

export type SaveStatus = {
  state: "idle" | "saving" | "success" | "error";
  message: string;
};
