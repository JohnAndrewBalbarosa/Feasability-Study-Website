import UserErrorPanel from "@/components/UserErrorPanel";

import { formatPhp } from "../../formatters";
import type { ProfitAnalysis, Step1Data } from "../../types";
import BarFlow from "../ui/BarFlow";
import PlainLanguageBox from "../ui/PlainLanguageBox";
import { PLAIN_EXPLANATIONS } from "../../copy";

type Props = {
  profitAnalysis: ProfitAnalysis | null;
  step1Data: Step1Data;
  profitabilityStatus: string;
};

export default function Step4Section({ profitAnalysis, step1Data, profitabilityStatus }: Props) {
  return (
    <div>
      <PlainLanguageBox title="What this means">{PLAIN_EXPLANATIONS.step4}</PlainLanguageBox>

      {!profitAnalysis || step1Data.fixedCostTotal === null ? (
        <UserErrorPanel title="Step 4 Needs Valid Inputs" message="Complete Step 1 and Step 3 with valid values before profit analysis." />
      ) : (
        <>
          <BarFlow
            max={profitAnalysis.totalRevenue > 0 ? profitAnalysis.totalRevenue : 1}
            steps={[
              { label: "Money In (Sales)", value: profitAnalysis.totalRevenue, tone: "revenue" },
              { label: "− Cost of Items Sold", value: profitAnalysis.totalVariableCost, tone: "varcost" },
              { label: "− Fixed Monthly Costs", value: step1Data.fixedCostTotal, tone: "fixed" },
              {
                label: profitAnalysis.netProfit >= 0 ? "= You Keep (Profit)" : "= You Lost (Loss)",
                value: Math.abs(profitAnalysis.netProfit),
                tone: profitAnalysis.netProfit >= 0 ? "positive" : "negative",
              },
            ]}
          />

          <details className="detail-toggle">
            <summary>Show exact numbers</summary>
            <div className="table-wrap">
              <table className="ops-table">
                <caption className="visually-hidden">Profit analysis breakdown with exact monetary values</caption>
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Value (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td scope="row">Total Revenue</td>
                    <td>{formatPhp(profitAnalysis.totalRevenue)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Total Variable Cost</td>
                    <td>{formatPhp(profitAnalysis.totalVariableCost)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Money Left After Item Costs (Contribution Margin)</td>
                    <td>{formatPhp(profitAnalysis.totalContributionMargin)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Total Fixed Cost</td>
                    <td>{formatPhp(step1Data.fixedCostTotal)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Net Profit</td>
                    <td>{formatPhp(profitAnalysis.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      {profitAnalysis ? (
        <p style={{ marginTop: "0.75rem" }}>
          Interpretation: <strong>{profitabilityStatus}</strong>
        </p>
      ) : null}
    </div>
  );
}
