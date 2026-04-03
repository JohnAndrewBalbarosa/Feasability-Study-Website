"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";
import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";

type TransactionLog = {
  id: string;
  created_at: string;
  action: "create" | "delete" | string;
  table_name: string;
  record_id: string;
  created_by_email: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function LogsWorkspace() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
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

    const loadLogs = async () => {
      try {
        setError(null);
        const headers = await getSessionAuthHeaders();
        const response = await fetch("/api/logs/transactions", { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(formatApiError(data, "Failed to load transaction logs"));
        }

        setLogs(data.logs ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    void loadLogs();
  }, [authLoading, authorized]);

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (log.action === "create") {
          acc.creates += 1;
        }
        if (log.action === "delete") {
          acc.deletes += 1;
        }
        return acc;
      },
      { creates: 0, deletes: 0 }
    );
  }, [logs]);

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
    <main ref={pageRef} className="page-shell">
      <section className="hero">
        <h1>Basis Transaction Logs</h1>
        <p>Creation and deletion logs for basis records are listed below.</p>
        <div className="nav">
          <a href="/">Summary Dashboard</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/logs">Transaction Logs</a>
          <a href="/about">About Developer</a>
          <button type="button" onClick={signOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
            Sign Out ({email})
          </button>
        </div>
      </section>

      {error ? <UserErrorPanel title="Transaction Logs Are Temporarily Unavailable" message={error} /> : null}

      <section className="grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <h3>Log Summary</h3>
          <p>
            Total Logs: <strong>{logs.length}</strong>
          </p>
          <p>
            Created Records: <strong>{totals.creates}</strong>
          </p>
          <p>
            Deleted Records: <strong>{totals.deletes}</strong>
          </p>
        </article>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h3>Recent Transactions</h3>
        {logs.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            No transaction logs found.
          </p>
        ) : (
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record ID</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.action}</td>
                    <td>{log.table_name}</td>
                    <td>{log.record_id}</td>
                    <td>{log.created_by_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
