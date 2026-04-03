import { useEffect } from "react";

import { saveMaterialRequirements, saveProcurementData, type StoredMaterialRequirement } from "@/lib/planningStorage";

import { buildCleanProcurementRows } from "../derivations";
import { toNumber } from "../formatters";
import type { MaterialRequirementRow, ProcurementRow } from "../types";

type Params = {
  materialRows: MaterialRequirementRow[];
  procurementRows: ProcurementRow[];
  hasLoadedFromStorage: boolean;
};

export function useMaterialsPersistenceEffects({ materialRows, procurementRows, hasLoadedFromStorage }: Params) {
  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    const cleanRows: StoredMaterialRequirement[] = materialRows
      .map((row) => {
        const quantity = toNumber(row.quantityNeededPerProduct);
        if (!row.product.trim() || !row.material.trim() || quantity === null || quantity <= 0) {
          return null;
        }

        return {
          product: row.product.trim(),
          material: row.material.trim(),
          quantityNeededPerProduct: quantity
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    saveMaterialRequirements(cleanRows);
  }, [materialRows, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    saveProcurementData(buildCleanProcurementRows(procurementRows));
  }, [procurementRows, hasLoadedFromStorage]);
}
