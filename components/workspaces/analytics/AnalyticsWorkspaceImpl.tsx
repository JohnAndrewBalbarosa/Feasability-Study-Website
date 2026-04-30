"use client";

import { useRef } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import PageTopBar from "@/components/PageTopBar";
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
    <>
      <PageTopBar email={state.email} onSignOut={state.signOut} />
      <main ref={pageRef} className="page-shell">
      <div className="page-heading">
        <h1>Analytics</h1>
        <div className="analytics-legend" style={{ marginTop: "0.5rem" }}>
          <span className="analytics-legend-item">
            <span className="analytics-swatch analytics-swatch-profit" />
            Green = Profit or Break-even
          </span>
          <span className="analytics-legend-item">
            <span className="analytics-swatch analytics-swatch-loss" />
            Red = Loss
          </span>
        </div>
      </div>

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
    </>
  );
}
