import { buildProcurementCostPerUnitMap, normalizePlanningLabel, type StoredProcurementData } from "@/lib/planningStorage";

import { normalizeMaterial, toNumber } from "./formatters";
import type { MaterialRequirementRow, MaterialsValidationResult, ProcurementRow } from "./types";

export function buildProcurementMaterialOptions(procurementRows: ProcurementRow[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  procurementRows.forEach((row) => {
    const material = row.material.trim();
    const key = normalizePlanningLabel(material);
    if (!material || seen.has(key)) {
      return;
    }

    seen.add(key);
    options.push(material);
  });

  return options;
}

export function buildProcurementUnitByMaterial(procurementRows: ProcurementRow[]): Map<string, string> {
  const unitMap = new Map<string, string>();

  procurementRows.forEach((row) => {
    const key = normalizePlanningLabel(row.material);
    const unit = row.unit.trim();
    if (!key || !unit || unitMap.has(key)) {
      return;
    }

    unitMap.set(key, unit);
  });

  return unitMap;
}

export function buildMaterialRowsByProduct(
  materialRows: MaterialRequirementRow[],
  productOptions: string[]
): Map<string, MaterialRequirementRow[]> {
  const grouped = new Map<string, MaterialRequirementRow[]>();

  productOptions.forEach((productName) => {
    grouped.set(normalizePlanningLabel(productName), []);
  });

  materialRows.forEach((row) => {
    const key = normalizePlanningLabel(row.product);
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  });

  return grouped;
}

export function buildCleanProcurementRows(procurementRows: ProcurementRow[]): StoredProcurementData[] {
  return procurementRows
    .map((row) => {
      const available = toNumber(row.totalAvailable);
      const totalCost = toNumber(row.totalProcurementCost);
      if (!row.material.trim() || available === null || available <= 0 || totalCost === null || totalCost < 0) {
        return null;
      }

      return {
        material: row.material.trim(),
        unit: row.unit.trim() || "unit",
        totalAvailable: available,
        totalProcurementCost: totalCost
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export function buildValidation(
  materialRows: MaterialRequirementRow[],
  procurementRows: ProcurementRow[],
  productOptions: string[]
): MaterialsValidationResult {
  const errors: string[] = [];
  const productKeySet = new Set(productOptions.map((product) => normalizePlanningLabel(product)));

  if (productOptions.length === 0) {
    errors.push("No products found from Business Analysis page. Add products there first.");
  }

  if (materialRows.length === 0) {
    errors.push("No material requirements have been added yet. Use the + button beside each product.");
  }

  materialRows.forEach((row, index) => {
    const rowNo = index + 1;
    if (!row.product.trim()) {
      errors.push(`Material row ${rowNo}: Product is required.`);
    } else if (!productKeySet.has(normalizePlanningLabel(row.product))) {
      errors.push(`Material row ${rowNo}: Product must be selected from Business Analysis page products.`);
    }

    if (!row.material.trim()) {
      errors.push(`Material row ${rowNo}: Material is required.`);
    }

    const qty = toNumber(row.quantityNeededPerProduct);
    if (qty === null || qty <= 0) {
      errors.push(`Material row ${rowNo}: Quantity Needed per Product must be greater than 0.`);
    }
  });

  const procurementByMaterial = new Map<string, ProcurementRow[]>();
  procurementRows.forEach((row, index) => {
    const rowNo = index + 1;
    if (!row.material.trim()) {
      errors.push(`Procurement row ${rowNo}: Material is required.`);
    }

    const available = toNumber(row.totalAvailable);
    if (available === null || available <= 0) {
      errors.push(`Procurement row ${rowNo}: Total Available must be greater than 0.`);
    }

    const totalCost = toNumber(row.totalProcurementCost);
    if (totalCost === null || totalCost < 0) {
      errors.push(`Procurement row ${rowNo}: Total Procurement Cost must be 0 or greater.`);
    }

    if (!row.unit.trim()) {
      errors.push(`Procurement row ${rowNo}: Unit is required (example: kg, g, ml, pcs).`);
    }

    const key = normalizeMaterial(row.material);
    if (key) {
      const current = procurementByMaterial.get(key) ?? [];
      current.push(row);
      procurementByMaterial.set(key, current);
    }
  });

  const requiredMaterialSet = new Set(
    materialRows
      .map((row) => normalizeMaterial(row.material))
      .filter((material) => material.length > 0)
  );

  requiredMaterialSet.forEach((materialKey) => {
    if (!procurementByMaterial.has(materialKey)) {
      errors.push(`Procurement data missing for required material: ${materialKey}.`);
    }
  });

  const cleanProcurementRows = buildCleanProcurementRows(procurementRows);
  const procurementSummary = [...buildProcurementCostPerUnitMap(cleanProcurementRows).values()];

  return {
    errors,
    procurementSummary
  };
}
