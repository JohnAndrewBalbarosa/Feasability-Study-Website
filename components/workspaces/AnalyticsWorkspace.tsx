"use client";

import { useEffect, useMemo, useState } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";

type BasisDataRow = {
  productName?: string;
  revenuePerItem?: number;
  weightedBreakEvenUnits?: number;
  weightedTargetProfit?: number;
  actualUnitsSoldToday?: number;
  deficitUnits?: number;
  revenueToday?: number;
  profitToday?: number;
};

type BasisRecord = {
  id: string;
  created_at: string;
  data: BasisDataRow[];
};

type AnalyticsRow = {
  key: string;
  recordId: string;
  date: string;
  showDateCell: boolean;
  showRecordTotalsCell: boolean;
  dateRowSpan: number;
  productName: string;
  weightedBreakEvenUnits: number;
  actualUnitsSoldToday: number;
  deficitUnits: number;
  neededContributionToBreakEven: number;
  revenueToday: number;
  profitToday: number;
  recordRevenueTotal: number;
  recordProfitTotal: number;
  status: "profit" | "loss";
};

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPhp(value: number): string {
  return `PHP ${new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatProfitLoss(value: number): string {
  const absolute = Math.abs(value);
  const formatted = `PHP ${new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absolute)}`;
  return value < 0 ? `-${formatted}` : formatted;
}

export default function AnalyticsPage() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const [records, setRecords] = useState<BasisRecord[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatApiError = (data: unknown, fallback: string) => {
    if (!data || typeof data !== "object") {
      return fallback;
    }

    const payload = data as { message?: string; details?: string };
    const detail = typeof payload.details === "string" ? payload.details : null;
    const baseMessage = typeof payload.message === "string" ? payload.message : fallback;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
  };

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    const loadRuns = async () => {
      try {
        setError(null);
        const headers = await getSessionAuthHeaders();
        const response = await fetch("/api/basis/history", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(formatApiError(data, "Failed to load analytics"));
        }

        setRecords(data.records ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    void loadRuns();
  }, [authLoading, authorized]);

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((previous) =>
      previous.includes(recordId) ? previous.filter((id) => id !== recordId) : [...previous, recordId]
    );
  };

  const deleteModalRows = useMemo(() => {
    return records.map((record) => {
      const revenueTotal = record.data.reduce((sum, item) => sum + asNumber(item.revenueToday), 0);
      const profitTotal = record.data.reduce((sum, item) => {
        const revenuePerItem = asNumber(item.revenuePerItem);
        const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
        const weightedTargetProfit =
          typeof item.weightedTargetProfit === "number" || typeof item.weightedTargetProfit === "string"
            ? asNumber(item.weightedTargetProfit)
            : weightedBreakEvenUnits * revenuePerItem;
        const revenueToday = asNumber(item.revenueToday);
        const hasProfitField = typeof item.profitToday === "number" || typeof item.profitToday === "string";
        const profitToday = hasProfitField ? asNumber(item.profitToday) : weightedTargetProfit - revenueToday;
        return sum + profitToday;
      }, 0);

      return {
        id: record.id,
        date: new Date(record.created_at).toLocaleString(),
        productsCount: record.data.length,
        revenueTotal,
        profitTotal
      };
    });
  }, [records]);

  const handleDeleteSelected = async () => {
    if (selectedRecordIds.length === 0) {
      return;
    }

    try {
      setIsDeletingSelected(true);
      setError(null);

      const headers = await getSessionAuthHeaders();

      const results = await Promise.all(
        selectedRecordIds.map(async (recordId) => {
          const response = await fetch(`/api/basis/${encodeURIComponent(recordId)}`, {
            method: "DELETE",
            headers
          });
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            return {
              recordId,
              ok: false,
              message: formatApiError(data, "Failed to delete basis record")
            } as const;
          }

          return { recordId, ok: true, message: "" } as const;
        })
      );

      const deletedIds = results.filter((result) => result.ok).map((result) => result.recordId);
      const failed = results.filter((result) => !result.ok);

      if (deletedIds.length > 0) {
        setRecords((previous) => previous.filter((record) => !deletedIds.includes(record.id)));
      }

      if (failed.length > 0) {
        setSelectedRecordIds(failed.map((item) => item.recordId));
        setError(`Deleted ${deletedIds.length} record(s), failed ${failed.length}: ${failed[0].message}`);
        return;
      }

      setSelectedRecordIds([]);
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete selected records");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const analyticsRows = useMemo<AnalyticsRow[]>(() => {
    const rows: AnalyticsRow[] = [];

    records.forEach((record) => {
      const dateText = new Date(record.created_at).toLocaleString();
      const groupSize = record.data.length;

      const recordRevenueTotal = record.data.reduce((sum, item) => sum + asNumber(item.revenueToday), 0);
      const recordProfitTotal = record.data.reduce((sum, item) => {
        const revenuePerItem = asNumber(item.revenuePerItem);
        const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
        const weightedTargetProfit =
          typeof item.weightedTargetProfit === "number" || typeof item.weightedTargetProfit === "string"
            ? asNumber(item.weightedTargetProfit)
            : weightedBreakEvenUnits * revenuePerItem;
        const revenueToday = asNumber(item.revenueToday);
        const hasProfitField = typeof item.profitToday === "number" || typeof item.profitToday === "string";
        const profitToday = hasProfitField ? asNumber(item.profitToday) : weightedTargetProfit - revenueToday;
        return sum + profitToday;
      }, 0);

      record.data.forEach((item, index) => {
        const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
        const actualUnitsSoldToday = asNumber(item.actualUnitsSoldToday);
        const deficitUnits = asNumber(item.deficitUnits);
        const revenuePerItem = asNumber(item.revenuePerItem);
        const weightedTargetProfit =
          typeof item.weightedTargetProfit === "number" || typeof item.weightedTargetProfit === "string"
            ? asNumber(item.weightedTargetProfit)
            : weightedBreakEvenUnits * revenuePerItem;
        const revenueToday = asNumber(item.revenueToday);
        const hasProfitField = typeof item.profitToday === "number" || typeof item.profitToday === "string";
        const profitToday = hasProfitField ? asNumber(item.profitToday) : weightedTargetProfit - revenueToday;
        const neededContributionToBreakEven = deficitUnits > 0 ? -deficitUnits * revenuePerItem : 0;
        const status = profitToday <= 0 && deficitUnits <= 0 ? "profit" : "loss";

        rows.push({
          key: `${record.id}-${index}`,
          recordId: record.id,
          date: dateText,
          showDateCell: index === 0,
          showRecordTotalsCell: index === 0,
          dateRowSpan: index === 0 ? groupSize : 0,
          productName: item.productName?.trim() || "Unnamed product",
          weightedBreakEvenUnits,
          actualUnitsSoldToday,
          deficitUnits,
          neededContributionToBreakEven,
          revenueToday,
          profitToday,
          recordRevenueTotal,
          recordProfitTotal,
          status
        });
      });
    });

    return rows;
  }, [records]);

  const totals = useMemo(() => {
    return analyticsRows.reduce(
      (acc, row) => {
        acc.revenue += row.revenueToday;
        acc.profit += row.profitToday;
        acc.breakEvenUnits += row.weightedBreakEvenUnits;
        acc.soldUnits += row.actualUnitsSoldToday;
        acc.deficitUnits += row.deficitUnits;
        return acc;
      },
      {
        revenue: 0,
        profit: 0,
        breakEvenUnits: 0,
        soldUnits: 0,
        deficitUnits: 0
      }
    );
  }, [analyticsRows]);

  if (authLoading) {
    return (
      <main className="page-shell">
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Checking account access...</h2>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Detailed Analytics</h1>
        <p>Supabase basis records are shown below by date and product. Green rows indicate profit or break-even, and red rows indicate loss.</p>
        <div className="nav">
          <a href="/">Summary Dashboard</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/logs">Transaction Logs</a>
          <button type="button" onClick={signOut} style={{ maxWidth: "180px" }}>
            Sign Out ({email})
          </button>
        </div>
        <div className="analytics-legend">
          <span className="analytics-legend-item">
            <span className="analytics-swatch analytics-swatch-profit" />
            Green row = Profit or Break-even
          </span>
          <span className="analytics-legend-item">
            <span className="analytics-swatch analytics-swatch-loss" />
            Red row = Loss
          </span>
        </div>
      </section>

      {error ? <UserErrorPanel title="Analytics Is Temporarily Unavailable" message={error} /> : null}

      <section className="grid" style={{ marginTop: "1rem" }}>
        {analyticsRows.length === 0 ? (
          <article className="card">
            <h3>No detailed analytics yet</h3>
            <p className="muted">Save Step 8 Add Data from the Business Analysis page to populate this table.</p>
          </article>
        ) : (
          <article className="card">
            <h3>Totals (all loaded basis records)</h3>
            <p>
              Total Revenue: <strong>{formatPhp(totals.revenue)}</strong>
            </p>
            <p>
              Total Profit: <strong>{formatPhp(totals.profit)}</strong>
            </p>
            <p>
              Total Weighted Break-even Units: <strong>{formatNumber(totals.breakEvenUnits)}</strong>
            </p>
            <p>
              Total Units Sold: <strong>{formatNumber(totals.soldUnits)}</strong>
            </p>
            <p>
              Total Deficit Units: <strong>{formatNumber(totals.deficitUnits)}</strong>
            </p>
          </article>
        )}
      </section>

      {analyticsRows.length > 0 ? (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h3>Per-product Detailed Analytics</h3>
          <p className="muted">Profit/Loss formula: Weighted Target Profit minus Revenue Today per item grouping.</p>
          <div style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(true);
              }}
              disabled={isDeletingSelected}
            >
              Delete Multiple Records
            </button>
          </div>
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Record Revenue (Merged)</th>
                  <th>Record Profit / Loss (Merged)</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Weighted Break-even Units</th>
                  <th>Deficit Units</th>
                  <th>Needed Contribution To Break-even</th>
                  <th>Revenue</th>
                  <th>Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {analyticsRows.map((row) => (
                  <tr key={row.key} className={row.status === "profit" ? "analytics-row-profit" : "analytics-row-loss"}>
                    {row.showDateCell ? <td rowSpan={row.dateRowSpan}>{row.date}</td> : null}
                    {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatPhp(row.recordRevenueTotal)}</td> : null}
                    {row.showRecordTotalsCell ? <td rowSpan={row.dateRowSpan}>{formatProfitLoss(row.recordProfitTotal)}</td> : null}
                    <td>{row.productName}</td>
                    <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                    <td>{formatNumber(row.weightedBreakEvenUnits)}</td>
                    <td>{formatNumber(row.deficitUnits)}</td>
                    <td>{formatPhp(row.neededContributionToBreakEven)}</td>
                    <td>{formatPhp(row.revenueToday)}</td>
                    <td>{formatProfitLoss(row.profitToday)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {deleteModalOpen ? (
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
              {deleteModalRows.length === 0 ? <p className="muted">No records available.</p> : null}
              {deleteModalRows.map((row) => (
                <label
                  key={row.id}
                  style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", border: "1px solid #d6d6d6", padding: "0.6rem" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecordIds.includes(row.id)}
                    onChange={() => {
                      toggleRecordSelection(row.id);
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
              <button type="button" onClick={() => setDeleteModalOpen(false)} disabled={isDeletingSelected}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleDeleteSelected()} disabled={selectedRecordIds.length === 0 || isDeletingSelected}>
                {isDeletingSelected ? "Deleting Selected..." : `Delete Selected (${selectedRecordIds.length})`}
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
