import type { CostRow, ProductRow, ProcurementRow } from "./types";

export const SVG_WIDTH = 760;
export const SVG_HEIGHT = 360;
export const GRAPH_PADDING = 48;

export const STEP_TITLES = [
  "Step 1: Your Products & Monthly Costs",
  "Step 2: Profit Per Item (Auto-Calculated)",
  "Step 3: What Did You Sell Today?",
  "Step 4: Did You Make Money?",
  "Step 5: How Close Are You to Break-Even?",
  "Step 6: The Big Picture — Chart",
  "Step 7: Revenue by Product",
  "Step 8: Review & Save Today's Results"
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
