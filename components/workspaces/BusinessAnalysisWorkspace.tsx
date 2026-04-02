"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import UserErrorPanel from "@/components/UserErrorPanel";
import {
  PLANNING_DATA_UPDATED_EVENT,
  computeInferredVariableCostByProduct,
  normalizePlanningLabel,
  saveBusinessAnalysisProducts
} from "@/lib/planningStorage";
import { getLocalBusinessAutofillSeed, seedLocalPlanningData, shouldAutofillLocalInput } from "@/testInput/localAutofill";

type ProductRow = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: string;
  variableCost: string;
  unitsSoldToday: string;
  demandLimit: string;
  productionLimit: string;
  inventoryLimit: string;
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

type SimplexConstraint = {
  name: string;
  coefficients: number[];
  rhs: number;
};

type SimplexIteration = {
  iteration: number;
  tableau: number[][];
  basicVariables: string[];
  entering?: string;
  leaving?: string;
  pivotRow?: number;
  pivotCol?: number;
  pivotValue?: number;
};

type SimplexResult = {
  status: "optimal" | "unbounded";
  message: string;
  variableNames: string[];
  columnNames: string[];
  iterations: SimplexIteration[];
  solution: number[];
  objectiveValue: number;
};

const EPSILON = 1e-9;
const MAX_SIMPLEX_ITERATIONS = 60;
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
  "Step 7: Define Conversion",
  "Step 8: Simplex Optimization",
  "Step 9: Final Output Summary"
];

const INITIAL_PRODUCTS: ProductRow[] = [
  {
    id: "p-1",
    productName: "",
    packSize: "",
    sellingPrice: "",
    variableCost: "",
    unitsSoldToday: "",
    demandLimit: "",
    productionLimit: "",
    inventoryLimit: ""
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

  return `₱${value.toLocaleString("en-PH", {
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

function cloneTableau(tableau: number[][]): number[][] {
  return tableau.map((row) => row.map((cell) => (Math.abs(cell) < EPSILON ? 0 : cell)));
}

function extractSimplexSolution(tableau: number[][], basicVariables: string[], variableNames: string[]): number[] {
  const rhsCol = tableau[0].length - 1;
  return variableNames.map((name) => {
    const rowIndex = basicVariables.findIndex((basic) => basic === name);
    if (rowIndex < 0) {
      return 0;
    }

    return tableau[rowIndex][rhsCol];
  });
}

function solveSimplex(objective: number[], constraints: SimplexConstraint[]): SimplexResult {
  const variableNames = objective.map((_, index) => `x${index + 1}`);
  const constraintCount = constraints.length;
  const variableCount = objective.length;
  const slackNames = constraints.map((_, index) => `s${index + 1}`);
  const columnNames = [...variableNames, ...slackNames, "RHS"];

  const tableau = Array.from({ length: constraintCount + 1 }, () => Array(variableCount + constraintCount + 1).fill(0));
  const basicVariables = [...slackNames];

  constraints.forEach((constraint, rowIndex) => {
    constraint.coefficients.forEach((coefficient, colIndex) => {
      tableau[rowIndex][colIndex] = coefficient;
    });

    tableau[rowIndex][variableCount + rowIndex] = 1;
    tableau[rowIndex][variableCount + constraintCount] = constraint.rhs;
  });

  objective.forEach((coefficient, colIndex) => {
    tableau[constraintCount][colIndex] = -coefficient;
  });

  const iterations: SimplexIteration[] = [
    {
      iteration: 0,
      tableau: cloneTableau(tableau),
      basicVariables: [...basicVariables]
    }
  ];

  for (let iteration = 1; iteration <= MAX_SIMPLEX_ITERATIONS; iteration += 1) {
    const objectiveRow = tableau[constraintCount];
    let enteringCol = -1;
    let mostNegative = -EPSILON;

    for (let col = 0; col < variableCount + constraintCount; col += 1) {
      if (objectiveRow[col] < mostNegative) {
        mostNegative = objectiveRow[col];
        enteringCol = col;
      }
    }

    if (enteringCol === -1) {
      const solution = extractSimplexSolution(tableau, basicVariables, variableNames);
      return {
        status: "optimal",
        message: "Optimal solution found.",
        variableNames,
        columnNames,
        iterations,
        solution,
        objectiveValue: tableau[constraintCount][variableCount + constraintCount]
      };
    }

    let leavingRow = -1;
    let minimumRatio = Number.POSITIVE_INFINITY;

    for (let row = 0; row < constraintCount; row += 1) {
      const pivotColumnValue = tableau[row][enteringCol];
      if (pivotColumnValue > EPSILON) {
        const ratio = tableau[row][variableCount + constraintCount] / pivotColumnValue;
        if (ratio < minimumRatio - EPSILON) {
          minimumRatio = ratio;
          leavingRow = row;
        }
      }
    }

    if (leavingRow === -1) {
      const solution = extractSimplexSolution(tableau, basicVariables, variableNames);
      return {
        status: "unbounded",
        message: "Objective is unbounded for the given constraints.",
        variableNames,
        columnNames,
        iterations,
        solution,
        objectiveValue: Number.POSITIVE_INFINITY
      };
    }

    const previousLeavingVariable = basicVariables[leavingRow];
    const pivotValue = tableau[leavingRow][enteringCol];

    for (let col = 0; col < variableCount + constraintCount + 1; col += 1) {
      tableau[leavingRow][col] /= pivotValue;
    }

    for (let row = 0; row < constraintCount + 1; row += 1) {
      if (row === leavingRow) {
        continue;
      }

      const factor = tableau[row][enteringCol];
      if (Math.abs(factor) < EPSILON) {
        continue;
      }

      for (let col = 0; col < variableCount + constraintCount + 1; col += 1) {
        tableau[row][col] -= factor * tableau[leavingRow][col];
      }
    }

    basicVariables[leavingRow] = enteringCol < variableCount ? variableNames[enteringCol] : slackNames[enteringCol - variableCount];

    iterations.push({
      iteration,
      tableau: cloneTableau(tableau),
      basicVariables: [...basicVariables],
      entering: columnNames[enteringCol],
      leaving: previousLeavingVariable,
      pivotRow: leavingRow + 1,
      pivotCol: enteringCol + 1,
      pivotValue
    });
  }

  const solution = extractSimplexSolution(tableau, basicVariables, variableNames);
  return {
    status: "unbounded",
    message: "Simplex reached iteration limit before converging.",
    variableNames,
    columnNames,
    iterations,
    solution,
    objectiveValue: Number.POSITIVE_INFINITY
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

export default function HomePage() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>(INITIAL_PRODUCTS);
  const [costRows, setCostRows] = useState<CostRow[]>(INITIAL_COST_ROWS);
  const [nextProductId, setNextProductId] = useState(2);
  const [nextCostId, setNextCostId] = useState(1);
  const [buyers, setBuyers] = useState("");
  const [visitors, setVisitors] = useState("");
  const [applyDemandLimits, setApplyDemandLimits] = useState(false);
  const [applyProductionLimits, setApplyProductionLimits] = useState(false);
  const [applyInventoryLimits, setApplyInventoryLimits] = useState(false);
  const [planningDataVersion, setPlanningDataVersion] = useState(0);

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
    setBuyers(seed.buyers);
    setVisitors(seed.visitors);
    setApplyDemandLimits(seed.applyDemandLimits);
    setApplyProductionLimits(seed.applyProductionLimits);
    setApplyInventoryLimits(seed.applyInventoryLimits);
  }, []);

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
        errors.push(`Product row ${rowNumber}: Selling Price must be a number greater than 0 (₱ per item).`);
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

  const conversionValidationErrors = useMemo(() => {
    const errors: string[] = [];
    const visitorValue = toNumber(visitors);
    const buyerValue = toNumber(buyers);

    if (visitorValue === null || visitorValue <= 0 || !Number.isInteger(visitorValue)) {
      errors.push("Number of Visitors must be a whole number greater than 0.");
    }

    if (buyerValue === null || buyerValue < 0 || !Number.isInteger(buyerValue)) {
      errors.push("Number of Buyers must be a whole number that is 0 or greater.");
    }

    if (visitorValue !== null && buyerValue !== null && buyerValue > visitorValue) {
      errors.push("Number of Buyers cannot be greater than Number of Visitors.");
    }

    return errors;
  }, [buyers, visitors]);

  const conversionRate = useMemo(() => {
    if (conversionValidationErrors.length > 0) {
      return null;
    }

    const visitorValue = toNumber(visitors);
    const buyerValue = toNumber(buyers);
    if (visitorValue === null || buyerValue === null || visitorValue === 0) {
      return null;
    }

    return (buyerValue / visitorValue) * 100;
  }, [buyers, visitors, conversionValidationErrors]);

  const simplexSetup = useMemo(() => {
    if (step1Data.errors.length > 0 || step1Data.budget === null) {
      return {
        errors: ["Complete Step 1 with valid product and budget values before Simplex optimization."],
        objective: [] as number[],
        constraints: [] as SimplexConstraint[],
        result: null as SimplexResult | null
      };
    }

    const errors: string[] = [];
    const objective = step1Data.parsedProducts.map((product) => product.contributionMargin);
    const constraints: SimplexConstraint[] = [];

    if (step1Data.budget <= 0) {
      errors.push("Budget must be greater than 0 to run Simplex optimization.");
    } else {
      constraints.push({
        name: "Budget constraint",
        coefficients: step1Data.parsedProducts.map((product) => product.variableCost),
        rhs: step1Data.budget
      });
    }

    const addOptionalConstraints = (
      enabled: boolean,
      label: string,
      limitSelector: (product: ProductRow) => string
    ) => {
      if (!enabled) {
        return;
      }

      products.forEach((product, productIndex) => {
        const parsedLimit = toNumber(limitSelector(product));
        if (parsedLimit === null || parsedLimit < 0) {
          errors.push(`${label} for Product ${productIndex + 1} must be a number that is 0 or greater.`);
          return;
        }

        const coefficients = step1Data.parsedProducts.map((_, index) => (index === productIndex ? 1 : 0));
        constraints.push({
          name: `${label} for x${productIndex + 1}`,
          coefficients,
          rhs: parsedLimit
        });
      });
    };

    addOptionalConstraints(applyDemandLimits, "Demand limit", (product) => product.demandLimit);
    addOptionalConstraints(applyProductionLimits, "Production limit", (product) => product.productionLimit);
    addOptionalConstraints(applyInventoryLimits, "Inventory limit", (product) => product.inventoryLimit);

    if (errors.length > 0) {
      return {
        errors,
        objective,
        constraints,
        result: null
      };
    }

    const result = solveSimplex(objective, constraints);
    return {
      errors,
      objective,
      constraints,
      result
    };
  }, [step1Data, products, applyDemandLimits, applyProductionLimits, applyInventoryLimits]);

  const simplexSummary = useMemo(() => {
    if (!simplexSetup.result || !profitAnalysis || step1Data.fixedCostTotal === null) {
      return null;
    }

    const solutionRows = step1Data.parsedProducts.map((product, index) => ({
      productName: product.productName,
      units: simplexSetup.result?.solution[index] ?? 0
    }));

    const maxUnits = solutionRows.reduce((max, row) => Math.max(max, row.units), 0);
    const priorityProducts =
      maxUnits > 0 ? solutionRows.filter((row) => Math.abs(row.units - maxUnits) < 1e-6).map((row) => row.productName) : [];

    const maximumContribution = simplexSetup.result.objectiveValue;
    const maximumProfit =
      simplexSetup.result.status === "optimal" && Number.isFinite(maximumContribution)
        ? maximumContribution - step1Data.fixedCostTotal
        : Number.NEGATIVE_INFINITY;

    return {
      solutionRows,
      priorityProducts,
      maximumContribution,
      maximumProfit
    };
  }, [simplexSetup, step1Data, profitAnalysis]);

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
        unitsSoldToday: "",
        demandLimit: "",
        productionLimit: "",
        inventoryLimit: ""
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

  const objectiveFormula = useMemo(() => {
    if (step1Data.parsedProducts.length === 0) {
      return "Z = 0";
    }

    const terms = step1Data.parsedProducts.map((product, index) => `(${product.contributionMargin.toFixed(4)} × x${index + 1})`);
    return `Maximize Z = ${terms.join(" + ")}`;
  }, [step1Data.parsedProducts]);

  const budgetFormula = useMemo(() => {
    if (step1Data.parsedProducts.length === 0 || step1Data.budget === null) {
      return "Budget constraint not available yet.";
    }

    const terms = step1Data.parsedProducts.map((product, index) => `(${product.variableCost.toFixed(4)} × x${index + 1})`);
    return `${terms.join(" + ")} ≤ ${step1Data.budget.toFixed(4)}`;
  }, [step1Data.parsedProducts, step1Data.budget]);

  const optionalConstraintFormulas = useMemo(() => {
    const formulas: string[] = [];

    if (applyDemandLimits) {
      products.forEach((product, index) => {
        if (product.demandLimit.trim()) {
          formulas.push(`x${index + 1} ≤ ${product.demandLimit.trim()} (Demand limit)`);
        }
      });
    }

    if (applyProductionLimits) {
      products.forEach((product, index) => {
        if (product.productionLimit.trim()) {
          formulas.push(`x${index + 1} ≤ ${product.productionLimit.trim()} (Production limit)`);
        }
      });
    }

    if (applyInventoryLimits) {
      products.forEach((product, index) => {
        if (product.inventoryLimit.trim()) {
          formulas.push(`x${index + 1} ≤ ${product.inventoryLimit.trim()} (Inventory limit)`);
        }
      });
    }

    return formulas;
  }, [products, applyDemandLimits, applyProductionLimits, applyInventoryLimits]);

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

      if (profitAnalysis.totalUnitsSold <= 0) {
        return ["At least one product must have Units Sold Today greater than 0 before break-even analysis."];
      }

      return [];
    }

    if (step === 7) {
      return conversionValidationErrors;
    }

    if (step === 8) {
      return simplexSetup.errors;
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
    setStepErrors([]);
    setCurrentStep((previous) => Math.max(previous - 1, 1));
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

  const optimizationRecommendation =
    simplexSummary && simplexSetup.result?.status === "optimal" && simplexSummary.priorityProducts.length > 0
      ? `Prioritize ${simplexSummary.priorityProducts.join(", ")} based on simplex optimal units.`
      : "No product is currently profitable under the provided constraints; review price, cost, or limits.";

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

        <div className="stepper" aria-label="Business analysis steps">
          {STEP_TITLES.map((title, index) => {
            const step = index + 1;
            const className = step === currentStep ? "step-pill active" : step < currentStep ? "step-pill done" : "step-pill";
            return (
              <button
                key={title}
                type="button"
                className={className}
                onClick={() => setCurrentStep(step <= currentStep ? step : currentStep)}
                aria-current={step === currentStep ? "step" : undefined}
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
                    <th>Selling Price (₱ per item)</th>
                    <th>Variable Cost (₱ per item)</th>
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
                                value={inferredValue !== null && inferredValue !== undefined && Number.isFinite(inferredValue) ? inferredValue.toFixed(4) : ""}
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
            <p className="muted">Budget stays in this table, but is treated as the optimization constraint, not as product cost.</p>
            <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Cost Name</th>
                    <th>Amount (₱)</th>
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
                      <th>Selling Price (₱)</th>
                      <th>Variable Cost (₱)</th>
                      <th>Contribution Margin (₱)</th>
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
            <p className="muted">Second page (required): enter units sold today for each product. No assumptions are made.</p>

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
              <p>Formulas:</p>
              <p>Total Revenue = Σ (Selling Price × Units Sold)</p>
              <p>Total Variable Cost = Σ (Variable Cost × Units Sold)</p>
              <p>Total Contribution Margin = Total Revenue - Total Variable Cost</p>
              <p>Net Profit = Total Contribution Margin - Total Fixed Cost</p>
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
                      <th>Value (₱)</th>
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
              <p>Formulas:</p>
              <p>Weighted Average Contribution Margin = Σ (Product Contribution Margin × Sales Mix Weight)</p>
              <p>Break-Even Point (Units) = Total Fixed Cost / Weighted Average Contribution Margin</p>
              <p>Break-Even Revenue = Break-Even Units × Weighted Average Selling Price</p>
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
          </div>
        ) : null}

        {currentStep === 6 ? (
          <div>
            <div className="formula-box">
              <p>Graph equations:</p>
              <p>Total Revenue Line = Weighted Average Selling Price × Units Sold</p>
              <p>Total Cost Line = Total Fixed Cost + (Weighted Average Variable Cost × Units Sold)</p>
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
                    Amount (₱)
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
            <div className="formula-box">
              <p>Definition:</p>
              <p>Conversion = Percentage of potential customers who actually buy.</p>
              <p>Formula: Conversion Rate = (Number of Buyers / Number of Visitors) × 100</p>
            </div>

            <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Number of Visitors</th>
                    <th>Number of Buyers</th>
                    <th>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={visitors}
                        onChange={(event) => setVisitors(event.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={buyers}
                        onChange={(event) => setBuyers(event.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>{conversionRate === null ? "Waiting for valid inputs" : `${conversionRate.toFixed(2)}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {currentStep === 8 ? (
          <div>
            <div className="formula-box">
              <p>Objective Function:</p>
              <p>{objectiveFormula}</p>
              <p>Budget Constraint:</p>
              <p>{budgetFormula}</p>
            </div>

            <div className="constraint-switches">
              <label>
                <input
                  type="checkbox"
                  checked={applyDemandLimits}
                  onChange={(event) => setApplyDemandLimits(event.target.checked)}
                  style={{ width: "auto", marginRight: "0.45rem" }}
                />
                Apply demand limits
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={applyProductionLimits}
                  onChange={(event) => setApplyProductionLimits(event.target.checked)}
                  style={{ width: "auto", marginRight: "0.45rem" }}
                />
                Apply production limits
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={applyInventoryLimits}
                  onChange={(event) => setApplyInventoryLimits(event.target.checked)}
                  style={{ width: "auto", marginRight: "0.45rem" }}
                />
                Apply inventory limits
              </label>
            </div>

            {applyDemandLimits || applyProductionLimits || applyInventoryLimits ? (
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      {applyDemandLimits ? <th>Demand limit</th> : null}
                      {applyProductionLimits ? <th>Production limit</th> : null}
                      {applyInventoryLimits ? <th>Inventory limit</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.productName || "Unnamed Product"}</td>
                        {applyDemandLimits ? (
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={product.demandLimit}
                              onChange={(event) => updateProduct(product.id, "demandLimit", event.target.value)}
                              placeholder="0"
                            />
                          </td>
                        ) : null}
                        {applyProductionLimits ? (
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={product.productionLimit}
                              onChange={(event) => updateProduct(product.id, "productionLimit", event.target.value)}
                              placeholder="0"
                            />
                          </td>
                        ) : null}
                        {applyInventoryLimits ? (
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={product.inventoryLimit}
                              onChange={(event) => updateProduct(product.id, "inventoryLimit", event.target.value)}
                              placeholder="0"
                            />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {optionalConstraintFormulas.length > 0 ? (
              <div className="formula-box" style={{ marginTop: "0.75rem" }}>
                <p>Optional constraints:</p>
                {optionalConstraintFormulas.map((formula) => (
                  <p key={formula}>{formula}</p>
                ))}
              </div>
            ) : null}

            {simplexSetup.errors.length > 0 ? (
              <UserErrorPanel title="Simplex Input Validation" message={simplexSetup.errors.join(" ")} />
            ) : simplexSetup.result ? (
              <div>
                <p style={{ marginTop: "0.8rem" }}>
                  Status: <strong>{simplexSetup.result.status === "optimal" ? "Optimal solution found" : simplexSetup.result.message}</strong>
                </p>

                <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Optimal Units (xi)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step1Data.parsedProducts.map((product, index) => (
                        <tr key={product.id}>
                          <td>{product.productName}</td>
                          <td>{formatNumber(simplexSetup.result?.solution[index] ?? 0)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>Maximum contribution margin (Z)</td>
                        <td>{formatPhp(simplexSetup.result.objectiveValue)}</td>
                      </tr>
                      {step1Data.fixedCostTotal !== null ? (
                        <tr>
                          <td>Maximum achievable profit (Z - Total Fixed Cost)</td>
                          <td>{formatPhp(simplexSetup.result.objectiveValue - step1Data.fixedCostTotal)}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ marginTop: "1rem" }}>Simplex Pivot Steps</h3>
                <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Iteration</th>
                        <th>Entering Variable</th>
                        <th>Leaving Variable</th>
                        <th>Pivot Position (row, col)</th>
                        <th>Pivot Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simplexSetup.result.iterations.slice(1).map((iteration) => (
                        <tr key={`pivot-${iteration.iteration}`}>
                          <td>{iteration.iteration}</td>
                          <td>{iteration.entering ?? "-"}</td>
                          <td>{iteration.leaving ?? "-"}</td>
                          <td>
                            {iteration.pivotRow ?? "-"}, {iteration.pivotCol ?? "-"}
                          </td>
                          <td>{iteration.pivotValue === undefined ? "-" : iteration.pivotValue.toFixed(6)}</td>
                        </tr>
                      ))}
                      {simplexSetup.result.iterations.length <= 1 ? (
                        <tr>
                          <td colSpan={5}>No pivot required (initial tableau already optimal).</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ marginTop: "1rem" }}>Full Simplex Table (Iteration Format)</h3>
                {simplexSetup.result.iterations.map((iteration) => (
                  <div key={`tableau-${iteration.iteration}`} className="table-wrap" style={{ marginTop: "0.65rem" }}>
                    <table className="ops-table">
                      <thead>
                        <tr>
                          <th>Iteration {iteration.iteration} Basis</th>
                          {simplexSetup.result?.columnNames.map((column) => (
                            <th key={`${iteration.iteration}-${column}`}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {iteration.basicVariables.map((basicVariable, rowIndex) => (
                          <tr key={`${iteration.iteration}-${basicVariable}-${rowIndex}`}>
                            <td>{basicVariable}</td>
                            {iteration.tableau[rowIndex].map((value, valueIndex) => (
                              <td key={`${iteration.iteration}-${basicVariable}-${valueIndex}`}>{value.toFixed(3)}</td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td>Z</td>
                          {iteration.tableau[iteration.tableau.length - 1].map((value, valueIndex) => (
                            <td key={`${iteration.iteration}-z-${valueIndex}`}>{value.toFixed(3)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === 9 ? (
          <div>
            <div className="formula-box">
              <p>Summary is based on:</p>
              <p>1) Profit Analysis from Step 4</p>
              <p>2) Break-Even Analysis from Step 5</p>
              <p>3) Simplex Optimization from Step 8</p>
            </div>

            <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Summary Item</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Best product(s) to focus on</td>
                    <td>
                      {simplexSetup.result?.status === "optimal" && simplexSummary?.priorityProducts.length
                        ? simplexSummary.priorityProducts.join(", ")
                        : "Not determined yet"}
                    </td>
                  </tr>
                  <tr>
                    <td>Profitability status</td>
                    <td>{profitabilityStatus}</td>
                  </tr>
                  <tr>
                    <td>Break-even insight</td>
                    <td>{breakEvenInsight}</td>
                  </tr>
                  <tr>
                    <td>Optimization recommendation</td>
                    <td>{optimizationRecommendation}</td>
                  </tr>
                  <tr>
                    <td>Maximum achievable profit</td>
                    <td>{simplexSummary ? formatPhp(simplexSummary.maximumProfit) : "Not determined yet"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="wizard-nav">
          <button type="button" onClick={goBack} disabled={currentStep === 1} style={{ maxWidth: "170px" }}>
            Previous Step
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentStep === STEP_TITLES.length}
            style={{ maxWidth: "170px", justifySelf: "end" }}
          >
            Next Step
          </button>
        </div>
      </section>
    </main>
  );
}
