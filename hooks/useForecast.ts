"use client";

import { useCallback, useState } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";
import type { BreakEvenResult, CostModel, ForecastResult } from "@/lib/types";
import type { MarketSignal } from "@/lib/forecast";

type ForecastPayload = {
  breakEvenResult: BreakEvenResult;
  costModel: CostModel;
  marketSignals: MarketSignal;
};

export function useForecast() {
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestForecast = useCallback(async (payload: ForecastPayload) => {
    setIsForecasting(true);
    setError(null);

    try {
      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt < 2) {
        attempt += 1;
        const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/forecast", {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
          setForecastResult(data.forecastResult);
          return data.forecastResult as ForecastResult;
        }

        lastError = new Error(data.message ?? "Forecast failed");
      }

      throw lastError ?? new Error("Forecast failed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Forecast request failed";
      setError(message);
      throw err;
    } finally {
      setIsForecasting(false);
    }
  }, []);

  return {
    forecastResult,
    isForecasting,
    error,
    requestForecast
  };
}
