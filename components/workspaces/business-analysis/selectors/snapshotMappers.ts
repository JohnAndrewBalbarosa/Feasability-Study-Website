import type { CostRow, LatestBusinessSnapshotResponse, ProcurementRow, ProductRow } from "../types";

export function mapProductsFromSnapshot(payload: LatestBusinessSnapshotResponse): ProductRow[] {
  return (payload.business?.products ?? [])
    .map((row, index) => {
      const productName = row.productName?.trim() ?? "";
      const packSize = row.packSize?.trim() ?? "";
      const sellingPrice = typeof row.sellingPrice === "number" ? row.sellingPrice : null;
      const unitsSoldToday = typeof row.unitsSoldToday === "number" ? row.unitsSoldToday : null;

      if (!productName || sellingPrice === null || !Number.isFinite(sellingPrice) || unitsSoldToday === null || !Number.isFinite(unitsSoldToday)) {
        return null;
      }

      return {
        id: `p-${index + 1}`,
        productName,
        packSize,
        sellingPrice: String(sellingPrice),
        variableCost: "",
        unitsSoldToday: String(unitsSoldToday)
      };
    })
    .filter((row): row is ProductRow => row !== null);
}

export function mapCostRowsFromSnapshot(payload: LatestBusinessSnapshotResponse): CostRow[] {
  return (payload.business?.costRows ?? [])
    .map((row, index) => {
      const costName = row.costName?.trim() ?? "";
      const amount = typeof row.amount === "number" ? row.amount : null;

      if (!costName || amount === null || !Number.isFinite(amount) || amount < 0) {
        return null;
      }

      const isBudget = Boolean(row.isBudget);
      const id = isBudget ? "budget" : `cost-snapshot-${index + 1}`;
      return {
        id,
        costName,
        amount: String(amount),
        isBudget
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export function mapProcurementRowsFromSnapshot(payload: LatestBusinessSnapshotResponse): ProcurementRow[] {
  return (payload.procurement ?? [])
    .map((row, index) => {
      const material = row.material?.trim() ?? "";
      const unit = row.unit?.trim() || "unit";
      const totalAvailable = typeof row.totalAvailable === "number" ? row.totalAvailable : null;
      const totalProcurementCost = typeof row.totalProcurementCost === "number" ? row.totalProcurementCost : null;

      if (
        !material ||
        totalAvailable === null ||
        !Number.isFinite(totalAvailable) ||
        totalAvailable <= 0 ||
        totalProcurementCost === null ||
        !Number.isFinite(totalProcurementCost) ||
        totalProcurementCost < 0
      ) {
        return null;
      }

      return {
        id: `pr-${index + 1}`,
        material,
        unit,
        totalAvailable: String(totalAvailable),
        totalProcurementCost: String(totalProcurementCost)
      };
    })
    .filter((row): row is ProcurementRow => row !== null);
}

export function mapMaterialsFromSnapshot(payload: LatestBusinessSnapshotResponse) {
  return (payload.materials ?? [])
    .map((row) => {
      const product = row.product?.trim() ?? "";
      const material = row.material?.trim() ?? "";
      const quantityNeededPerProduct = typeof row.quantityNeededPerProduct === "number" ? row.quantityNeededPerProduct : null;

      if (!product || !material || quantityNeededPerProduct === null || !Number.isFinite(quantityNeededPerProduct) || quantityNeededPerProduct <= 0) {
        return null;
      }

      return { product, material, quantityNeededPerProduct };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
