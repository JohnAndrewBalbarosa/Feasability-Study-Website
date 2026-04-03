import { normalizePlanningLabel } from "@/lib/planningStorage";

import { toNumber } from "../formatters";
import type { CostRow, ParsedCost, ParsedProduct, ProductRow, Step1Data, UnitsData } from "../types";

type InferredVariableCost = {
  hasRequirements: boolean;
  missingMaterials: string[];
  variableCostPerItem: number | null;
};

export function buildStep1Data(products: ProductRow[], costRows: CostRow[], inferredCosts: Map<string, InferredVariableCost>): Step1Data {
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
      errors.push(`Product row ${rowNumber}: Selling Price must be a number greater than 0 (PHP per item).`);
    }

    let variableCost: number | null = null;
    if (productName) {
      const inferred = inferredCosts.get(productNameKey);

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
      parsedCosts.push({ id: cost.id, costName: name, amount, isBudget: Boolean(cost.isBudget) });
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
}

export function buildUnitsData(products: ProductRow[]): UnitsData {
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

  return { errors, unitsByProductId };
}
