import { useEffect } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";

type Params = {
  authLoading: boolean;
  authorized: boolean;
  setLockStatusLoading: (value: boolean) => void;
  setServerLockEnabled: (value: boolean) => void;
};

export function useBusinessLockStatusEffect({ authLoading, authorized, setLockStatusLoading, setServerLockEnabled }: Params) {
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
  }, [authLoading, authorized, setLockStatusLoading, setServerLockEnabled]);
}
