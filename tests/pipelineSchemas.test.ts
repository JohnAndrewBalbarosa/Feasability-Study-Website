import { describe, expect, it } from "vitest";

import { finalizedPipelineSchema } from "@/lib/validation/pipelineSchemas";

describe("finalized pipeline payload schema", () => {
  it("accepts valid finalized payload", () => {
    const result = finalizedPipelineSchema.safeParse({
      pipelineVersion: "2.0.0",
      budgetAvailable: 5000,
      conversionRateRawToProduct: 0.85,
      bundleSize: 12,
      marketPrices: [{ sourceName: "Market A", marketPrice: 2.1, quantityAvailable: 1000 }],
      costModel: {
        fixedCost: 1200,
        variableCostPerUnit: 2.2,
        sellingPricePerUnit: 5.5
      },
      breakEvenResult: {
        breakEvenPointUnits: 400,
        breakEvenRevenue: 2200,
        contributionMargin: 3.3,
        status: "reachable",
        computedAt: "2026-01-01T00:00:00.000Z",
        cacheKey: "abc"
      },
      forecastResult: {
        productionRecommendation: 520,
        demandForecast: {
          low: 450,
          expected: 520,
          high: 610
        },
        pricingInsights: "Maintain margin buffer.",
        marketSignalSummary: "Stable trend",
        promptVersion: "promptAI.v2.structured-json",
        generatedAt: "2026-01-01T00:00:00.000Z"
      },
      procurementDecision: {
        targetRawUnits: 620,
        strategy: "Buy lowest-cost first"
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid finalized payload", () => {
    const result = finalizedPipelineSchema.safeParse({
      pipelineVersion: "",
      budgetAvailable: -1,
      conversionRateRawToProduct: 0,
      bundleSize: 0,
      marketPrices: [],
      costModel: {
        fixedCost: -1,
        variableCostPerUnit: -1,
        sellingPricePerUnit: 0
      },
      breakEvenResult: {
        breakEvenPointUnits: 0,
        breakEvenRevenue: 0,
        contributionMargin: 0,
        status: "unknown",
        computedAt: "",
        cacheKey: ""
      },
      forecastResult: {
        productionRecommendation: -1,
        demandForecast: {
          low: -1,
          expected: -1,
          high: -1
        },
        pricingInsights: "",
        marketSignalSummary: "",
        promptVersion: "",
        generatedAt: ""
      },
      procurementDecision: {
        targetRawUnits: -1,
        strategy: ""
      }
    });

    expect(result.success).toBe(false);
  });
});
