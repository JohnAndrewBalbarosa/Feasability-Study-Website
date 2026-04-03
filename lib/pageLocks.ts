export const PLANNING_LOCKS_UPDATED_EVENT = "planning-locks-updated";
let locksDisabledForCurrentLoad = false;

export function isLocksDisabledOverride(): boolean {
  return locksDisabledForCurrentLoad;
}

export function disableAllPageLocks(): void {
  if (typeof window === "undefined") {
    return;
  }

  locksDisabledForCurrentLoad = true;
  window.dispatchEvent(new Event(PLANNING_LOCKS_UPDATED_EVENT));
}

export function enableAllPageLocks(): void {
  if (typeof window === "undefined") {
    return;
  }

  locksDisabledForCurrentLoad = false;
  window.dispatchEvent(new Event(PLANNING_LOCKS_UPDATED_EVENT));
}
