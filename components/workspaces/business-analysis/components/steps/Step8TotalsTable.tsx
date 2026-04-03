import { formatNumber, formatPhp } from "../../formatters";
import type { WeightedBreakEvenSummary } from "../../types";
import type { WeightedBreakEvenTotals } from "../../selectors/weightedSelectors";

type Props = {
  weightedBreakEvenSummary: WeightedBreakEvenSummary;
  weightedBreakEvenTotals: WeightedBreakEvenTotals;
  step8ProfitDisplay: { label: string; amount: number } | null;
};

export default function Step8TotalsTable({ weightedBreakEvenSummary, weightedBreakEvenTotals, step8ProfitDisplay }: Props) {
  return (
    <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Final Totals</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Units Sold Today</td>
            <td>{formatNumber(weightedBreakEvenSummary.totalUnitsToday)}</td>
          </tr>
          <tr>
            <td>Total Break-even Units</td>
            <td>{formatNumber(weightedBreakEvenSummary.totalBreakEvenUnits)}</td>
          </tr>
          <tr>
            <td>Total Deficit Units</td>
            <td>{formatNumber(weightedBreakEvenTotals.totalDeficitUnits)}</td>
          </tr>
          <tr>
            <td>Products Needing More Sales</td>
            <td>{formatNumber(weightedBreakEvenTotals.productsNeedingMoreSales)}</td>
          </tr>
          <tr>
            <td>Total Revenue Today</td>
            <td>{formatPhp(weightedBreakEvenTotals.totalRevenueToday)}</td>
          </tr>
          <tr>
            <td>{step8ProfitDisplay?.label ?? "Total Profit"}</td>
            <td>{formatPhp(step8ProfitDisplay?.amount ?? 0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
