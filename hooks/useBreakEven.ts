"use client";

import { useCallback, useMemo, useState } from "react";

import { buildBreakEvenCacheKey, computeBreakEvenResultAsync } from "@/lib/breakEven";
import { clearBreakEvenCache, readBreakEvenCache, writeBreakEvenCache } from "@/lib/breakEvenCache";
import type { BreakEvenResult, CostModel } from "@/lib/types";

export function useBreakEven(costModel: CostModel) {
  const [breakEvenResult, setBreakEvenResult] = useState<BreakEvenResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => buildBreakEvenCacheKey(costModel), [costModel]);

  const compute = useCallback(async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const cached = readBreakEvenCache(cacheKey);
      if (cached) {
        setBreakEvenResult(cached);
        setIsCalculating(false);
        return cached;
      }

      const computed = await computeBreakEvenResultAsync(costModel);
      setBreakEvenResult(computed);
      writeBreakEvenCache(cacheKey, computed);

      return computed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to compute break-even";
      setError(message);
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, [cacheKey, costModel]);

  const invalidate = useCallback(() => {
    clearBreakEvenCache(cacheKey);
    setBreakEvenResult(null);
  }, [cacheKey]);

  return {
    breakEvenResult,
    isCalculating,
    error,
    compute,
    invalidate,
    cacheKey
  };
}
