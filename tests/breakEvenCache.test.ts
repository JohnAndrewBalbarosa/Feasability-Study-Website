import { describe, expect, it } from "vitest";

import { clearBreakEvenCache, readBreakEvenCache, toBreakEvenSessionStorageKey, writeBreakEvenCache } from "@/lib/breakEvenCache";
import type { BreakEvenResult } from "@/lib/types";

function createSessionStorageMock() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    }
  };
}

describe("break-even cache", () => {
  it("writes and reads cached results by key", () => {
    const sessionStorage = createSessionStorageMock();
    (globalThis as { window?: { sessionStorage: ReturnType<typeof createSessionStorageMock> } }).window = { sessionStorage };

    const cacheKey = "fixed-10";
    const payload: BreakEvenResult = {
      breakEvenPointUnits: 100,
      breakEvenRevenue: 500,
      contributionMargin: 2.5,
      status: "reachable",
      computedAt: "2026-01-01T00:00:00.000Z",
      cacheKey
    };

    writeBreakEvenCache(cacheKey, payload);
    const loaded = readBreakEvenCache(cacheKey);

    expect(loaded).toEqual(payload);
    expect(toBreakEvenSessionStorageKey(cacheKey)).toBe("break-even:fixed-10");
  });

  it("clears cached values", () => {
    const sessionStorage = createSessionStorageMock();
    (globalThis as { window?: { sessionStorage: ReturnType<typeof createSessionStorageMock> } }).window = { sessionStorage };

    const cacheKey = "to-clear";
    const payload: BreakEvenResult = {
      breakEvenPointUnits: 30,
      breakEvenRevenue: 120,
      contributionMargin: 4,
      status: "reachable",
      computedAt: "2026-01-01T00:00:00.000Z",
      cacheKey
    };

    writeBreakEvenCache(cacheKey, payload);
    clearBreakEvenCache(cacheKey);

    expect(readBreakEvenCache(cacheKey)).toBeNull();
  });
});
