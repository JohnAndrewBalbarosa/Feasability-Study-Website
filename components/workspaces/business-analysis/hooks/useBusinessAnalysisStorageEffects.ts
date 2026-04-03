import { useEffect } from "react";

import {
  PLANNING_DATA_UPDATED_EVENT,
  loadProcurementData,
  saveBusinessAnalysisProducts,
  saveProcurementData,
  type StoredProcurementData
} from "@/lib/planningStorage";
import { isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";

import { toNumber } from "../formatters";
import type { ProcurementRow, ProductRow } from "../types";

type Params = {
  products: ProductRow[];
  procurementRows: ProcurementRow[];
  hasLoadedProcurementFromStorage: boolean;
  setProcurementRows: (value: React.SetStateAction<ProcurementRow[]>) => void;
  setNextProcurementId: (value: React.SetStateAction<number>) => void;
  setHasLoadedProcurementFromStorage: (value: boolean) => void;
  setPlanningDataVersion: (value: React.SetStateAction<number>) => void;
  setLocksDisabledByUser: (value: boolean) => void;
};

export function useBusinessAnalysisStorageEffects({
  products,
  procurementRows,
  hasLoadedProcurementFromStorage,
  setProcurementRows,
  setNextProcurementId,
  setHasLoadedProcurementFromStorage,
  setPlanningDataVersion,
  setLocksDisabledByUser
}: Params) {
  useEffect(() => {
    if (hasLoadedProcurementFromStorage) {
      return;
    }

    const storedProcurement = loadProcurementData();
    if (storedProcurement.length > 0) {
      setProcurementRows(
        storedProcurement.map((row, index) => ({
          id: `pr-${index + 1}`,
          material: row.material,
          unit: row.unit,
          totalAvailable: row.totalAvailable.toString(),
          totalProcurementCost: row.totalProcurementCost.toString()
        }))
      );
      setNextProcurementId(storedProcurement.length + 1);
    }

    setHasLoadedProcurementFromStorage(true);
  }, [hasLoadedProcurementFromStorage, setProcurementRows, setNextProcurementId, setHasLoadedProcurementFromStorage]);

  useEffect(() => {
    if (!hasLoadedProcurementFromStorage) {
      return;
    }

    const cleanRows: StoredProcurementData[] = procurementRows
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

    saveProcurementData(cleanRows);
  }, [procurementRows, hasLoadedProcurementFromStorage]);

  useEffect(() => {
    const productNames = Array.from(new Set(products.map((product) => product.productName.trim()).filter((name) => name.length > 0)));
    saveBusinessAnalysisProducts(productNames);
  }, [products]);

  useEffect(() => {
    const handlePlanningDataUpdate = () => {
      setPlanningDataVersion((previous) => previous + 1);
    };

    window.addEventListener("storage", handlePlanningDataUpdate);
    window.addEventListener(PLANNING_DATA_UPDATED_EVENT, handlePlanningDataUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handlePlanningDataUpdate);
      window.removeEventListener(PLANNING_DATA_UPDATED_EVENT, handlePlanningDataUpdate as EventListener);
    };
  }, [setPlanningDataVersion]);

  useEffect(() => {
    const syncDisabledLockState = () => {
      setLocksDisabledByUser(isLocksDisabledOverride());
    };

    syncDisabledLockState();
    window.addEventListener("storage", syncDisabledLockState);
    window.addEventListener(PLANNING_LOCKS_UPDATED_EVENT, syncDisabledLockState as EventListener);

    return () => {
      window.removeEventListener("storage", syncDisabledLockState);
      window.removeEventListener(PLANNING_LOCKS_UPDATED_EVENT, syncDisabledLockState as EventListener);
    };
  }, [setLocksDisabledByUser]);
}
