export type StoredBusinessProductInput = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: string;
  variableCost: string;
  unitsSoldToday: string;
};

export type StoredBusinessCostInput = {
  id: string;
  costName: string;
  amount: string;
  isBudget: boolean;
};

const BUSINESS_PRODUCT_INPUTS_SESSION_KEY = "planning:session:business-product-inputs";
const BUSINESS_COST_INPUTS_SESSION_KEY = "planning:session:business-cost-inputs";
const BUSINESS_CURRENT_STEP_SESSION_KEY = "planning:session:business-current-step";

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function saveBusinessAnalysisProductInputs(rows: StoredBusinessProductInput[]): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(BUSINESS_PRODUCT_INPUTS_SESSION_KEY, JSON.stringify(rows));
}

export function loadBusinessAnalysisProductInputs(): StoredBusinessProductInput[] {
  const storage = getSessionStorage();
  if (!storage) {
    return [];
  }

  const parsed = parseJsonArray<StoredBusinessProductInput>(storage.getItem(BUSINESS_PRODUCT_INPUTS_SESSION_KEY));
  return parsed
    .map((row) => {
      if (
        typeof row?.id !== "string" ||
        typeof row?.productName !== "string" ||
        typeof row?.packSize !== "string" ||
        typeof row?.sellingPrice !== "string" ||
        typeof row?.variableCost !== "string" ||
        typeof row?.unitsSoldToday !== "string"
      ) {
        return null;
      }

      return {
        id: row.id,
        productName: row.productName,
        packSize: row.packSize,
        sellingPrice: row.sellingPrice,
        variableCost: row.variableCost,
        unitsSoldToday: row.unitsSoldToday
      } satisfies StoredBusinessProductInput;
    })
    .filter((row): row is StoredBusinessProductInput => row !== null);
}

export function saveBusinessAnalysisCostInputs(rows: StoredBusinessCostInput[]): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(BUSINESS_COST_INPUTS_SESSION_KEY, JSON.stringify(rows));
}

export function loadBusinessAnalysisCostInputs(): StoredBusinessCostInput[] {
  const storage = getSessionStorage();
  if (!storage) {
    return [];
  }

  const parsed = parseJsonArray<StoredBusinessCostInput>(storage.getItem(BUSINESS_COST_INPUTS_SESSION_KEY));
  return parsed
    .map((row) => {
      if (
        typeof row?.id !== "string" ||
        typeof row?.costName !== "string" ||
        typeof row?.amount !== "string" ||
        typeof row?.isBudget !== "boolean"
      ) {
        return null;
      }

      return {
        id: row.id,
        costName: row.costName,
        amount: row.amount,
        isBudget: row.isBudget
      } satisfies StoredBusinessCostInput;
    })
    .filter((row): row is StoredBusinessCostInput => row !== null);
}

export function saveBusinessAnalysisCurrentStep(step: number): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(BUSINESS_CURRENT_STEP_SESSION_KEY, String(step));
}

export function loadBusinessAnalysisCurrentStep(): number | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(BUSINESS_CURRENT_STEP_SESSION_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
