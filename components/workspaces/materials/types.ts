export type MaterialRequirementRow = {
  id: string;
  product: string;
  material: string;
  quantityNeededPerProduct: string;
};

export type ProcurementRow = {
  id: string;
  material: string;
  unit: string;
  totalAvailable: string;
  totalProcurementCost: string;
};

export type LatestMaterialsSnapshotResponse = {
  materials?: Array<{
    product?: string;
    material?: string;
    quantityNeededPerProduct?: number;
  }>;
  procurement?: Array<{
    material?: string;
    unit?: string;
    totalAvailable?: number;
    totalProcurementCost?: number;
  }>;
};

export type ProcurementSummaryRow = {
  material: string;
  unit: string;
  totalAvailable: number;
  totalProcurementCost: number;
  costPerUnit: number;
};

export type MaterialsValidationResult = {
  errors: string[];
  procurementSummary: ProcurementSummaryRow[];
};
