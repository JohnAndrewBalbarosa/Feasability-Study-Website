import UserErrorPanel from "@/components/UserErrorPanel";

import { formatNumber, formatPhp } from "../../formatters";
import type { BreakEvenAnalysis } from "../../types";
import PlainLanguageBox from "../ui/PlainLanguageBox";
import ProgressMeter from "../ui/ProgressMeter";
import { PLAIN_EXPLANATIONS } from "../../copy";

type Props = {
  breakEvenAnalysis: BreakEvenAnalysis | null;
  breakEvenInsight: string;
  unitsSoldTotal?: number;
};

export default function Step5Section({ breakEvenAnalysis, breakEvenInsight, unitsSoldTotal }: Props) {
  return (
    <div>
      <PlainLanguageBox title="What this means">{PLAIN_EXPLANATIONS.step5}</PlainLanguageBox>

      {!breakEvenAnalysis ? (
        <UserErrorPanel title="Step 5 Needs Prior Data" message="Complete Steps 1 to 4 first." />
      ) : !breakEvenAnalysis.canCompute ? (
        <UserErrorPanel
          title="Break-Even Not Reachable"
          message="Provide at least one positive Units Sold value and ensure weighted contribution margin is positive."
        />
      ) : (
        <>
          {unitsSoldTotal !== undefined && (
            <ProgressMeter current={unitsSoldTotal} target={breakEvenAnalysis.breakEvenUnits} label="Your progress toward break-even" />
          )}

          <details className="detail-toggle">
            <summary>Show exact numbers</summary>
            <div className="table-wrap">
              <table className="ops-table">
                <caption className="visually-hidden">Break-even analysis with exact values</caption>
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td scope="row">Units you must sell to cover all costs</td>
                    <td>{formatNumber(breakEvenAnalysis.breakEvenUnits)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Sales amount needed to cover all costs</td>
                    <td>{formatPhp(breakEvenAnalysis.breakEvenRevenue)}</td>
                  </tr>
                  <tr>
                    <td scope="row">Average profit earned per item sold</td>
                    <td>{formatPhp(breakEvenAnalysis.weightedAverageContributionMargin)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <p style={{ marginTop: "0.75rem" }}>{breakEvenInsight}</p>
    </div>
  );
}
