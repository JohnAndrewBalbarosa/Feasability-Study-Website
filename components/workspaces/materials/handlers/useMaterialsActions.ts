import type { Dispatch, SetStateAction } from "react";

import type { MaterialRequirementRow, ProcurementRow } from "../types";

type UseMaterialsActionsParams = {
  nextMaterialId: number;
  setNextMaterialId: Dispatch<SetStateAction<number>>;
  setMaterialRows: Dispatch<SetStateAction<MaterialRequirementRow[]>>;
  nextProcurementId: number;
  setNextProcurementId: Dispatch<SetStateAction<number>>;
  setProcurementRows: Dispatch<SetStateAction<ProcurementRow[]>>;
};

export function useMaterialsActions({
  nextMaterialId,
  setNextMaterialId,
  setMaterialRows,
  nextProcurementId,
  setNextProcurementId,
  setProcurementRows
}: UseMaterialsActionsParams) {
  const addMaterialRowForProduct = (productName: string) => {
    const id = `mr-${nextMaterialId}`;
    setMaterialRows((previous) => [...previous, { id, product: productName, material: "", quantityNeededPerProduct: "" }]);
    setNextMaterialId((previous) => previous + 1);
  };

  const updateMaterialRow = (id: string, field: keyof MaterialRequirementRow, value: string) => {
    setMaterialRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeMaterialRow = (id: string) => {
    setMaterialRows((previous) => previous.filter((row) => row.id !== id));
  };

  const addProcurementRow = () => {
    const id = `pr-${nextProcurementId}`;
    setProcurementRows((previous) => [
      ...previous,
      { id, material: "", unit: "unit", totalAvailable: "", totalProcurementCost: "" }
    ]);
    setNextProcurementId((previous) => previous + 1);
  };

  const updateProcurementRow = (id: string, field: keyof ProcurementRow, value: string) => {
    setProcurementRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeProcurementRow = (id: string) => {
    setProcurementRows((previous) => (previous.length > 1 ? previous.filter((row) => row.id !== id) : previous));
  };

  return {
    addMaterialRowForProduct,
    updateMaterialRow,
    removeMaterialRow,
    addProcurementRow,
    updateProcurementRow,
    removeProcurementRow
  };
}
