import { formatNumber } from "../../formatters";
import type { WeightedBreakEvenSummary } from "../../types";

type Props = {
  weightedBreakEvenSummary: WeightedBreakEvenSummary;
};

export default function Step8WeightedRowsTable({ weightedBreakEvenSummary }: Props) {
  return (
    <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Required Units (Weighted BE)</th>
            <th>Actual Units Sold Today</th>
            <th>Status</th>
            <th>Deficit Units</th>
          </tr>
        </thead>
        <tbody>
          {weightedBreakEvenSummary.rows.map((row) => (
            <tr key={`weighted-row-${row.productName}`}>
              <td>{row.productName}</td>
              <td>{formatNumber(row.weightedBreakEvenUnits)}</td>
              <td>{formatNumber(row.actualUnitsSoldToday)}</td>
              <td>{row.status}</td>
              <td>{row.status === "needs more sales" ? formatNumber(row.deficitUnits) : "0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
