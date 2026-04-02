import { z } from "zod";

export const procurementItemSchema = z.object({
  sourceName: z.string().min(1),
  marketPrice: z.number().positive(),
  quantityAvailable: z.number().int().positive()
});

export const breakEvenResultSchema = z.object({
  breakEvenPointUnits: z.number(),
  breakEvenRevenue: z.number(),
  contributionMargin: z.number(),
  status: z.enum(["reachable", "unreachable"]),
  computedAt: z.string(),
  cacheKey: z.string()
});

export const costModelSchema = z.object({
  fixedCost: z.number().nonnegative(),
  variableCostPerUnit: z.number().nonnegative(),
  sellingPricePerUnit: z.number().positive()
});

export const forecastResultSchema = z.object({
  productionRecommendation: z.number().int().nonnegative(),
  demandForecast: z.object({
    low: z.number().int().nonnegative(),
    expected: z.number().int().nonnegative(),
    high: z.number().int().nonnegative()
  }),
  pricingInsights: z.string(),
  marketSignalSummary: z.string(),
  promptVersion: z.string(),
  generatedAt: z.string()
});

export const procurementDecisionSchema = z.object({
  targetRawUnits: z.number().int().nonnegative(),
  strategy: z.string().min(1)
});

export const finalizedPipelineSchema = z.object({
  pipelineVersion: z.string().min(1),
  budgetAvailable: z.number().positive(),
  conversionRateRawToProduct: z.number().positive(),
  bundleSize: z.number().int().positive(),
  marketPrices: z.array(procurementItemSchema).min(1),
  costModel: costModelSchema,
  breakEvenResult: breakEvenResultSchema,
  forecastResult: forecastResultSchema,
  procurementDecision: procurementDecisionSchema
});

export type FinalizedPipelinePayload = z.infer<typeof finalizedPipelineSchema>;
