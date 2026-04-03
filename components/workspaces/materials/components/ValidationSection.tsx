import UserErrorPanel from "@/components/UserErrorPanel";

import { formatPhp } from "../formatters";
import type { ProcurementSummaryRow } from "../types";

type ValidationSectionProps = {
  showValidation: boolean;
  errors: string[];
  procurementSummary: ProcurementSummaryRow[];
  onRunValidation: () => void;
};

export default function ValidationSection({
  showValidation,
  errors,
  procurementSummary,
  onRunValidation
}: ValidationSectionProps) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h2>Validation</h2>
      <button type="button" onClick={onRunValidation} style={{ maxWidth: "250px" }}>
        Validate Material + Procurement Data
      </button>

      {showValidation ? (
        errors.length > 0 ? (
          <UserErrorPanel title="Validation Failed" message={errors.join(" ")} />
        ) : (
          <div className="formula-box" style={{ marginTop: "0.75rem" }}>
            <p>System completeness status: Complete for material + procurement pages.</p>
            <p>Material-to-cost readiness: Ready for weighted break-even based procurement planning.</p>
          </div>
        )
      ) : null}

      {procurementSummary.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Unit</th>
                <th>Total Available</th>
                <th>Total Procurement Cost</th>
                <th>Cost per Unit</th>
              </tr>
            </thead>
            <tbody>
              {procurementSummary.map((row) => (
                <tr key={`summary-${row.material}`}>
                  <td>{row.material}</td>
                  <td>{row.unit}</td>
                  <td>{row.totalAvailable.toLocaleString("en-PH")}</td>
                  <td>{formatPhp(row.totalProcurementCost)}</td>
                  <td>
                    {formatPhp(row.costPerUnit)} / {row.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
