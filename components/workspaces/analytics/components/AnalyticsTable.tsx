import { formatNumber, formatPhp, formatProfitLoss } from "../formatters";
import type { AnalyticsRow } from "../types";

type AnalyticsTableProps = {
  rows: AnalyticsRow[];
  resultHeaderLabel: string;
  isDeletingSelected: boolean;
  onOpenDeleteModal: () => void;
};

export default function AnalyticsTable({ rows, resultHeaderLabel, isDeletingSelected, onOpenDeleteModal }: AnalyticsTableProps) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h3>Per-product Detailed Analytics</h3>
      <p className="muted">Profit/Loss formula: Weighted Target Profit minus Revenue Today per item grouping.</p>
      <div style={{ marginTop: "0.75rem" }}>
        <button type="button" onClick={onOpenDeleteModal} disabled={isDeletingSelected}>
          Delete Multiple Records
        </button>
      </div>
      <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
        <table className="ops-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Record Revenue (Merged)</th>
              <th>Record Profit / Loss (Merged)</th>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Weighted Break-even Units</th>
              <th>Deficit Units</th>
              <th>{resultHeaderLabel}</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.status === "profit" ? "analytics-row-profit" : "analytics-row-loss"}>
                {row.showDateCell ? <td rowSpan={row.dateRowSpan}>{row.date}</td> : null}
                {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatPhp(row.recordRevenueTotal)}</td> : null}
                {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatProfitLoss(-row.recordProfitTotal)}</td> : null}
                <td>{row.productName}</td>
                <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                <td>{formatNumber(row.weightedBreakEvenUnits)}</td>
                <td>{formatNumber(row.deficitUnits)}</td>
                <td>{row.neededContributionToBreakEven < 0 ? formatPhp(row.neededContributionToBreakEven) : formatPhp(Math.max(-row.profitToday, 0))}</td>
                <td>{formatPhp(row.revenueToday)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
