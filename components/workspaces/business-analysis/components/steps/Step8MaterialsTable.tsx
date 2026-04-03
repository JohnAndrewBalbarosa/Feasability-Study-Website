import { formatNumber } from "../../formatters";
import type { MaterialProcurementRecommendation } from "../../types";

type Props = {
  materialProcurementRecommendations: MaterialProcurementRecommendation[];
};

export default function Step8MaterialsTable({ materialProcurementRecommendations }: Props) {
  return (
    <div style={{ marginTop: "0.85rem" }}>
      <p>Based on this, you should procure the following quantities of materials:</p>
      {materialProcurementRecommendations.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: "0.55rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Required Quantity</th>
              </tr>
            </thead>
            <tbody>
              {materialProcurementRecommendations.map((row) => (
                <tr key={`material-plan-${row.material}`}>
                  <td>{row.material}</td>
                  <td>{formatNumber(row.requiredQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">materials_data is unavailable or incomplete, so material procurement quantities are skipped.</p>
      )}
    </div>
  );
}
