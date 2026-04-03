"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import UserErrorPanel from "@/components/UserErrorPanel";
import { getSessionAuthHeaders } from "@/lib/authClient";
import {
  PLANNING_DATA_UPDATED_EVENT,
  computeInferredVariableCostByProduct,
  loadProcurementData,
  loadMaterialRequirements,
  normalizePlanningLabel,
  saveBusinessAnalysisProducts,
  saveProcurementData,
  type StoredProcurementData
} from "@/lib/planningStorage";
import { disableAllPageLocks, enableAllPageLocks, isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";
import { getLocalBusinessAutofillSeed, seedLocalPlanningData, shouldAutofillLocalInput } from "@/testInput/localAutofill";

type ProductRow = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: string;
  variableCost: string;
  unitsSoldToday: string;
};

type CostRow = {
  id: string;
  costName: string;
  amount: string;
  isBudget?: boolean;
};

type ParsedProduct = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: number;
  variableCost: number;
  contributionMargin: number;
  contributionMarginRatio: number;
};

type ParsedCost = {
  id: string;
  costName: string;
  amount: number;
  isBudget: boolean;
};

type Step1Data = {
  errors: string[];
  parsedProducts: ParsedProduct[];
  parsedCosts: ParsedCost[];
  budget: number | null;
  fixedCostTotal: number | null;
};

type UnitsData = {
  errors: string[];
  unitsByProductId: Map<string, number>;
};

type ProfitAnalysis = {
  rows: Array<{
    productName: string;
    unitsSold: number;
    revenue: number;
    variableCost: number;
    contributionMargin: number;
  }>;
  totalRevenue: number;
  totalVariableCost: number;
  totalContributionMargin: number;
  netProfit: number;
  totalUnitsSold: number;
};

type BreakEvenAnalysis = {
  canCompute: boolean;
  weightedAverageContributionMargin: number;
  weightedAverageSellingPrice: number;
  weightedAverageVariableCost: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  totalUnitsSold: number;
};

type GraphPoint = {
  units: number;
  totalRevenue: number;
  totalCost: number;
};

type WeightedBreakEvenRow = {
  productName: string;
  revenuePerItem: number;
  actualUnitsSoldToday: number;
  salesRatio: number;
  weightedBreakEvenUnits: number;
  weightedTargetProfit: number;
  status: "needs more sales" | "meets requirement";
  deficitUnits: number;
  revenueToday: number;
  profitToday: number;
};

type WeightedBreakEvenSummary = {
  totalUnitsToday: number;
  totalBreakEvenUnits: number;
  rows: WeightedBreakEvenRow[];
};

type MaterialProcurementRecommendation = {
  material: string;
  requiredQuantity: number;
};

type ProcurementRow = {
  id: string;
  material: string;
  totalAvailable: string;
  totalProcurementCost: string;
};

const SVG_WIDTH = 760;
const SVG_HEIGHT = 360;
const GRAPH_PADDING = 48;

const STEP_TITLES = [
  "Step 1: Define Input Data",
  "Step 2: Compute Unit Economics",
  "Step 3: Daily Sales Input Page",
  "Step 4: Profit Analysis",
  "Step 5: Break-Even Analysis",
  "Step 6: Line Graph",
  "Step 7: Revenue Per Product (Today)",
  "Step 8: Final Output Summary"
];

const INITIAL_PRODUCTS: ProductRow[] = [
  {
    id: "p-1",
    productName: "",
    packSize: "",
    sellingPrice: "",
    variableCost: "",
    unitsSoldToday: ""
  }
];

const INITIAL_COST_ROWS: CostRow[] = [
  { id: "rent", costName: "Rent", amount: "" },
  { id: "salaries", costName: "Salaries", amount: "" },
  { id: "utilities", costName: "Utilities", amount: "" },
  { id: "equipment", costName: "Equipment", amount: "" },
  { id: "marketing", costName: "Marketing budget", amount: "" },
  { id: "budget", costName: "Budget (overall constraint)", amount: "", isBudget: true },
  { id: "other", costName: "Other fixed costs", amount: "" }
];

const INITIAL_PROCUREMENT_ROWS: ProcurementRow[] = [
  {
    id: "pr-1",
    material: "",
    totalAvailable: "",
    totalProcurementCost: ""
  }
];

function toNumber(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) {
    return null;
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function formatPhp(value: number): string {
  if (!Number.isFinite(value)) {
    return "Not reachable";
  }

  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "Not reachable";
  }

  return Number.isInteger(value) ? value.toLocaleString("en-PH") : value.toLocaleString("en-PH", { maximumFractionDigits: 4 });
}

function getStep8ProfitDisplay(value: number): { label: string; amount: number } {
  if (value < 0) {
    return {
      label: "Total Needed Contribution To Break-even",
      amount: Math.abs(value)
    };
  }

  return {
    label: "Total Profit",
    amount: value
  };
}

function createGraphPoints(
  fixedCostTotal: number,
  weightedAverageSellingPrice: number,
  weightedAverageVariableCost: number,
  breakEvenUnits: number,
  totalUnitsSold: number
): { points: GraphPoint[]; maxUnits: number; maxAmount: number } {
  const candidateMaxUnits = Number.isFinite(breakEvenUnits)
    ? Math.max(totalUnitsSold * 1.4, breakEvenUnits * 1.25, 10)
    : Math.max(totalUnitsSold * 1.6, 10);

  const maxUnits = Math.ceil(candidateMaxUnits);
  const points: GraphPoint[] = [];
  const slices = 12;

  for (let index = 0; index <= slices; index += 1) {
    const units = (maxUnits / slices) * index;
    const totalRevenue = weightedAverageSellingPrice * units;
    const totalCost = fixedCostTotal + weightedAverageVariableCost * units;
    points.push({ units, totalRevenue, totalCost });
  }

  const maxAmount = Math.max(...points.map((point) => Math.max(point.totalRevenue, point.totalCost)), fixedCostTotal, 1);
  return { points, maxUnits, maxAmount };
}

export default function BusinessAnalysisWorkspace() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>(INITIAL_PRODUCTS);
  const [costRows, setCostRows] = useState<CostRow[]>(INITIAL_COST_ROWS);
  const [nextProductId, setNextProductId] = useState(2);
  const [nextCostId, setNextCostId] = useState(1);
  const [procurementRows, setProcurementRows] = useState<ProcurementRow[]>(INITIAL_PROCUREMENT_ROWS);
  const [nextProcurementId, setNextProcurementId] = useState(2);
  const [planningDataVersion, setPlanningDataVersion] = useState(0);
  const [hasLoadedProcurementFromStorage, setHasLoadedProcurementFromStorage] = useState(false);

  const [lockStatusLoading, setLockStatusLoading] = useState(true);
  const [serverLockEnabled, setServerLockEnabled] = useState(false);
  const [locksDisabledByUser, setLocksDisabledByUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ state: "idle" | "saving" | "success" | "error"; message: string }>({
    state: "idle",
    message: ""
  });

  useEffect(() => {
    if (!shouldAutofillLocalInput()) {
      return;
    }

    const seed = getLocalBusinessAutofillSeed();

    seedLocalPlanningData();
    setProducts(seed.products.map((product) => ({ ...product, variableCost: "" })));
    setCostRows(seed.costRows);
    setNextProductId(seed.nextProductId);
    setNextCostId(seed.nextCostId);

    const storedProcurement = loadProcurementData();
    if (storedProcurement.length > 0) {
      setProcurementRows(
        storedProcurement.map((row, index) => ({
          id: `pr-${index + 1}`,
          material: row.material,
          totalAvailable: row.totalAvailable.toString(),
          totalProcurementCost: row.totalProcurementCost.toString()
        }))
      );
      setNextProcurementId(storedProcurement.length + 1);
    }

    setHasLoadedProcurementFromStorage(true);
  }, []);

  useEffect(() => {
    if (hasLoadedProcurementFromStorage) {
      return;
    }

    const storedProcurement = loadProcurementData();
    if (storedProcurement.length > 0) {
      setProcurementRows(
        storedProcurement.map((row, index) => ({
          id: `pr-${index + 1}`,
          material: row.material,
          totalAvailable: row.totalAvailable.toString(),
          totalProcurementCost: row.totalProcurementCost.toString()
        }))
      );
      setNextProcurementId(storedProcurement.length + 1);
    }

    setHasLoadedProcurementFromStorage(true);
  }, [hasLoadedProcurementFromStorage]);

  useEffect(() => {
    if (!hasLoadedProcurementFromStorage) {
      return;
    }

    const cleanRows: StoredProcurementData[] = procurementRows
      .map((row) => {
        const available = toNumber(row.totalAvailable);
        const totalCost = toNumber(row.totalProcurementCost);
        if (!row.material.trim() || available === null || available <= 0 || totalCost === null || totalCost < 0) {
          return null;
        }

        return {
          material: row.material.trim(),
          totalAvailable: available,
          totalProcurementCost: totalCost
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    saveProcurementData(cleanRows);
  }, [procurementRows, hasLoadedProcurementFromStorage]);

  useEffect(() => {
    const productNames = Array.from(
      new Set(
        products
          .map((product) => product.productName.trim())
          .filter((productName) => productName.length > 0)
      )
    );

    saveBusinessAnalysisProducts(productNames);
  }, [products]);

  useEffect(() => {
    const handlePlanningDataUpdate = () => {
      setPlanningDataVersion((previous) => previous + 1);
    };

    window.addEventListener("storage", handlePlanningDataUpdate);
    window.addEventListener(PLANNING_DATA_UPDATED_EVENT, handlePlanningDataUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handlePlanningDataUpdate);
      window.removeEventListener(PLANNING_DATA_UPDATED_EVENT, handlePlanningDataUpdate as EventListener);
    };
  }, []);

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
  }, []);

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    let cancelled = false;

    const loadLockStatus = async () => {
      setLockStatusLoading(true);

      try {
        const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/locks/status", {
          method: "GET",
          headers
        });

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
  }, [authLoading, authorized]);

  const businessPagesLocked = serverLockEnabled && !locksDisabledByUser;

  const inferredVariableCostByProduct = useMemo(
    () => computeInferredVariableCostByProduct(products.map((product) => product.productName)),
    [products, planningDataVersion]
  );

  const step1Data = useMemo<Step1Data>(() => {
    const errors: string[] = [];
    const parsedProducts: ParsedProduct[] = [];
    const parsedCosts: ParsedCost[] = [];
    const seenProductNames = new Set<string>();

    products.forEach((product, index) => {
      const rowNumber = index + 1;
      const productName = product.productName.trim();
      const productNameKey = normalizePlanningLabel(productName);

      if (!productName) {
        errors.push(`Product row ${rowNumber}: Product Name is required.`);
      } else if (seenProductNames.has(productNameKey)) {
        errors.push(`Product row ${rowNumber}: Product Name must be unique.`);
      } else {
        seenProductNames.add(productNameKey);
      }

      if (!product.packSize.trim()) {
        errors.push(`Product row ${rowNumber}: Pack Size is required (descriptive only).`);
      }

      const sellingPrice = toNumber(product.sellingPrice);
      if (sellingPrice === null || sellingPrice <= 0) {
        errors.push(`Product row ${rowNumber}: Selling Price must be a number greater than 0 (PHP per item).`);
      }

      let variableCost: number | null = null;
      if (productName) {
        const inferred = inferredVariableCostByProduct.get(productNameKey);

        if (!inferred || !inferred.hasRequirements) {
          errors.push(`Product row ${rowNumber}: Variable Cost is inferred. Add material requirements for ${productName} on /materials.`);
        } else if (inferred.missingMaterials.length > 0) {
          errors.push(
            `Product row ${rowNumber}: Missing procurement data for material(s) ${inferred.missingMaterials.join(", ")}. Complete Procurement Data on /materials.`
          );
        } else if (inferred.variableCostPerItem === null || inferred.variableCostPerItem < 0) {
          errors.push(`Product row ${rowNumber}: Inferred Variable Cost is invalid. Check material quantities and procurement totals on /materials.`);
        } else {
          variableCost = inferred.variableCostPerItem;
        }
      }

      if (sellingPrice !== null && sellingPrice > 0 && variableCost !== null && variableCost >= 0) {
        const contributionMargin = sellingPrice - variableCost;
        parsedProducts.push({
          id: product.id,
          productName,
          packSize: product.packSize.trim(),
          sellingPrice,
          variableCost,
          contributionMargin,
          contributionMarginRatio: contributionMargin / sellingPrice
        });
      }
    });

    costRows.forEach((cost, index) => {
      const rowNumber = index + 1;
      const name = cost.costName.trim();

      if (!name) {
        errors.push(`Cost row ${rowNumber}: Cost Name is required.`);
      }

      const amount = toNumber(cost.amount);
      if (amount === null || amount < 0) {
        errors.push(`Cost row ${rowNumber}: Amount must be a number that is 0 or greater.`);
      }

      if (name && amount !== null && amount >= 0) {
        parsedCosts.push({
          id: cost.id,
          costName: name,
          amount,
          isBudget: Boolean(cost.isBudget)
        });
      }
    });

    const budgetRow = parsedCosts.find((cost) => cost.isBudget);
    if (!budgetRow) {
      errors.push("Budget row is required and must contain an amount.");
    }

    const fixedCostRows = parsedCosts.filter((cost) => !cost.isBudget);
    const fixedCostTotal = fixedCostRows.length > 0 ? fixedCostRows.reduce((sum, row) => sum + row.amount, 0) : null;

    return {
      errors,
      parsedProducts,
      parsedCosts,
      budget: budgetRow?.amount ?? null,
      fixedCostTotal
    };
  }, [products, costRows, inferredVariableCostByProduct]);

  const unitsData = useMemo<UnitsData>(() => {
    const errors: string[] = [];
    const unitsByProductId = new Map<string, number>();

    products.forEach((product, index) => {
      const units = toNumber(product.unitsSoldToday);
      if (units === null || units < 0 || !Number.isInteger(units)) {
        errors.push(`Units Sold row ${index + 1}: Units Sold Today must be a whole number that is 0 or greater.`);
        return;
      }

      unitsByProductId.set(product.id, units);
    });

    return {
      errors,
      unitsByProductId
    };
  }, [products]);

  const profitAnalysis = useMemo<ProfitAnalysis | null>(() => {
    if (step1Data.errors.length > 0 || step1Data.fixedCostTotal === null || unitsData.errors.length > 0) {
      return null;
    }

    const rows = step1Data.parsedProducts.map((product) => {
      const unitsSold = unitsData.unitsByProductId.get(product.id) ?? 0;
      const revenue = product.sellingPrice * unitsSold;
      const variableCost = product.variableCost * unitsSold;
      const contributionMargin = revenue - variableCost;

      return {
        productName: product.productName,
        unitsSold,
        revenue,
        variableCost,
        contributionMargin
      };
    });

    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const totalVariableCost = rows.reduce((sum, row) => sum + row.variableCost, 0);
    const totalContributionMargin = totalRevenue - totalVariableCost;
    const netProfit = totalContributionMargin - step1Data.fixedCostTotal;
    const totalUnitsSold = rows.reduce((sum, row) => sum + row.unitsSold, 0);

    return {
      rows,
      totalRevenue,
      totalVariableCost,
      totalContributionMargin,
      netProfit,
      totalUnitsSold
    };
  }, [step1Data, unitsData]);

  const breakEvenAnalysis = useMemo<BreakEvenAnalysis | null>(() => {
    if (!profitAnalysis || step1Data.fixedCostTotal === null) {
      return null;
    }

    const totalUnitsSold = profitAnalysis.totalUnitsSold;
    if (totalUnitsSold <= 0) {
      return {
        canCompute: false,
        weightedAverageContributionMargin: 0,
        weightedAverageSellingPrice: 0,
        weightedAverageVariableCost: 0,
        breakEvenUnits: Number.POSITIVE_INFINITY,
        breakEvenRevenue: Number.POSITIVE_INFINITY,
        totalUnitsSold
      };
    }

    const weightedAverageContributionMargin =
      step1Data.parsedProducts.reduce((sum, product) => {
        const units = unitsData.unitsByProductId.get(product.id) ?? 0;
        return sum + product.contributionMargin * units;
      }, 0) / totalUnitsSold;

    const weightedAverageSellingPrice =
      step1Data.parsedProducts.reduce((sum, product) => {
        const units = unitsData.unitsByProductId.get(product.id) ?? 0;
        return sum + product.sellingPrice * units;
      }, 0) / totalUnitsSold;

    const weightedAverageVariableCost =
      step1Data.parsedProducts.reduce((sum, product) => {
        const units = unitsData.unitsByProductId.get(product.id) ?? 0;
        return sum + product.variableCost * units;
      }, 0) / totalUnitsSold;

    if (weightedAverageContributionMargin <= 0) {
      return {
        canCompute: false,
        weightedAverageContributionMargin,
        weightedAverageSellingPrice,
        weightedAverageVariableCost,
        breakEvenUnits: Number.POSITIVE_INFINITY,
        breakEvenRevenue: Number.POSITIVE_INFINITY,
        totalUnitsSold
      };
    }

    const breakEvenUnits = Math.ceil(step1Data.fixedCostTotal / weightedAverageContributionMargin);
    const breakEvenRevenue = breakEvenUnits * weightedAverageSellingPrice;

    return {
      canCompute: true,
      weightedAverageContributionMargin,
      weightedAverageSellingPrice,
      weightedAverageVariableCost,
      breakEvenUnits,
      breakEvenRevenue,
      totalUnitsSold
    };
  }, [profitAnalysis, step1Data, unitsData]);

  const graphData = useMemo(() => {
    if (!breakEvenAnalysis || !breakEvenAnalysis.canCompute || !breakEvenAnalysis.totalUnitsSold || step1Data.fixedCostTotal === null) {
      return null;
    }

    const { points, maxUnits, maxAmount } = createGraphPoints(
      step1Data.fixedCostTotal,
      breakEvenAnalysis.weightedAverageSellingPrice,
      breakEvenAnalysis.weightedAverageVariableCost,
      breakEvenAnalysis.breakEvenUnits,
      breakEvenAnalysis.totalUnitsSold
    );

    return {
      points,
      maxUnits,
      maxAmount
    };
  }, [breakEvenAnalysis, step1Data.fixedCostTotal]);

  const weightedBreakEvenSummary = useMemo<WeightedBreakEvenSummary | null>(() => {
    if (
      step1Data.errors.length > 0 ||
      unitsData.errors.length > 0 ||
      !breakEvenAnalysis ||
      !breakEvenAnalysis.canCompute ||
      !Number.isFinite(breakEvenAnalysis.breakEvenUnits)
    ) {
      return null;
    }

    const totalUnitsToday = step1Data.parsedProducts.reduce(
      (sum, product) => sum + (unitsData.unitsByProductId.get(product.id) ?? 0),
      0
    );

    if (totalUnitsToday <= 0) {
      return null;
    }

    const rows = step1Data.parsedProducts.map((product) => {
      const actualUnitsSoldToday = unitsData.unitsByProductId.get(product.id) ?? 0;
      const salesRatio = actualUnitsSoldToday / totalUnitsToday;
      const weightedBreakEvenUnits = salesRatio * breakEvenAnalysis.breakEvenUnits;
      const status: WeightedBreakEvenRow["status"] =
        actualUnitsSoldToday < weightedBreakEvenUnits ? "needs more sales" : "meets requirement";
      const deficitUnits = status === "needs more sales" ? weightedBreakEvenUnits - actualUnitsSoldToday : 0;
      const weightedTargetProfit = weightedBreakEvenUnits * product.sellingPrice;
      const revenueToday = actualUnitsSoldToday * product.sellingPrice;
      const profitToday = weightedTargetProfit - revenueToday;

      return {
        productName: product.productName,
        revenuePerItem: product.sellingPrice,
        actualUnitsSoldToday,
        salesRatio,
        weightedBreakEvenUnits,
        weightedTargetProfit,
        status,
        deficitUnits,
        revenueToday,
        profitToday
      };
    });

    return {
      totalUnitsToday,
      totalBreakEvenUnits: breakEvenAnalysis.breakEvenUnits,
      rows
    };
  }, [breakEvenAnalysis, step1Data, unitsData]);

  const weightedBreakEvenTotals = useMemo(() => {
    if (!weightedBreakEvenSummary) {
      return null;
    }

    const totalDeficitUnits = weightedBreakEvenSummary.rows.reduce((sum, row) => sum + row.deficitUnits, 0);
    const totalRevenueToday = weightedBreakEvenSummary.rows.reduce((sum, row) => sum + row.revenueToday, 0);
    const totalProfitToday = weightedBreakEvenSummary.rows.reduce((sum, row) => sum + row.profitToday, 0);
    const productsNeedingMoreSales = weightedBreakEvenSummary.rows.filter((row) => row.status === "needs more sales").length;

    return {
      totalDeficitUnits,
      totalRevenueToday,
      totalProfitToday,
      productsNeedingMoreSales
    };
  }, [weightedBreakEvenSummary]);

  const materialProcurementRecommendations = useMemo<MaterialProcurementRecommendation[]>(() => {
    if (!weightedBreakEvenSummary) {
      return [];
    }

    const materialsData = loadMaterialRequirements();
    if (materialsData.length === 0) {
      return [];
    }

    const weightedUnitsByProduct = new Map<string, number>();
    weightedBreakEvenSummary.rows.forEach((row) => {
      weightedUnitsByProduct.set(normalizePlanningLabel(row.productName), row.weightedBreakEvenUnits);
    });

    const totalsByMaterial = new Map<string, MaterialProcurementRecommendation>();

    materialsData.forEach((materialRow) => {
      const productKey = normalizePlanningLabel(materialRow.product);
      const requiredUnits = weightedUnitsByProduct.get(productKey);

      if (requiredUnits === undefined) {
        return;
      }

      const materialKey = normalizePlanningLabel(materialRow.material);
      if (!materialKey) {
        return;
      }

      const requiredQuantity = requiredUnits * materialRow.quantityNeededPerProduct;
      const existing = totalsByMaterial.get(materialKey) ?? {
        material: materialRow.material.trim(),
        requiredQuantity: 0
      };

      existing.requiredQuantity += requiredQuantity;
      totalsByMaterial.set(materialKey, existing);
    });

    return Array.from(totalsByMaterial.values())
      .filter((row) => row.requiredQuantity > 0)
      .sort((a, b) => a.material.localeCompare(b.material));
  }, [weightedBreakEvenSummary]);

  const graphPathData = useMemo(() => {
    if (!graphData) {
      return null;
    }

    const toX = (units: number) => GRAPH_PADDING + (units / graphData.maxUnits) * (SVG_WIDTH - GRAPH_PADDING * 2);
    const toY = (amount: number) => SVG_HEIGHT - GRAPH_PADDING - (amount / graphData.maxAmount) * (SVG_HEIGHT - GRAPH_PADDING * 2);

    const revenuePath = graphData.points.map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.units)} ${toY(point.totalRevenue)}`).join(" ");
    const costPath = graphData.points.map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.units)} ${toY(point.totalCost)}`).join(" ");

    const breakEvenPoint =
      breakEvenAnalysis && Number.isFinite(breakEvenAnalysis.breakEvenUnits)
        ? {
            x: toX(breakEvenAnalysis.breakEvenUnits),
            y: toY(breakEvenAnalysis.breakEvenRevenue),
            units: breakEvenAnalysis.breakEvenUnits,
            amount: breakEvenAnalysis.breakEvenRevenue
          }
        : null;

    return {
      revenuePath,
      costPath,
      breakEvenPoint
    };
  }, [graphData, breakEvenAnalysis]);

  const getStepValidationErrors = (step: number): string[] => {
    if (step === 1) {
      return step1Data.errors;
    }

    if (step === 3) {
      if (step1Data.errors.length > 0) {
        return ["Complete Step 1 before entering units sold."];
      }

      return unitsData.errors;
    }

    if (step === 4) {
      if (!profitAnalysis) {
        return ["Complete Steps 1 and 3 with valid values before profit analysis."];
      }

      return [];
    }

    if (step === 5) {
      if (!breakEvenAnalysis || !breakEvenAnalysis.canCompute) {
        return ["Break-even cannot be computed yet. Complete prior steps with valid data."];
      }

      return [];
    }

    if (step === 6) {
      if (!graphData || !graphPathData) {
        return ["Line graph requires valid break-even data."];
      }

      return [];
    }

    if (step === 7 || step === 8) {
      if (!weightedBreakEvenSummary) {
        return ["Weighted break-even and revenue outputs require valid product sales for today."];
      }

      return [];
    }

    return [];
  };

  const goNext = () => {
    const errors = getStepValidationErrors(currentStep);
    if (errors.length > 0) {
      setStepErrors(errors);
      return;
    }

    setStepErrors([]);
    setCurrentStep((previous) => Math.min(previous + 1, STEP_TITLES.length));
  };

  const goBack = () => {
    if (businessPagesLocked && currentStep === 3) {
      setStepErrors([]);
      setCurrentStep(1);
      return;
    }

    setStepErrors([]);
    setCurrentStep((previous) => Math.max(previous - 1, 1));
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string) => {
    setProducts((previous) => previous.map((product) => (product.id === id ? { ...product, [field]: value } : product)));
  };

  const updateCostRow = (id: string, field: keyof CostRow, value: string) => {
    setCostRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProductRow = () => {
    const newId = `p-${nextProductId}`;
    setProducts((previous) => [
      ...previous,
      {
        id: newId,
        productName: "",
        packSize: "",
        sellingPrice: "",
        variableCost: "",
        unitsSoldToday: ""
      }
    ]);
    setNextProductId((prev) => prev + 1);
  };

  const removeProductRow = (id: string) => {
    setProducts((previous) => (previous.length > 1 ? previous.filter((product) => product.id !== id) : previous));
  };

  const addCostRow = () => {
    const newId = `cost-extra-${nextCostId}`;
    setCostRows((previous) => [...previous, { id: newId, costName: "", amount: "" }]);
    setNextCostId((prev) => prev + 1);
  };

  const removeCostRow = (id: string) => {
    setCostRows((previous) => previous.filter((row) => row.id !== id || row.isBudget));
  };

  const updateProcurementRow = (id: string, field: keyof ProcurementRow, value: string) => {
    setProcurementRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProcurementRow = () => {
    const id = `pr-${nextProcurementId}`;
    setProcurementRows((previous) => [
      ...previous,
      {
        id,
        material: "",
        totalAvailable: "",
        totalProcurementCost: ""
      }
    ]);
    setNextProcurementId((prev) => prev + 1);
  };

  const removeProcurementRow = (id: string) => {
    setProcurementRows((previous) => (previous.length > 1 ? previous.filter((row) => row.id !== id) : previous));
  };

  const toggleLockMode = () => {
    if (businessPagesLocked) {
      disableAllPageLocks();
      setLocksDisabledByUser(true);
      return;
    }

    enableAllPageLocks();
    setLocksDisabledByUser(false);
    setCurrentStep(1);
  };

  const goToLockedStep3 = () => {
    setStepErrors([]);
    setCurrentStep(3);
  };

  const addDataToSupabase = async () => {
    if (!weightedBreakEvenSummary) {
      setSaveStatus({ state: "error", message: "Cannot save yet. Complete Step 8 outputs first." });
      return;
    }

    setSaveStatus({ state: "saving", message: "Saving data to Supabase..." });

    const materialsData = loadMaterialRequirements();
    const procurementData = loadProcurementData();

    const businessDataPayload = weightedBreakEvenSummary.rows.map((row) => ({
      productName: row.productName,
      revenuePerItem: row.revenuePerItem,
      weightedBreakEvenUnits: row.weightedBreakEvenUnits,
      weightedTargetProfit: row.weightedTargetProfit,
      actualUnitsSoldToday: row.actualUnitsSoldToday,
      deficitUnits: row.deficitUnits,
      revenueToday: row.revenueToday,
      profitToday: row.profitToday
    }));

    try {
      const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/basis/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessAnalysisData: businessDataPayload,
          materialsData,
          procurementData
        })
      });

      const data = (await response.json()) as { message?: string; saved?: boolean };
      if (!response.ok || !data.saved) {
        setSaveStatus({ state: "error", message: data.message ?? "Failed to save basis data to Supabase." });
        return;
      }

      setSaveStatus({ state: "success", message: "Basis data successfully inserted into Supabase." });

      const lockHeaders = await getSessionAuthHeaders({ "Content-Type": "application/json" });
      const lockResponse = await fetch("/api/locks/status", {
        method: "GET",
        headers: lockHeaders
      });

      if (lockResponse.ok) {
        const lockData = (await lockResponse.json()) as { lockEnabled?: boolean };
        setServerLockEnabled(Boolean(lockData.lockEnabled));
      }
    } catch {
      setSaveStatus({ state: "error", message: "Failed to save basis data to Supabase." });
    }
  };

  const step8ProfitDisplay = useMemo(() => {
    if (!weightedBreakEvenTotals) {
      return null;
    }

    return getStep8ProfitDisplay(weightedBreakEvenTotals.totalProfitToday);
  }, [weightedBreakEvenTotals]);

  const handlePrimaryAction = () => {
    if (currentStep === STEP_TITLES.length) {
      void addDataToSupabase();
      return;
    }

    goNext();
  };

  const profitabilityStatus =
    profitAnalysis && Number.isFinite(profitAnalysis.netProfit)
      ? profitAnalysis.netProfit > 0
        ? "PROFIT"
        : profitAnalysis.netProfit === 0
          ? "BREAK EVEN"
          : "LOSS"
      : "Unavailable";

  const breakEvenInsight =
    breakEvenAnalysis && breakEvenAnalysis.canCompute
      ? `Break-even is reached at approximately ${formatNumber(breakEvenAnalysis.breakEvenUnits)} units and ${formatPhp(
          breakEvenAnalysis.breakEvenRevenue
        )} revenue.`
      : "Break-even cannot be computed with the current sales mix. Increase contribution margin or units sold mix.";

  if (authLoading) {
    return (
      <main className="page-shell">
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Checking account access...</h2>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  const showLockedProcurementPage = businessPagesLocked && currentStep < 3;

  if (showLockedProcurementPage) {
    return (
      <main className="page-shell">
        <section className="hero">
          <h1>UNLOCKED PAGE</h1>
          <p>Lock mode is active. This first page now serves as the editable Procurement page.</p>
          <div className="nav">
            <a href="/">Unlocked Page</a>
            <a href="/materials">Locked Page</a>
            <a href="/analytics">Detailed Analytics</a>
            <button type="button" onClick={toggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
              Disable Lock
            </button>
            <button type="button" onClick={signOut} style={{ maxWidth: "220px" }}>
              Sign Out ({email})
            </button>
          </div>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>PROCUREMENT PAGE (UNLOCKED)</h2>
          <p className="muted">Required structure: Material | Total Available | Total Procurement Cost (PHP)</p>

          <div className="table-wrap" style={{ marginTop: "0.7rem" }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Total Available</th>
                  <th>Total Procurement Cost (PHP)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {procurementRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="text"
                        value={row.material}
                        onChange={(event) => updateProcurementRow(row.id, "material", event.target.value)}
                        placeholder="Example: Sugar"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.totalAvailable}
                        onChange={(event) => updateProcurementRow(row.id, "totalAvailable", event.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.totalProcurementCost}
                        onChange={(event) => updateProcurementRow(row.id, "totalProcurementCost", event.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeProcurementRow(row.id)}
                        disabled={procurementRows.length <= 1}
                        style={{ maxWidth: "130px" }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addProcurementRow} style={{ marginTop: "0.75rem", maxWidth: "240px" }}>
            Add Procurement Row
          </button>

          <div className="wizard-nav" style={{ marginTop: "0.9rem" }}>
            <button type="button" onClick={goToLockedStep3} style={{ maxWidth: "180px", justifySelf: "end" }}>
              Next Step (Go to Step 3)
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Wilson Business Analysis Assistant</h1>
        <p>
          This assistant enforces a strict, step-by-step flow. Missing values stop progression and are requested directly inside this website.
        </p>
        <div className="nav">
          <a href="/">Business Analysis</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <button type="button" onClick={toggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
            Enable Lock
          </button>
          <button type="button" onClick={signOut} style={{ maxWidth: "220px" }}>
            Sign Out ({email})
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1.25rem" }}>
        <h2>{STEP_TITLES[currentStep - 1]}</h2>
        <p className="muted">
          Progress step {currentStep} of {STEP_TITLES.length}
        </p>

        {lockStatusLoading ? <p className="muted">Checking lock status from Supabase...</p> : null}
        {businessPagesLocked ? <p className="muted" style={{ marginTop: "0.45rem" }}>Lock mode is active.</p> : null}

        <div className="stepper" aria-label="Business analysis steps">
          {STEP_TITLES.map((title, index) => {
            const step = index + 1;
            const className = step === currentStep ? "step-pill active" : step < currentStep ? "step-pill done" : "step-pill";
            const stepLocked = businessPagesLocked && step < 3;
            return (
              <button
                key={title}
                type="button"
                className={className}
                onClick={() => {
                  if (stepLocked) {
                    return;
                  }

                  setCurrentStep(step <= currentStep ? step : currentStep);
                }}
                aria-current={step === currentStep ? "step" : undefined}
                disabled={stepLocked}
              >
                {step}
              </button>
            );
          })}
        </div>

        {stepErrors.length > 0 ? (
          <UserErrorPanel
            title="Missing or Invalid Data"
            message={stepErrors.join(" ")}
            actionLabel="Review Inputs"
            onAction={() => setStepErrors([])}
          />
        ) : null}

        {currentStep === 1 ? (
          <div>
            {(
              <>
                <p className="muted">
                  Rules: Selling Price must be entered per item only. Variable Cost per item is inferred from Material Requirements and Procurement Data
                  on /materials. Pack Size is descriptive only and is not included in cost computation.
                </p>

                <h3 style={{ marginTop: "1rem" }}>Page 1A: Product Information (All Products)</h3>
                <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Pack Size (descriptive)</th>
                        <th>Selling Price (PHP per item)</th>
                        <th>Variable Cost (PHP per item)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <input
                              type="text"
                              value={product.productName}
                              onChange={(event) => updateProduct(product.id, "productName", event.target.value)}
                              placeholder="Example: Product A"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={product.packSize}
                              onChange={(event) => updateProduct(product.id, "packSize", event.target.value)}
                              placeholder="Example: 6-pack"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.sellingPrice}
                              onChange={(event) => updateProduct(product.id, "sellingPrice", event.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            {(() => {
                              const inferred = inferredVariableCostByProduct.get(normalizePlanningLabel(product.productName));
                              const inferredValue = inferred?.variableCostPerItem;

                              return (
                                <>
                                  <input
                                    type="text"
                                    readOnly
                                    disabled
                                    className="inferred-cost-input"
                                    value={
                                      inferredValue !== null && inferredValue !== undefined && Number.isFinite(inferredValue)
                                        ? inferredValue.toFixed(4)
                                        : ""
                                    }
                                    placeholder="Inferred from /materials"
                                  />
                                  <p className="muted inline-help">Auto-calculated from Material Requirements and Procurement Data.</p>
                                </>
                              );
                            })()}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeProductRow(product.id)}
                              disabled={products.length <= 1}
                              style={{ maxWidth: "140px" }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addProductRow} style={{ marginTop: "0.75rem", maxWidth: "220px" }}>
                  Add Product Row
                </button>

                <h3 style={{ marginTop: "1.25rem" }}>Page 1B: Fixed Costs + Budget</h3>
                <p className="muted">Budget stays in this table, but is treated as the break-even and planning constraint, not as product cost.</p>
                <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Cost Name</th>
                        <th>Amount (PHP)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costRows.map((cost) => (
                        <tr key={cost.id}>
                          <td>
                            <input
                              type="text"
                              value={cost.costName}
                              onChange={(event) => updateCostRow(cost.id, "costName", event.target.value)}
                              placeholder={cost.isBudget ? "Budget (overall constraint)" : "Cost name"}
                              disabled={Boolean(cost.isBudget)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={cost.amount}
                              onChange={(event) => updateCostRow(cost.id, "amount", event.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            {cost.isBudget ? (
                              <span className="muted">Required row</span>
                            ) : (
                              <button type="button" onClick={() => removeCostRow(cost.id)} style={{ maxWidth: "140px" }}>
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addCostRow} style={{ marginTop: "0.75rem", maxWidth: "220px" }}>
                  Add Fixed Cost Row
                </button>
              </>
            )}
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div>
            <div className="formula-box">
              <p>Formulas:</p>
              <p>Contribution Margin = Selling Price - Variable Cost</p>
              <p>Contribution Margin Ratio = Contribution Margin / Selling Price</p>
            </div>

            {step1Data.errors.length > 0 ? (
              <UserErrorPanel
                title="Step 2 Needs Step 1 Data"
                message="Complete Step 1 with valid product and cost values before unit economics can be computed."
              />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Selling Price (PHP)</th>
                      <th>Variable Cost (PHP)</th>
                      <th>Contribution Margin (PHP)</th>
                      <th>Contribution Margin Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step1Data.parsedProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.productName}</td>
                        <td>{formatPhp(product.sellingPrice)}</td>
                        <td>{formatPhp(product.variableCost)}</td>
                        <td>{formatPhp(product.contributionMargin)}</td>
                        <td>{formatPercent(product.contributionMarginRatio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div>
            <p className="muted">Required input: enter units sold today for each product.</p>

            {step1Data.errors.length > 0 ? (
              <UserErrorPanel
                title="Step 3 Needs Step 1 Data"
                message="Complete Step 1 first so products are defined before entering units sold."
              />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units Sold Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.productName || "Unnamed Product"}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={product.unitsSoldToday}
                            onChange={(event) => updateProduct(product.id, "unitsSoldToday", event.target.value)}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div>
            <div className="formula-box">
              <p>Compact formula set:</p>
              <p>Revenue = sum(Price x Units), Variable Cost = sum(Var Cost x Units), Net Profit = Revenue - Variable Cost - Fixed Cost.</p>
            </div>

            {!profitAnalysis || step1Data.fixedCostTotal === null ? (
              <UserErrorPanel
                title="Step 4 Needs Valid Inputs"
                message="Complete Step 1 and Step 3 with valid values before profit analysis."
              />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value (PHP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Total Revenue</td>
                      <td>{formatPhp(profitAnalysis.totalRevenue)}</td>
                    </tr>
                    <tr>
                      <td>Total Variable Cost</td>
                      <td>{formatPhp(profitAnalysis.totalVariableCost)}</td>
                    </tr>
                    <tr>
                      <td>Total Contribution Margin</td>
                      <td>{formatPhp(profitAnalysis.totalContributionMargin)}</td>
                    </tr>
                    <tr>
                      <td>Total Fixed Cost</td>
                      <td>{formatPhp(step1Data.fixedCostTotal)}</td>
                    </tr>
                    <tr>
                      <td>Net Profit</td>
                      <td>{formatPhp(profitAnalysis.netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {profitAnalysis ? (
              <p style={{ marginTop: "0.75rem" }}>
                Interpretation: <strong>{profitabilityStatus}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        {currentStep === 5 ? (
          <div>
            <div className="formula-box">
              <p>Compact break-even formulas:</p>
              <p>Weighted CM = sum(Product CM x Sales Mix), BE Units = Fixed Cost / Weighted CM, BE Revenue = BE Units x Weighted Selling Price.</p>
            </div>

            {!breakEvenAnalysis ? (
              <UserErrorPanel title="Step 5 Needs Prior Data" message="Complete Steps 1 to 4 first." />
            ) : !breakEvenAnalysis.canCompute ? (
              <UserErrorPanel
                title="Break-Even Not Reachable"
                message="Provide at least one positive Units Sold value and ensure weighted contribution margin is positive."
              />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Break-even units</td>
                      <td>{formatNumber(breakEvenAnalysis.breakEvenUnits)}</td>
                    </tr>
                    <tr>
                      <td>Break-even revenue</td>
                      <td>{formatPhp(breakEvenAnalysis.breakEvenRevenue)}</td>
                    </tr>
                    <tr>
                      <td>Weighted average contribution margin</td>
                      <td>{formatPhp(breakEvenAnalysis.weightedAverageContributionMargin)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ marginTop: "0.75rem" }}>{breakEvenInsight}</p>
          </div>
        ) : null}

        {currentStep === 6 ? (
          <div>
            <div className="formula-box">
              <p>Graph equations:</p>
              <p>Total Revenue Line = Weighted Average Selling Price x Units Sold</p>
              <p>Total Cost Line = Total Fixed Cost + (Weighted Average Variable Cost x Units Sold)</p>
            </div>

            {!graphData || !graphPathData ? (
              <UserErrorPanel
                title="Step 6 Needs Break-Even Inputs"
                message="Complete Steps 1 to 5 with valid data to generate the required line graph."
              />
            ) : (
              <div className="chart-wrap" style={{ marginTop: "0.8rem" }}>
                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="Total cost versus total revenue line graph">
                  <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="rgba(255,255,255,0.92)" />
                  <line
                    x1={GRAPH_PADDING}
                    y1={SVG_HEIGHT - GRAPH_PADDING}
                    x2={SVG_WIDTH - GRAPH_PADDING}
                    y2={SVG_HEIGHT - GRAPH_PADDING}
                    stroke="#261a12"
                    strokeWidth="2"
                  />
                  <line
                    x1={GRAPH_PADDING}
                    y1={GRAPH_PADDING}
                    x2={GRAPH_PADDING}
                    y2={SVG_HEIGHT - GRAPH_PADDING}
                    stroke="#261a12"
                    strokeWidth="2"
                  />

                  <path d={graphPathData.revenuePath} fill="none" stroke="#008a8a" strokeWidth="3.5" />
                  <path d={graphPathData.costPath} fill="none" stroke="#ea4d2c" strokeWidth="3.5" />

                  {graphPathData.breakEvenPoint ? (
                    <g>
                      <circle cx={graphPathData.breakEvenPoint.x} cy={graphPathData.breakEvenPoint.y} r="6.5" fill="#1c1a17" />
                      <text x={graphPathData.breakEvenPoint.x + 10} y={graphPathData.breakEvenPoint.y - 8} fontSize="12" fill="#1c1a17">
                        BEP ({formatNumber(graphPathData.breakEvenPoint.units)} units, {formatPhp(graphPathData.breakEvenPoint.amount)})
                      </text>
                    </g>
                  ) : null}

                  <text x={SVG_WIDTH / 2 - 45} y={SVG_HEIGHT - 12} fontSize="13" fill="#261a12">
                    Units sold
                  </text>
                  <text x={8} y={22} fontSize="13" fill="#261a12">
                    Amount (PHP)
                  </text>
                </svg>

                <div className="line-legend">
                  <span className="legend-item">
                    <span className="legend-dot legend-teal" />
                    Total Revenue Line
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot legend-orange" />
                    Total Cost Line
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {currentStep === 7 ? (
          <div>
            <p className="muted">Compact view: this step shows daily revenue by product only. Profit and break-even requirement are summarized in Steps 4 and 8.</p>

            {!weightedBreakEvenSummary ? (
              <UserErrorPanel
                title="Step 7 Needs Weighted Sales Data"
                message="Complete prior steps and provide valid today sales values to compute per-product revenue insights."
              />
            ) : (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity Sold Today</th>
                      <th>Revenue Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightedBreakEvenSummary.rows.map((row) => (
                      <tr key={`revenue-row-${row.productName}`}>
                        <td>{row.productName}</td>
                        <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                        <td>{formatPhp(row.revenueToday)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {currentStep === 8 ? (
          <div>
            {!weightedBreakEvenSummary ? (
              <UserErrorPanel
                title="Final Output Needs Weighted Break-Even Data"
                message="Complete prior steps and provide valid today sales values before generating final output."
              />
            ) : (
              <>
                <div className="formula-box">
                  <p>Compact final summary:</p>
                  <p>Required units per product are weighted by today sales mix against total break-even units.</p>
                </div>

                {weightedBreakEvenTotals ? (
                  <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                    <table className="ops-table">
                      <thead>
                        <tr>
                          <th>Final Totals</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Total Units Sold Today</td>
                          <td>{formatNumber(weightedBreakEvenSummary.totalUnitsToday)}</td>
                        </tr>
                        <tr>
                          <td>Total Break-even Units</td>
                          <td>{formatNumber(weightedBreakEvenSummary.totalBreakEvenUnits)}</td>
                        </tr>
                        <tr>
                          <td>Total Deficit Units</td>
                          <td>{formatNumber(weightedBreakEvenTotals.totalDeficitUnits)}</td>
                        </tr>
                        <tr>
                          <td>Products Needing More Sales</td>
                          <td>{formatNumber(weightedBreakEvenTotals.productsNeedingMoreSales)}</td>
                        </tr>
                        <tr>
                          <td>Total Revenue Today</td>
                          <td>{formatPhp(weightedBreakEvenTotals.totalRevenueToday)}</td>
                        </tr>
                        <tr>
                          <td>{step8ProfitDisplay?.label ?? "Total Profit"}</td>
                          <td>{formatPhp(step8ProfitDisplay?.amount ?? 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Required Units (Weighted BE)</th>
                        <th>Actual Units Sold Today</th>
                        <th>Status</th>
                        <th>Deficit Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightedBreakEvenSummary.rows.map((row) => (
                        <tr key={`weighted-row-${row.productName}`}>
                          <td>{row.productName}</td>
                          <td>{formatNumber(row.weightedBreakEvenUnits)}</td>
                          <td>{formatNumber(row.actualUnitsSoldToday)}</td>
                          <td>{row.status}</td>
                          <td>{row.status === "needs more sales" ? formatNumber(row.deficitUnits) : "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: "0.85rem" }}>
                  <p>Based on this, you should procure the following quantities of materials:</p>
                  {materialProcurementRecommendations.length > 0 ? (
                    <div className="table-wrap" style={{ marginTop: "0.55rem" }}>
                      <table className="ops-table">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Required Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialProcurementRecommendations.map((row) => (
                            <tr key={`material-plan-${row.material}`}>
                              <td>{row.material}</td>
                              <td>{formatNumber(row.requiredQuantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="muted">materials_data is unavailable or incomplete, so material procurement quantities are skipped.</p>
                  )}
                </div>

                {saveStatus.state === "success" || saveStatus.state === "error" ? (
                  <p className="muted" style={{ marginTop: "0.85rem" }}>
                    {saveStatus.message}
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <div className="wizard-nav">
          <button type="button" onClick={goBack} disabled={currentStep === 1} style={{ maxWidth: "170px" }}>
            Previous Step
          </button>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={currentStep === STEP_TITLES.length && (saveStatus.state === "saving" || saveStatus.state === "success")}
            style={{ maxWidth: "170px", justifySelf: "end" }}
          >
            {currentStep === STEP_TITLES.length
              ? saveStatus.state === "saving"
                ? "Adding..."
                : saveStatus.state === "success"
                  ? "Added"
                  : "Add to Supabase"
              : "Next Step"}
          </button>
        </div>
      </section>
    </main>
  );
}
