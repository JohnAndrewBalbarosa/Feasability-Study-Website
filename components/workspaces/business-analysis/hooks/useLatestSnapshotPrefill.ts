import { useEffect } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";
import { saveMaterialRequirements, saveProcurementData } from "@/lib/planningStorage";

import type { LatestBusinessSnapshotResponse, ProcurementRow } from "../types";
import { mapCostRowsFromSnapshot, mapMaterialsFromSnapshot, mapProcurementRowsFromSnapshot, mapProductsFromSnapshot } from "../selectors/snapshotMappers";

type Params = {
  authLoading: boolean;
  authorized: boolean;
  hasHydratedLatestSnapshot: boolean;
  setHasHydratedLatestSnapshot: (value: boolean) => void;
  setProducts: (value: React.SetStateAction<ReturnType<typeof mapProductsFromSnapshot>>) => void;
  setNextProductId: (value: React.SetStateAction<number>) => void;
  setCostRows: (value: React.SetStateAction<ReturnType<typeof mapCostRowsFromSnapshot>>) => void;
  setNextCostId: (value: React.SetStateAction<number>) => void;
  setProcurementRows: (value: React.SetStateAction<ProcurementRow[]>) => void;
  setNextProcurementId: (value: React.SetStateAction<number>) => void;
};

export function useLatestSnapshotPrefill({
  authLoading,
  authorized,
  hasHydratedLatestSnapshot,
  setHasHydratedLatestSnapshot,
  setProducts,
  setNextProductId,
  setCostRows,
  setNextCostId,
  setProcurementRows,
  setNextProcurementId
}: Params) {
  useEffect(() => {
    if (hasHydratedLatestSnapshot || authLoading || !authorized) {
      return;
    }

    let cancelled = false;

    const loadLatestSnapshot = async () => {
      try {
        const headers = await getSessionAuthHeaders();
        const response = await fetch("/api/basis/latest", { method: "GET", headers });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as LatestBusinessSnapshotResponse;
        if (cancelled) {
          return;
        }

        const productsFromSupabase = mapProductsFromSnapshot(payload);
        if (productsFromSupabase.length > 0) {
          setProducts(productsFromSupabase);
          setNextProductId(productsFromSupabase.length + 1);
        }

        const costRowsFromSupabase = mapCostRowsFromSnapshot(payload);
        if (costRowsFromSupabase.length > 0) {
          const budgetRow = costRowsFromSupabase.find((row) => row.isBudget);
          const nonBudgetRows = costRowsFromSupabase.filter((row) => !row.isBudget);
          setCostRows([...nonBudgetRows, budgetRow ?? { id: "budget", costName: "Budget (overall constraint)", amount: "", isBudget: true }]);
          setNextCostId(nonBudgetRows.length + 1);
        }

        const procurementFromSupabase = mapProcurementRowsFromSnapshot(payload);
        if (procurementFromSupabase.length > 0) {
          setProcurementRows(procurementFromSupabase);
          setNextProcurementId(procurementFromSupabase.length + 1);
          saveProcurementData(
            procurementFromSupabase.map((row) => ({
              material: row.material,
              unit: row.unit,
              totalAvailable: Number(row.totalAvailable),
              totalProcurementCost: Number(row.totalProcurementCost)
            }))
          );
        }

        const materialsFromSupabase = mapMaterialsFromSnapshot(payload);
        if (materialsFromSupabase.length > 0) {
          saveMaterialRequirements(materialsFromSupabase);
        }
      } catch {
        // Fall back to existing local state when latest snapshot cannot be loaded.
      } finally {
        if (!cancelled) {
          setHasHydratedLatestSnapshot(true);
        }
      }
    };

    void loadLatestSnapshot();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydratedLatestSnapshot,
    authLoading,
    authorized,
    setHasHydratedLatestSnapshot,
    setProducts,
    setNextProductId,
    setCostRows,
    setNextCostId,
    setProcurementRows,
    setNextProcurementId
  ]);
}
