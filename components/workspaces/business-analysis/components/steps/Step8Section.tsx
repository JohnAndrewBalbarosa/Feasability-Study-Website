import UserErrorPanel from "@/components/UserErrorPanel";

import type { MaterialProcurementRecommendation, SaveStatus, WeightedBreakEvenSummary } from "../../types";
import type { WeightedBreakEvenTotals } from "../../selectors/weightedSelectors";
import Step8MaterialsTable from "./Step8MaterialsTable";
import Step8TotalsTable from "./Step8TotalsTable";
import Step8WeightedRowsTable from "./Step8WeightedRowsTable";

type Props = {
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null;
  weightedBreakEvenTotals: WeightedBreakEvenTotals | null;
  step8ProfitDisplay: { label: string; amount: number } | null;
  materialProcurementRecommendations: MaterialProcurementRecommendation[];
  saveStatus: SaveStatus;
};

export default function Step8Section({
  weightedBreakEvenSummary,
  weightedBreakEvenTotals,
  step8ProfitDisplay,
  materialProcurementRecommendations,
  saveStatus
}: Props) {
  if (!weightedBreakEvenSummary) {
    return (
      <div>
        <UserErrorPanel
          title="Final Output Needs Weighted Break-Even Data"
          message="Complete prior steps and provide valid today sales values before generating final output."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="formula-box">
        <p>Compact final summary:</p>
        <p>Required units per product are weighted by today sales mix against total break-even units.</p>
      </div>

      {weightedBreakEvenTotals ? (
        <Step8TotalsTable
          weightedBreakEvenSummary={weightedBreakEvenSummary}
          weightedBreakEvenTotals={weightedBreakEvenTotals}
          step8ProfitDisplay={step8ProfitDisplay}
        />
      ) : null}

      <Step8WeightedRowsTable weightedBreakEvenSummary={weightedBreakEvenSummary} />
      <Step8MaterialsTable materialProcurementRecommendations={materialProcurementRecommendations} />

      {saveStatus.state === "success" || saveStatus.state === "error" ? (
        <p className="muted" style={{ marginTop: "0.85rem" }}>
          {saveStatus.message}
        </p>
      ) : null}
    </div>
  );
}
