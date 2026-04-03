import UserErrorPanel from "@/components/UserErrorPanel";

import { formatNumber, formatPhp } from "../../formatters";
import type { WeightedBreakEvenSummary } from "../../types";

type Props = {
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null;
};

export default function Step7Section({ weightedBreakEvenSummary }: Props) {
  return (
    <div>
      <p className="muted">Compact view: this step shows daily revenue by product only. Profit and break-even requirement are summarized in Steps 4 and 8.</p>

      {!weightedBreakEvenSummary ? (
        <UserErrorPanel
          title="Step 7 Needs Weighted Sales Data"
          message="Complete prior steps and provide valid today sales values to compute per-product revenue insights."
        />
      ) : (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity Sold Today</th>
                <th>Revenue Today</th>
              </tr>
            </thead>
            <tbody>
              {weightedBreakEvenSummary.rows.map((row) => (
                <tr key={`revenue-row-${row.productName}`}>
                  <td>{row.productName}</td>
                  <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                  <td>{formatPhp(row.revenueToday)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
