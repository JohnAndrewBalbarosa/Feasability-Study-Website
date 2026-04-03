import { asNumber } from "./formatters";
import type { AnalyticsRow, AnalyticsTotals, BasisRecord, DeleteModalRow } from "./types";

function resolveProfitValue(item: BasisRecord["data"][number]): number {
  const revenuePerItem = asNumber(item.revenuePerItem);
  const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
  const weightedTargetProfit =
    typeof item.weightedTargetProfit === "number" || typeof item.weightedTargetProfit === "string"
      ? asNumber(item.weightedTargetProfit)
      : weightedBreakEvenUnits * revenuePerItem;
  const revenueToday = asNumber(item.revenueToday);
  const hasProfitField = typeof item.profitToday === "number" || typeof item.profitToday === "string";
  return hasProfitField ? asNumber(item.profitToday) : weightedTargetProfit - revenueToday;
}

export function buildDeleteModalRows(records: BasisRecord[]): DeleteModalRow[] {
  return records.map((record) => {
    const revenueTotal = record.data.reduce((sum, item) => sum + asNumber(item.revenueToday), 0);
    const profitTotal = record.data.reduce((sum, item) => sum + resolveProfitValue(item), 0);

    return {
      id: record.id,
      date: new Date(record.created_at).toLocaleString(),
      productsCount: record.data.length,
      revenueTotal,
      profitTotal: -profitTotal
    };
  });
}

export function buildAnalyticsRows(records: BasisRecord[]): AnalyticsRow[] {
  const rows: AnalyticsRow[] = [];

  records.forEach((record) => {
    const dateText = new Date(record.created_at).toLocaleString();
    const groupSize = record.data.length;
    const recordRevenueTotal = record.data.reduce((sum, item) => sum + asNumber(item.revenueToday), 0);
    const recordProfitTotal = record.data.reduce((sum, item) => sum + resolveProfitValue(item), 0);

    record.data.forEach((item, index) => {
      const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
      const actualUnitsSoldToday = asNumber(item.actualUnitsSoldToday);
      const deficitUnits = asNumber(item.deficitUnits);
      const revenuePerItem = asNumber(item.revenuePerItem);
      const revenueToday = asNumber(item.revenueToday);
      const profitToday = resolveProfitValue(item);
      const neededContributionToBreakEven = deficitUnits > 0 ? -deficitUnits * revenuePerItem : 0;
      const status = -profitToday >= 0 && deficitUnits <= 0 ? "profit" : "loss";

      rows.push({
        key: `${record.id}-${index}`,
        recordId: record.id,
        date: dateText,
        showDateCell: index === 0,
        showRecordTotalsCell: index === 0,
        dateRowSpan: index === 0 ? groupSize : 0,
        productName: item.productName?.trim() || "Unnamed product",
        weightedBreakEvenUnits,
        actualUnitsSoldToday,
        deficitUnits,
        neededContributionToBreakEven,
        revenueToday,
        profitToday,
        recordRevenueTotal,
        recordProfitTotal,
        status
      });
    });
  });

  return rows;
}

export function buildAnalyticsTotals(rows: AnalyticsRow[]): AnalyticsTotals {
  return rows.reduce(
    (acc, row) => {
      acc.revenue += row.revenueToday;
      acc.profitSignal += -row.profitToday;
      acc.breakEvenUnits += row.weightedBreakEvenUnits;
      acc.soldUnits += row.actualUnitsSoldToday;
      acc.deficitUnits += row.deficitUnits;
      return acc;
    },
    {
      revenue: 0,
      profitSignal: 0,
      breakEvenUnits: 0,
      soldUnits: 0,
      deficitUnits: 0
    }
  );
}

export function getResultHeaderLabel(rows: AnalyticsRow[]): string {
  if (rows.length === 0) {
    return "Needed Contribution To Break-even";
  }

  const allNegativeContribution = rows.every((row) => row.neededContributionToBreakEven < 0);
  const allPositiveOrZeroContribution = rows.every((row) => row.neededContributionToBreakEven >= 0);

  if (allNegativeContribution) {
    return "Needed Contribution To Break-even";
  }

  if (allPositiveOrZeroContribution) {
    return "Profit";
  }

  return "Needed Contribution To Break-even / Profit";
}
