import { useEffect } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";
import { isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";

type Params = {
  authLoading: boolean;
  authorized: boolean;
  setLocksDisabledByUser: (value: React.SetStateAction<boolean>) => void;
  setLockStatusLoading: (value: React.SetStateAction<boolean>) => void;
  setServerLockEnabled: (value: React.SetStateAction<boolean>) => void;
};

export function useMaterialsLockEffects({
  authLoading,
  authorized,
  setLocksDisabledByUser,
  setLockStatusLoading,
  setServerLockEnabled
}: Params) {
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
  }, [setLocksDisabledByUser]);

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
