import type { BreakEvenResult } from "@/lib/types";

const BREAK_EVEN_CACHE_PREFIX = "break-even:";

export function toBreakEvenSessionStorageKey(cacheKey: string): string {
  return `${BREAK_EVEN_CACHE_PREFIX}${cacheKey}`;
}

export function readBreakEvenCache(cacheKey: string): BreakEvenResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(toBreakEvenSessionStorageKey(cacheKey));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BreakEvenResult;
  } catch {
    return null;
  }
}

export function writeBreakEvenCache(cacheKey: string, result: BreakEvenResult): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(toBreakEvenSessionStorageKey(cacheKey), JSON.stringify(result));
}

export function clearBreakEvenCache(cacheKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(toBreakEvenSessionStorageKey(cacheKey));
}
