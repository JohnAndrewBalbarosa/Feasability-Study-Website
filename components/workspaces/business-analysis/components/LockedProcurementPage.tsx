import { useRef } from "react";

import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";

import type { ProcurementRow } from "../types";

type LockedProcurementPageProps = {
  email: string | null;
  procurementRows: ProcurementRow[];
  onToggleLockMode: () => void;
  onSignOut: () => void;
  onUpdateProcurementRow: (id: string, field: keyof ProcurementRow, value: string) => void;
  onRemoveProcurementRow: (id: string) => void;
  onAddProcurementRow: () => void;
  onGoToStep3: () => void;
};

export default function LockedProcurementPage({
  email,
  procurementRows,
  onToggleLockMode,
  onSignOut,
  onUpdateProcurementRow,
  onRemoveProcurementRow,
  onAddProcurementRow,
  onGoToStep3
}: LockedProcurementPageProps) {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  return (
    <main ref={pageRef} className="page-shell">
      <section className="hero">
        <h1>UNLOCKED PAGE</h1>
        <p>Lock mode is active. This first page now serves as the editable Procurement page.</p>
        <div className="nav">
          <a href="/">Unlocked Page</a>
          <a href="/materials">Locked Page</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/about">About Developer</a>
          <button type="button" onClick={onToggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
            Disable Lock
          </button>
          <button type="button" onClick={onSignOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
            Sign Out ({email})
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>PROCUREMENT PAGE (UNLOCKED)</h2>
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

        <div className="wizard-nav" style={{ marginTop: "0.9rem" }}>
          <button type="button" onClick={onGoToStep3} style={{ maxWidth: "180px", justifySelf: "end" }}>
            Next Step (Go to Step 3)
          </button>
        </div>
      </section>
    </main>
  );
}
