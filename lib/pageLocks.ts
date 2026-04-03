export const PLANNING_LOCKS_UPDATED_EVENT = "planning-locks-updated";
const LOCKS_DISABLED_SESSION_KEY = "planning:locks-disabled-override";

let locksDisabledForCurrentLoad = false;
let hasHydratedLocksState = false;

function hydrateLocksStateFromSession(): void {
  if (hasHydratedLocksState || typeof window === "undefined") {
    return;
  }

  hasHydratedLocksState = true;

  try {
    locksDisabledForCurrentLoad = window.sessionStorage.getItem(LOCKS_DISABLED_SESSION_KEY) === "1";
  } catch {
    locksDisabledForCurrentLoad = false;
  }
}

function persistLocksStateInSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (locksDisabledForCurrentLoad) {
      window.sessionStorage.setItem(LOCKS_DISABLED_SESSION_KEY, "1");
    } else {
      window.sessionStorage.removeItem(LOCKS_DISABLED_SESSION_KEY);
    }
  } catch {
    // Ignore storage write failures and keep in-memory behavior.
  }
}

export function isLocksDisabledOverride(): boolean {
  hydrateLocksStateFromSession();
  return locksDisabledForCurrentLoad;
}

export function disableAllPageLocks(): void {
  if (typeof window === "undefined") {
    return;
  }

  hydrateLocksStateFromSession();
  locksDisabledForCurrentLoad = true;
  persistLocksStateInSession();
  window.dispatchEvent(new Event(PLANNING_LOCKS_UPDATED_EVENT));
}

export function enableAllPageLocks(): void {
  if (typeof window === "undefined") {
    return;
  }

  hydrateLocksStateFromSession();
  locksDisabledForCurrentLoad = false;
  persistLocksStateInSession();
  window.dispatchEvent(new Event(PLANNING_LOCKS_UPDATED_EVENT));
}
