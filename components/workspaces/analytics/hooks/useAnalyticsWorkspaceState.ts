"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";
import { isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";

import { buildAnalyticsRows, buildAnalyticsTotals, buildDeleteModalRows, getResultHeaderLabel } from "../analyticsTransforms";
import { formatApiError } from "../formatters";
import type { BasisRecord } from "../types";

export function useAnalyticsWorkspaceState() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const [records, setRecords] = useState<BasisRecord[]>([]);
  const [lockStatusLoading, setLockStatusLoading] = useState(true);
  const [serverLockEnabled, setServerLockEnabled] = useState(false);
  const [locksDisabledByUser, setLocksDisabledByUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const syncDisabledLockState = () => {
      setLocksDisabledByUser(isLocksDisabledOverride());
    };

    syncDisabledLockState();
    window.addEventListener("storage", syncDisabledLockState);
    window.addEventListener(PLANNING_LOCKS_UPDATED_EVENT, syncDisabledLockState as EventListener);

    return () => {
      window.removeEventListener("storage", syncDisabledLockState);
      window.removeEventListener(PLANNING_LOCKS_UPDATED_EVENT, syncDisabledLockState as EventListener);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    let cancelled = false;

    const loadLockStatus = async () => {
      setLockStatusLoading(true);
      try {
        const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/locks/status", { method: "GET", headers });

        if (!response.ok) {
          if (!cancelled) {
            setServerLockEnabled(false);
          }
          return;
        }

        const data = (await response.json()) as { lockEnabled?: boolean };
        if (!cancelled) {
          setServerLockEnabled(Boolean(data.lockEnabled));
        }
      } catch {
        if (!cancelled) {
          setServerLockEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLockStatusLoading(false);
        }
      }
    };

    void loadLockStatus();
    return () => {
      cancelled = true;
    };
  }, [authLoading, authorized]);

  const lockedMode = serverLockEnabled && !locksDisabledByUser;
  const analyticsRows = useMemo(() => buildAnalyticsRows(records), [records]);
  const totals = useMemo(() => buildAnalyticsTotals(analyticsRows), [analyticsRows]);
  const deleteModalRows = useMemo(() => buildDeleteModalRows(records), [records]);
  const resultHeaderLabel = useMemo(() => getResultHeaderLabel(analyticsRows), [analyticsRows]);

  return {
    authLoading,
    authorized,
    email,
    signOut,
    records,
    setRecords,
    lockStatusLoading,
    lockedMode,
    error,
    setError,
    analyticsRows,
    totals,
    deleteModalRows,
    resultHeaderLabel
  };
}
