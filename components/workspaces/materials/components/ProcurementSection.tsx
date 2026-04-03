import type { ProcurementRow } from "../types";

type ProcurementSectionProps = {
  procurementRows: ProcurementRow[];
  onUpdateProcurementRow: (id: string, field: keyof ProcurementRow, value: string) => void;
  onRemoveProcurementRow: (id: string) => void;
  onAddProcurementRow: () => void;
};

export default function ProcurementSection({
  procurementRows,
  onUpdateProcurementRow,
  onRemoveProcurementRow,
  onAddProcurementRow
}: ProcurementSectionProps) {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h2>Procurement Data</h2>
      <p className="muted">Required structure: Material | Unit | Total Available | Total Procurement Cost (PHP)</p>

      <div className="table-wrap" style={{ marginTop: "0.7rem" }}>
        <table className="ops-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Unit</th>
              <th>Total Available</th>
              <th>Total Procurement Cost (PHP)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {procurementRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.material}
                    onChange={(event) => onUpdateProcurementRow(row.id, "material", event.target.value)}
                    placeholder="Example: Sugar"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(event) => onUpdateProcurementRow(row.id, "unit", event.target.value)}
                    placeholder="kg, g, ml, pcs"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.totalAvailable}
                    onChange={(event) => onUpdateProcurementRow(row.id, "totalAvailable", event.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.totalProcurementCost}
                    onChange={(event) => onUpdateProcurementRow(row.id, "totalProcurementCost", event.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onRemoveProcurementRow(row.id)}
                    disabled={procurementRows.length <= 1}
                    style={{ maxWidth: "130px" }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={onAddProcurementRow} style={{ marginTop: "0.75rem", maxWidth: "240px" }}>
        Add Procurement Row
      </button>
    </section>
  );
}
