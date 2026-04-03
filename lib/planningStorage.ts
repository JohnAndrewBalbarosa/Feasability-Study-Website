export type StoredMaterialRequirement = {
  product: string;
  material: string;
  quantityNeededPerProduct: number;
};

export type StoredProcurementData = {
  material: string;
  unit: string;
  totalAvailable: number;
  totalProcurementCost: number;
};

export type InferredVariableCost = {
  variableCostPerItem: number | null;
  hasRequirements: boolean;
  missingMaterials: string[];
};

type ProcurementAggregate = {
  material: string;
  unit: string;
  totalAvailable: number;
  totalProcurementCost: number;
  costPerUnit: number;
};

const BUSINESS_PRODUCTS_KEY = "planning:business-products";
const MATERIAL_REQUIREMENTS_KEY = "planning:material-requirements";
const PROCUREMENT_DATA_KEY = "planning:procurement-data";

export const PLANNING_DATA_UPDATED_EVENT = "planning-data-updated";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifyPlanningDataUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PLANNING_DATA_UPDATED_EVENT));
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

export function normalizePlanningLabel(value: string): string {
  return value.trim().toLowerCase();
}

export function saveBusinessAnalysisProducts(products: string[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const seen = new Set<string>();
  const normalized = products
    .map((product) => product.trim())
    .filter((product) => product.length > 0)
    .filter((product) => {
      const key = normalizePlanningLabel(product);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

  storage.setItem(BUSINESS_PRODUCTS_KEY, JSON.stringify(normalized));
  notifyPlanningDataUpdated();
}

export function loadBusinessAnalysisProducts(): string[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const parsed = parseJsonArray<string>(storage.getItem(BUSINESS_PRODUCTS_KEY));
  return parsed
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export function saveMaterialRequirements(rows: StoredMaterialRequirement[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(MATERIAL_REQUIREMENTS_KEY, JSON.stringify(rows));
  notifyPlanningDataUpdated();
}

export function loadMaterialRequirements(): StoredMaterialRequirement[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const parsed = parseJsonArray<StoredMaterialRequirement>(storage.getItem(MATERIAL_REQUIREMENTS_KEY));
  return parsed.filter((row) => {
    return (
      typeof row?.product === "string" &&
      typeof row?.material === "string" &&
      typeof row?.quantityNeededPerProduct === "number" &&
      Number.isFinite(row.quantityNeededPerProduct) &&
      row.quantityNeededPerProduct > 0
    );
  });
}

export function saveProcurementData(rows: StoredProcurementData[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PROCUREMENT_DATA_KEY, JSON.stringify(rows));
  notifyPlanningDataUpdated();
}

export function loadProcurementData(): StoredProcurementData[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const parsed = parseJsonArray<StoredProcurementData>(storage.getItem(PROCUREMENT_DATA_KEY));
  return parsed
    .map((row) => {
      if (
        typeof row?.material !== "string" ||
        typeof row?.totalAvailable !== "number" ||
        typeof row?.totalProcurementCost !== "number" ||
        !Number.isFinite(row.totalAvailable) ||
        !Number.isFinite(row.totalProcurementCost) ||
        row.totalAvailable <= 0 ||
        row.totalProcurementCost < 0
      ) {
        return null;
      }

      const unit = typeof (row as { unit?: unknown }).unit === "string" ? String((row as { unit?: unknown }).unit).trim() : "unit";

      return {
        material: row.material,
        unit: unit || "unit",
        totalAvailable: row.totalAvailable,
        totalProcurementCost: row.totalProcurementCost
      } satisfies StoredProcurementData;
    })
    .filter((row): row is StoredProcurementData => row !== null);
}

export function buildProcurementCostPerUnitMap(rows: StoredProcurementData[]): Map<string, ProcurementAggregate> {
  const aggregateMap = new Map<
    string,
    {
      material: string;
      unit: string;
      totalAvailable: number;
      totalProcurementCost: number;
    }
  >();

  rows.forEach((row) => {
    const key = normalizePlanningLabel(row.material);
    if (!key) {
      return;
    }

    const current = aggregateMap.get(key) ?? {
      material: row.material.trim(),
      unit: row.unit.trim() || "unit",
      totalAvailable: 0,
      totalProcurementCost: 0
    };

    current.totalAvailable += row.totalAvailable;
    current.totalProcurementCost += row.totalProcurementCost;
    aggregateMap.set(key, current);
  });

  const result = new Map<string, ProcurementAggregate>();
  aggregateMap.forEach((value, key) => {
    if (value.totalAvailable <= 0) {
      return;
    }

    result.set(key, {
      material: value.material,
      unit: value.unit,
      totalAvailable: value.totalAvailable,
      totalProcurementCost: value.totalProcurementCost,
      costPerUnit: value.totalProcurementCost / value.totalAvailable
    });
  });

  return result;
}

export function computeInferredVariableCostByProduct(productNames: string[]): Map<string, InferredVariableCost> {
  const requirements = loadMaterialRequirements();
  const procurementMap = buildProcurementCostPerUnitMap(loadProcurementData());
  const inferredMap = new Map<string, InferredVariableCost>();

  productNames.forEach((productName) => {
    const productKey = normalizePlanningLabel(productName);
    if (!productKey) {
      return;
    }

    const requirementRows = requirements.filter((row) => normalizePlanningLabel(row.product) === productKey);

    if (requirementRows.length === 0) {
      inferredMap.set(productKey, {
        variableCostPerItem: null,
        hasRequirements: false,
        missingMaterials: []
      });
      return;
    }

    let variableCostPerItem = 0;
    const missingMaterialsSet = new Set<string>();

    requirementRows.forEach((row) => {
      const materialKey = normalizePlanningLabel(row.material);
      const procurement = procurementMap.get(materialKey);
      if (!procurement) {
        missingMaterialsSet.add(row.material.trim());
        return;
      }

      variableCostPerItem += row.quantityNeededPerProduct * procurement.costPerUnit;
    });

    const missingMaterials = [...missingMaterialsSet];
    inferredMap.set(productKey, {
      variableCostPerItem: missingMaterials.length > 0 ? null : variableCostPerItem,
      hasRequirements: true,
      missingMaterials
    });
  });

  return inferredMap;
}
