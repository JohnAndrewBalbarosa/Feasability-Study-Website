"use client";

import { useRef } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";
import { useAnalyticsActions } from "./handlers/useAnalyticsActions";
import { useAnalyticsWorkspaceState } from "./hooks/useAnalyticsWorkspaceState";
import AnalyticsTable from "./components/AnalyticsTable";
import AnalyticsTotalsCard from "./components/AnalyticsTotalsCard";
import DeleteRecordsModal from "./components/DeleteRecordsModal";

export default function AnalyticsPage() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  const state = useAnalyticsWorkspaceState();
  const actions = useAnalyticsActions({ records: state.records, setRecords: state.setRecords, setError: state.setError });

  if (state.authLoading) {
    return (
      <main className="page-shell">
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Checking account access...</h2>
        </section>
      </main>
    );
  }

  if (!state.authorized) {
    return null;
  }

  return (
    <main ref={pageRef} className="page-shell">
      <section className="hero">
        <h1>Detailed Analytics</h1>
        <p>Supabase basis records are shown below by date and product. Green rows indicate profit or break-even, and red rows indicate loss.</p>
        <div className="nav">
          <a href="/">{state.lockedMode ? "Unlocked Page" : "Summary Dashboard"}</a>
          <a href="/materials">{state.lockedMode ? "Locked Page" : "Material Requirements"}</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/logs">Transaction Logs</a>
          <a href="/about">About Developer</a>
          <button type="button" onClick={state.signOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
            Sign Out ({state.email})
          </button>
        </div>
        {state.lockStatusLoading ? <p className="muted">Checking lock status from Supabase...</p> : null}
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

      {state.error ? <UserErrorPanel title="Analytics Is Temporarily Unavailable" message={state.error} /> : null}

      <section className="grid" style={{ marginTop: "1rem" }}>
        {state.analyticsRows.length === 0 ? (
          <article className="card">
            <h3>No detailed analytics yet</h3>
            <p className="muted">Save Step 8 Add Data from the Business Analysis page to populate this table.</p>
          </article>
        ) : (
          <AnalyticsTotalsCard totals={state.totals} />
        )}
      </section>

      {state.analyticsRows.length > 0 ? (
        <AnalyticsTable
          rows={state.analyticsRows}
          resultHeaderLabel={state.resultHeaderLabel}
          isDeletingSelected={actions.isDeletingSelected}
          onOpenDeleteModal={actions.openDeleteModal}
        />
      ) : null}

      {actions.deleteModalOpen ? (
        <DeleteRecordsModal
          rows={state.deleteModalRows}
          selectedRecordIds={actions.selectedRecordIds}
          isDeletingSelected={actions.isDeletingSelected}
          onClose={actions.closeDeleteModal}
          onToggleRecord={actions.toggleRecordSelection}
          onDeleteSelected={() => {
            void actions.handleDeleteSelected();
          }}
        />
      ) : null}
    </main>
  );
}
