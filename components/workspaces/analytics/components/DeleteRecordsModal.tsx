import { formatPhp, formatProfitLoss } from "../formatters";
import type { DeleteModalRow } from "../types";

type DeleteRecordsModalProps = {
  rows: DeleteModalRow[];
  selectedRecordIds: string[];
  isDeletingSelected: boolean;
  onClose: () => void;
  onToggleRecord: (recordId: string) => void;
  onDeleteSelected: () => void;
};

export default function DeleteRecordsModal({
  rows,
  selectedRecordIds,
  isDeletingSelected,
  onClose,
  onToggleRecord,
  onDeleteSelected
}: DeleteRecordsModalProps) {
  return (
    <section
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 80,
        padding: "1rem"
      }}
    >
      <article className="card" style={{ width: "min(760px, 96vw)", maxHeight: "80vh", overflow: "auto" }}>
        <h3>Delete Records Checklist</h3>
        <p className="muted">Check one or more records below, then click Delete Selected.</p>

        <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
          {rows.length === 0 ? <p className="muted">No records available.</p> : null}
          {rows.map((row) => (
            <label
              key={row.id}
              style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", border: "1px solid #d6d6d6", padding: "0.6rem" }}
            >
              <input
                type="checkbox"
                checked={selectedRecordIds.includes(row.id)}
                onChange={() => {
                  onToggleRecord(row.id);
                }}
                disabled={isDeletingSelected}
              />
              <span>
                <strong>{row.date}</strong>
                <br />
                {row.productsCount} product row(s), Revenue: {formatPhp(row.revenueTotal)}, Profit/Loss: {formatProfitLoss(row.profitTotal)}
              </span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} disabled={isDeletingSelected}>
            Cancel
          </button>
          <button type="button" onClick={onDeleteSelected} disabled={selectedRecordIds.length === 0 || isDeletingSelected}>
            {isDeletingSelected ? "Deleting Selected..." : `Delete Selected (${selectedRecordIds.length})`}
          </button>
        </div>
      </article>
    </section>
  );
}
