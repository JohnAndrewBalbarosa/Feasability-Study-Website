export type BasisDataRow = {
  productName?: string;
  revenuePerItem?: number;
  weightedBreakEvenUnits?: number;
  weightedTargetProfit?: number;
  actualUnitsSoldToday?: number;
  deficitUnits?: number;
  revenueToday?: number;
  profitToday?: number;
};

export type BasisRecord = {
  id: string;
  created_at: string;
  data: BasisDataRow[];
};

export type AnalyticsRow = {
  key: string;
  recordId: string;
  date: string;
  showDateCell: boolean;
  showRecordTotalsCell: boolean;
  dateRowSpan: number;
  productName: string;
  weightedBreakEvenUnits: number;
  actualUnitsSoldToday: number;
  deficitUnits: number;
  neededContributionToBreakEven: number;
  revenueToday: number;
  profitToday: number;
  recordRevenueTotal: number;
  recordProfitTotal: number;
  status: "profit" | "loss";
};

export type DeleteModalRow = {
  id: string;
  date: string;
  productsCount: number;
  revenueTotal: number;
  profitTotal: number;
};

export type AnalyticsTotals = {
  revenue: number;
  profitSignal: number;
  breakEvenUnits: number;
  soldUnits: number;
  deficitUnits: number;
};
