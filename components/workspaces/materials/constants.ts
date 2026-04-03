import type { MaterialRequirementRow, ProcurementRow } from "./types";

export const INITIAL_MATERIAL_ROWS: MaterialRequirementRow[] = [];

export const INITIAL_PROCUREMENT_ROWS: ProcurementRow[] = [
  {
    id: "pr-1",
    material: "",
    unit: "unit",
    totalAvailable: "",
    totalProcurementCost: ""
  }
];
