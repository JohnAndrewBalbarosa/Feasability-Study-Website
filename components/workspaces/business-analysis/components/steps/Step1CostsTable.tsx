import type { CostRow } from "../../types";

type Props = {
  costRows: CostRow[];
  onUpdateCostRow: (id: string, field: keyof CostRow, value: string) => void;
  onRemoveCostRow: (id: string) => void;
};

export default function Step1CostsTable({ costRows, onUpdateCostRow, onRemoveCostRow }: Props) {
  return (
    <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Cost Name</th>
            <th>Amount (PHP)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {costRows.map((cost) => (
            <tr key={cost.id}>
              <td>
                <input
                  type="text"
                  value={cost.costName}
                  onChange={(event) => onUpdateCostRow(cost.id, "costName", event.target.value)}
                  placeholder={cost.isBudget ? "Budget (overall constraint)" : "Cost name"}
                  disabled={Boolean(cost.isBudget)}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost.amount}
                  onChange={(event) => onUpdateCostRow(cost.id, "amount", event.target.value)}
                  placeholder="0.00"
                />
              </td>
              <td>
                {cost.isBudget ? (
                  <span className="muted">Required row</span>
                ) : (
                  <button type="button" onClick={() => onRemoveCostRow(cost.id)} style={{ maxWidth: "140px" }}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
