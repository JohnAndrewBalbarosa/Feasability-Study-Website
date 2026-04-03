import UserErrorPanel from "@/components/UserErrorPanel";

import { formatNumber, formatPhp } from "../../formatters";
import type { BreakEvenAnalysis } from "../../types";

type Props = {
  breakEvenAnalysis: BreakEvenAnalysis | null;
  breakEvenInsight: string;
};

export default function Step5Section({ breakEvenAnalysis, breakEvenInsight }: Props) {
  return (
    <div>
      <div className="formula-box">
        <p>Compact break-even formulas:</p>
        <p>Weighted CM = sum(Product CM x Sales Mix), BE Units = Fixed Cost / Weighted CM, BE Revenue = BE Units x Weighted Selling Price.</p>
      </div>

      {!breakEvenAnalysis ? (
        <UserErrorPanel title="Step 5 Needs Prior Data" message="Complete Steps 1 to 4 first." />
      ) : !breakEvenAnalysis.canCompute ? (
        <UserErrorPanel
          title="Break-Even Not Reachable"
          message="Provide at least one positive Units Sold value and ensure weighted contribution margin is positive."
        />
      ) : (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Break-even units</td>
                <td>{formatNumber(breakEvenAnalysis.breakEvenUnits)}</td>
              </tr>
              <tr>
                <td>Break-even revenue</td>
                <td>{formatPhp(breakEvenAnalysis.breakEvenRevenue)}</td>
              </tr>
              <tr>
                <td>Weighted average contribution margin</td>
                <td>{formatPhp(breakEvenAnalysis.weightedAverageContributionMargin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: "0.75rem" }}>{breakEvenInsight}</p>
    </div>
  );
}
