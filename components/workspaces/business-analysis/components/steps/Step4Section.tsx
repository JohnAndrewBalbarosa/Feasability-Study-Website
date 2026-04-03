import UserErrorPanel from "@/components/UserErrorPanel";

import { formatPhp } from "../../formatters";
import type { ProfitAnalysis, Step1Data } from "../../types";

type Props = {
  profitAnalysis: ProfitAnalysis | null;
  step1Data: Step1Data;
  profitabilityStatus: string;
};

export default function Step4Section({ profitAnalysis, step1Data, profitabilityStatus }: Props) {
  return (
    <div>
      <div className="formula-box">
        <p>Compact formula set:</p>
        <p>Revenue = sum(Price x Units), Variable Cost = sum(Var Cost x Units), Net Profit = Revenue - Variable Cost - Fixed Cost.</p>
      </div>

      {!profitAnalysis || step1Data.fixedCostTotal === null ? (
        <UserErrorPanel title="Step 4 Needs Valid Inputs" message="Complete Step 1 and Step 3 with valid values before profit analysis." />
      ) : (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value (PHP)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue</td>
                <td>{formatPhp(profitAnalysis.totalRevenue)}</td>
              </tr>
              <tr>
                <td>Total Variable Cost</td>
                <td>{formatPhp(profitAnalysis.totalVariableCost)}</td>
              </tr>
              <tr>
                <td>Total Contribution Margin</td>
                <td>{formatPhp(profitAnalysis.totalContributionMargin)}</td>
              </tr>
              <tr>
                <td>Total Fixed Cost</td>
                <td>{formatPhp(step1Data.fixedCostTotal)}</td>
              </tr>
              <tr>
                <td>Net Profit</td>
                <td>{formatPhp(profitAnalysis.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {profitAnalysis ? (
        <p style={{ marginTop: "0.75rem" }}>
          Interpretation: <strong>{profitabilityStatus}</strong>
        </p>
      ) : null}
    </div>
  );
}
