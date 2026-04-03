import type { CostRow, ProductRow, ProcurementRow } from "./types";

export const SVG_WIDTH = 760;
export const SVG_HEIGHT = 360;
export const GRAPH_PADDING = 48;

export const STEP_TITLES = [
  "Step 1: Define Input Data",
  "Step 2: Compute Unit Economics",
  "Step 3: Daily Sales Input Page",
  "Step 4: Profit Analysis",
  "Step 5: Break-Even Analysis",
  "Step 6: Line Graph",
  "Step 7: Revenue Per Product (Today)",
  "Step 8: Final Output Summary"
];

export const INITIAL_PRODUCTS: ProductRow[] = [
  {
    id: "p-1",
    productName: "",
    packSize: "",
    sellingPrice: "",
    variableCost: "",
    unitsSoldToday: ""
  }
];

export const INITIAL_COST_ROWS: CostRow[] = [
  { id: "rent", costName: "Rent", amount: "" },
  { id: "salaries", costName: "Salaries", amount: "" },
  { id: "utilities", costName: "Utilities", amount: "" },
  { id: "equipment", costName: "Equipment", amount: "" },
  { id: "marketing", costName: "Marketing budget", amount: "" },
  { id: "budget", costName: "Budget (overall constraint)", amount: "", isBudget: true },
  { id: "other", costName: "Other fixed costs", amount: "" }
];

export const INITIAL_PROCUREMENT_ROWS: ProcurementRow[] = [
  {
    id: "pr-1",
    material: "",
    unit: "unit",
    totalAvailable: "",
    totalProcurementCost: ""
  }
];
