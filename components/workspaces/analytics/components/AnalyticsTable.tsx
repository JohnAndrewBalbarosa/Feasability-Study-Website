import { formatNumber, formatPhp, formatProfitLoss } from "../formatters";
import type { AnalyticsRow } from "../types";
import StatusBadge from "../../business-analysis/components/ui/StatusBadge";

type AnalyticsTableProps = {
  rows: AnalyticsRow[];
  resultHeaderLabel: string;
  isDeletingSelected: boolean;
  onOpenDeleteModal: () => void;
};

export default function AnalyticsTable({ rows, resultHeaderLabel, isDeletingSelected, onOpenDeleteModal }: AnalyticsTableProps) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h3 id="analytics-table-heading">Per-product Detailed Analytics</h3>
      <p className="muted">
        Each row is one product for a given day. Green rows = profit or break-even. Red rows = you lost money that day.
      </p>
      <div style={{ marginTop: "0.75rem" }}>
        <button type="button" onClick={onOpenDeleteModal} disabled={isDeletingSelected}>
          Delete Multiple Records
        </button>
      </div>
      <div
        className="table-wrap"
        style={{ marginTop: "0.75rem" }}
        role="region"
        aria-labelledby="analytics-table-heading"
        tabIndex={0}
      >
        <table className="ops-table">
          <caption className="visually-hidden">
            Per-product analytics. Each row shows sales, profit or loss, and break-even progress for a product on a given date.
            Green rows indicate profit or break-even; red rows indicate a loss.
          </caption>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Date</th>
              <th scope="col">Day&apos;s Total Sales</th>
              <th scope="col">Day&apos;s Profit / Loss</th>
              <th scope="col">Product</th>
              <th scope="col">Items Sold</th>
              <th scope="col">Units Needed to Break Even</th>
              <th scope="col">Items Still Short</th>
              <th scope="col">{resultHeaderLabel}</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.status === "profit" ? "analytics-row-profit" : "analytics-row-loss"}>
                <td>
                  <StatusBadge status={row.status === "profit" ? "profit" : "loss"} />
                </td>
                {row.showDateCell ? <td rowSpan={row.dateRowSpan}>{row.date}</td> : null}
                {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatPhp(row.recordRevenueTotal)}</td> : null}
                {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatProfitLoss(-row.recordProfitTotal)}</td> : null}
                <td scope="row">{row.productName}</td>
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
