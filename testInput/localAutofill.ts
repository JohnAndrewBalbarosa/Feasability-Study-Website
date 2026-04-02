"use client";

import {
  saveBusinessAnalysisProducts,
  saveMaterialRequirements,
  saveProcurementData,
  type StoredMaterialRequirement,
  type StoredProcurementData
} from "@/lib/planningStorage";

export type LocalBusinessProductSeed = {
  id: string;
  productName: string;
  packSize: string;
  sellingPrice: string;
  unitsSoldToday: string;
  demandLimit: string;
  productionLimit: string;
  inventoryLimit: string;
};

export type LocalBusinessCostSeed = {
  id: string;
  costName: string;
  amount: string;
  isBudget?: boolean;
};

export type LocalBusinessAutofillSeed = {
  products: LocalBusinessProductSeed[];
  costRows: LocalBusinessCostSeed[];
  nextProductId: number;
  nextCostId: number;
  buyers: string;
  visitors: string;
  applyDemandLimits: boolean;
  applyProductionLimits: boolean;
  applyInventoryLimits: boolean;
};

const TEST_PRODUCTS: LocalBusinessProductSeed[] = [
  {
    id: "p-1",
    productName: "Classic Donut",
    packSize: "1 piece",
    sellingPrice: "35",
    unitsSoldToday: "120",
    demandLimit: "160",
    productionLimit: "150",
    inventoryLimit: "140"
  },
  {
    id: "p-2",
    productName: "Choco Box",
    packSize: "6 pieces",
    sellingPrice: "210",
    unitsSoldToday: "40",
    demandLimit: "60",
    productionLimit: "55",
    inventoryLimit: "50"
  },
  {
    id: "p-3",
    productName: "Brewed Coffee",
    packSize: "12 oz cup",
    sellingPrice: "95",
    unitsSoldToday: "80",
    demandLimit: "110",
    productionLimit: "100",
    inventoryLimit: "90"
  }
];

const TEST_COST_ROWS: LocalBusinessCostSeed[] = [
  { id: "rent", costName: "Rent", amount: "18000" },
  { id: "salaries", costName: "Salaries", amount: "32000" },
  { id: "utilities", costName: "Utilities", amount: "6500" },
  { id: "equipment", costName: "Equipment", amount: "4500" },
  { id: "marketing", costName: "Marketing budget", amount: "3000" },
  { id: "budget", costName: "Budget (overall constraint)", amount: "55000", isBudget: true },
  { id: "other", costName: "Other fixed costs", amount: "2500" }
];

const TEST_MATERIAL_REQUIREMENTS: StoredMaterialRequirement[] = [
  { product: "Classic Donut", material: "Flour", quantityNeededPerProduct: 0.08 },
  { product: "Classic Donut", material: "Sugar", quantityNeededPerProduct: 0.02 },
  { product: "Classic Donut", material: "Yeast", quantityNeededPerProduct: 0.003 },
  { product: "Classic Donut", material: "Oil", quantityNeededPerProduct: 0.03 },
  { product: "Choco Box", material: "Flour", quantityNeededPerProduct: 0.4 },
  { product: "Choco Box", material: "Sugar", quantityNeededPerProduct: 0.12 },
  { product: "Choco Box", material: "Cocoa", quantityNeededPerProduct: 0.06 },
  { product: "Choco Box", material: "Oil", quantityNeededPerProduct: 0.1 },
  { product: "Brewed Coffee", material: "Coffee Beans", quantityNeededPerProduct: 0.02 },
  { product: "Brewed Coffee", material: "Milk", quantityNeededPerProduct: 0.08 },
  { product: "Brewed Coffee", material: "Sugar", quantityNeededPerProduct: 0.015 },
  { product: "Brewed Coffee", material: "Cup", quantityNeededPerProduct: 1 }
];

const TEST_PROCUREMENT_DATA: StoredProcurementData[] = [
  { material: "Flour", totalAvailable: 100, totalProcurementCost: 4500 },
  { material: "Sugar", totalAvailable: 80, totalProcurementCost: 5200 },
  { material: "Yeast", totalAvailable: 10, totalProcurementCost: 1800 },
  { material: "Oil", totalAvailable: 120, totalProcurementCost: 9600 },
  { material: "Cocoa", totalAvailable: 25, totalProcurementCost: 6250 },
  { material: "Coffee Beans", totalAvailable: 30, totalProcurementCost: 10200 },
  { material: "Milk", totalAvailable: 100, totalProcurementCost: 9000 },
  { material: "Cup", totalAvailable: 1000, totalProcurementCost: 2500 }
];

export function shouldAutofillLocalInput(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export function getLocalBusinessAutofillSeed(): LocalBusinessAutofillSeed {
  return {
    products: TEST_PRODUCTS.map((row) => ({ ...row })),
    costRows: TEST_COST_ROWS.map((row) => ({ ...row })),
    nextProductId: TEST_PRODUCTS.length + 1,
    nextCostId: 1,
    buyers: "290",
    visitors: "1500",
    applyDemandLimits: true,
    applyProductionLimits: true,
    applyInventoryLimits: false
  };
}

export function seedLocalPlanningData(): void {
  if (!shouldAutofillLocalInput()) {
    return;
  }

  saveBusinessAnalysisProducts(TEST_PRODUCTS.map((row) => row.productName));
  saveMaterialRequirements(TEST_MATERIAL_REQUIREMENTS);
  saveProcurementData(TEST_PROCUREMENT_DATA);
}
