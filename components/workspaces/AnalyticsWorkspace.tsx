"use client";

import { useEffect, useState } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";

type RunHistoryItem = {
  id: string;
  created_at: string;
  output_payload: {
    pipelineVersion?: string;
    budgetUsage?: {
      allocated: number;
      spent: number;
      remaining: number;
    };
    forecastResult?: {
      demandForecast: {
        low: number;
        expected: number;
        high: number;
      };
      pricingInsights: string;
    };
    procurementPlan?: {
      totalSpend: number;
      rawQuantityPurchased: number;
    };
    packagingDistribution?: {
      bundleSize: number;
      fullPackages: number;
      remainderUnits: number;
    };
    procurementLogs?: Array<{
      sourceName: string;
      quantityPurchased: number;
      transactionCost: number;
    }>;
    profitCurveGraph?: Array<{ units: number; profit: number }>;
  };
};

export default function AnalyticsPage() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const [runs, setRuns] = useState<RunHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletionLogs, setDeletionLogs] = useState<DeletionLogItem[]>([]);
  const [showDeletionLogs, setShowDeletionLogs] = useState(false);
  const [loadingDeletionLogs, setLoadingDeletionLogs] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  type DeletionLogItem = {
    id: string;
    created_at: string;
    run_id: string;
    pipeline_version: string | null;
    deleted_by_email: string;
  };

  const formatApiError = (data: unknown, fallback: string) => {
    if (!data || typeof data !== "object") {
      return fallback;
    }

    const payload = data as { message?: string; details?: string };
    const detail = typeof payload.details === "string" ? payload.details : null;
    const baseMessage = typeof payload.message === "string" ? payload.message : fallback;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
  };

  const loadDeletionLogs = async () => {
    setLoadingDeletionLogs(true);

    try {
      const headers = await getSessionAuthHeaders();
      const response = await fetch("/api/pipeline/deletions", { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(formatApiError(data, "Failed to load deletion logs"));
      }

      setDeletionLogs(data.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deletion logs");
    } finally {
      setLoadingDeletionLogs(false);
    }
  };

  const toggleDeletionLogs = async () => {
    if (showDeletionLogs) {
      setShowDeletionLogs(false);
      return;
    }

    setShowDeletionLogs(true);
    if (deletionLogs.length === 0) {
      await loadDeletionLogs();
    }
  };

  const deleteRun = async (runId: string) => {
    const confirmed = window.confirm("Delete this run permanently? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setDeletingRunId(runId);
    setError(null);

    try {
      const headers = await getSessionAuthHeaders();
      const response = await fetch(`/api/pipeline/${runId}`, {
        method: "DELETE",
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data, "Failed to delete run"));
      }

      setRuns((previous) => previous.filter((item) => item.id !== runId));

      const log = (data as { log?: DeletionLogItem }).log;
      if (log) {
        setDeletionLogs((previous) => [log, ...previous]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete run");
    } finally {
      setDeletingRunId(null);
    }
  };

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    const loadRuns = async () => {
      try {
        const headers = await getSessionAuthHeaders();
        const response = await fetch("/api/pipeline/history", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(formatApiError(data, "Failed to load analytics"));
        }

        setRuns(data.runs ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    void loadRuns();
  }, [authLoading, authorized]);

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
        <p>Review procurement logs, budget utilization, packaging distribution, and a compact profit curve snapshot for each run.</p>
        <div className="nav">
          <a href="/">Summary Dashboard</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <button type="button" onClick={() => void toggleDeletionLogs()} style={{ maxWidth: "220px" }}>
            {showDeletionLogs ? "Hide Deletion Logs" : "View Deletion Logs"}
          </button>
          <button type="button" onClick={signOut} style={{ maxWidth: "180px" }}>
            Sign Out ({email})
          </button>
        </div>
      </section>

      {error ? <UserErrorPanel title="Analytics Is Temporarily Unavailable" message={error} /> : null}

      {showDeletionLogs ? (
        <section className="grid" style={{ marginTop: "1rem" }}>
          {loadingDeletionLogs ? (
            <article className="card">
              <h3>Loading deletion logs...</h3>
              <p className="muted">Please wait while audit entries are fetched.</p>
            </article>
          ) : deletionLogs.length === 0 ? (
            <article className="card">
              <h3>No deletion logs yet</h3>
              <p className="muted">Delete actions will appear here with timestamp and account email.</p>
            </article>
          ) : (
            deletionLogs.map((log) => (
              <article key={log.id} className="card">
                <h3>Deleted run {log.run_id}</h3>
                <p className="muted">Deleted at {new Date(log.created_at).toLocaleString()}</p>
                <p>Deleted by: {log.deleted_by_email}</p>
                <p>Pipeline version: {log.pipeline_version ?? "unknown"}</p>
              </article>
            ))
          )}
        </section>
      ) : null}

      <section className="grid" style={{ marginTop: "1rem" }}>
        {runs.length === 0 ? (
          <article className="card">
            <h3>No pipeline runs yet</h3>
            <p className="muted">Run a scenario from the summary dashboard to populate this page.</p>
          </article>
        ) : (
          runs.map((run) => (
            <article key={run.id} className="card">
              <h3>Run on {new Date(run.created_at).toLocaleString()}</h3>
              <p className="muted">Pipeline version: {run.output_payload.pipelineVersion ?? "unknown"}</p>
              <p>
                Budget: ${run.output_payload.budgetUsage?.spent.toFixed(2)} spent / $
                {run.output_payload.budgetUsage?.allocated.toFixed(2)} allocated
              </p>
              <p>
                Forecast: {run.output_payload.forecastResult?.demandForecast.low ?? 0} / {run.output_payload.forecastResult?.demandForecast.expected ?? 0} /
                {run.output_payload.forecastResult?.demandForecast.high ?? 0} (L/E/H)
              </p>
              <p>
                Procurement spend: ${run.output_payload.procurementPlan?.totalSpend?.toFixed(2) ?? "0.00"} | Raw units: {run.output_payload.procurementPlan?.rawQuantityPurchased ?? 0}
              </p>
              <p>
                Packaging: {run.output_payload.packagingDistribution?.fullPackages} bundles of size {run.output_payload.packagingDistribution?.bundleSize}
              </p>
              <p className="muted">Procurement transactions: {run.output_payload.procurementLogs?.length ?? 0}</p>
              <p className="muted">Profit points: {run.output_payload.profitCurveGraph?.length ?? 0}</p>
              <button type="button" onClick={() => void deleteRun(run.id)} disabled={deletingRunId === run.id} style={{ maxWidth: "170px", marginTop: "0.8rem" }}>
                {deletingRunId === run.id ? "Deleting..." : "Delete Run"}
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
