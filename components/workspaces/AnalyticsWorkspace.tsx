"use client";

import { useEffect, useMemo, useState } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";

type BasisDataRow = {
  productName?: string;
  revenuePerItem?: number;
  weightedBreakEvenUnits?: number;
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
  date: string;
  showDateCell: boolean;
  dateRowSpan: number;
  productName: string;
  revenuePerItem: number;
  weightedBreakEvenUnits: number;
  actualUnitsSoldToday: number;
  deficitUnits: number;
  neededContributionToBreakEven: number;
  revenueToday: number;
  profitToday: number;
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

export default function AnalyticsPage() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const [records, setRecords] = useState<BasisRecord[]>([]);
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

  const analyticsRows = useMemo<AnalyticsRow[]>(() => {
    const rawRows: Array<Omit<AnalyticsRow, "showDateCell" | "dateRowSpan">> = [];

    records.forEach((record) => {
      const dateText = new Date(record.created_at).toLocaleString();
      record.data.forEach((item, index) => {
        const revenuePerItem = asNumber(item.revenuePerItem);
        const weightedBreakEvenUnits = asNumber(item.weightedBreakEvenUnits);
        const actualUnitsSoldToday = asNumber(item.actualUnitsSoldToday);
        const deficitUnits = asNumber(item.deficitUnits);
        const revenueToday = asNumber(item.revenueToday);
        const hasProfitField = typeof item.profitToday === "number" || typeof item.profitToday === "string";
        const profitToday = hasProfitField ? asNumber(item.profitToday) : revenueToday - weightedBreakEvenUnits;
        const inferredRevenuePerItem = actualUnitsSoldToday > 0 ? revenueToday / actualUnitsSoldToday : 0;
        const effectiveRevenuePerItem = revenuePerItem > 0 ? revenuePerItem : inferredRevenuePerItem;
        const neededContributionToBreakEven = deficitUnits > 0 ? -deficitUnits * effectiveRevenuePerItem : 0;
        const status = profitToday >= 0 && deficitUnits <= 0 ? "profit" : "loss";

        rawRows.push({
          key: `${record.id}-${index}`,
          date: dateText,
          productName: item.productName?.trim() || "Unnamed product",
          revenuePerItem: effectiveRevenuePerItem,
          weightedBreakEvenUnits,
          actualUnitsSoldToday,
          deficitUnits,
          neededContributionToBreakEven,
          revenueToday,
          profitToday,
          status
        });
      });
    });

    const rows: AnalyticsRow[] = [];
    let index = 0;

    while (index < rawRows.length) {
      let end = index + 1;
      while (end < rawRows.length && rawRows[end].date === rawRows[index].date) {
        end += 1;
      }

      const groupSize = end - index;
      rawRows.slice(index, end).forEach((row, groupIndex) => {
        rows.push({
          ...row,
          showDateCell: groupIndex === 0,
          dateRowSpan: groupIndex === 0 ? groupSize : 0
        });
      });

      index = end;
    }

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
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Revenue Per Item</th>
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
                    <td>{row.productName}</td>
                    <td>{formatPhp(row.revenuePerItem)}</td>
                    <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                    <td>{formatNumber(row.weightedBreakEvenUnits)}</td>
                    <td>{formatNumber(row.deficitUnits)}</td>
                    <td>{formatPhp(row.neededContributionToBreakEven)}</td>
                    <td>{formatPhp(row.revenueToday)}</td>
                    <td>{formatPhp(row.profitToday)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
