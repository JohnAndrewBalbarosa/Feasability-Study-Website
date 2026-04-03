import { useEffect } from "react";

import { getSessionAuthHeaders } from "@/lib/authClient";
import {
  PLANNING_DATA_UPDATED_EVENT,
  loadBusinessAnalysisProducts,
  loadMaterialRequirements,
  normalizePlanningLabel
} from "@/lib/planningStorage";

import type { LatestMaterialsSnapshotResponse, MaterialRequirementRow, ProcurementRow } from "../types";

type Params = {
  hasLoadedFromStorage: boolean;
  hasHydratedLatestSnapshot: boolean;
  authLoading: boolean;
  authorized: boolean;
  productOptions: string[];
  setMaterialRows: (value: React.SetStateAction<MaterialRequirementRow[]>) => void;
  setProcurementRows: (value: React.SetStateAction<ProcurementRow[]>) => void;
  setProductOptions: (value: React.SetStateAction<string[]>) => void;
  setNextMaterialId: (value: React.SetStateAction<number>) => void;
  setHasLoadedFromStorage: (value: boolean) => void;
  setHasHydratedLatestSnapshot: (value: boolean) => void;
};

export function useMaterialsHydrationEffects({
  hasLoadedFromStorage,
  hasHydratedLatestSnapshot,
  authLoading,
  authorized,
  productOptions,
  setMaterialRows,
  setProcurementRows,
  setProductOptions,
  setNextMaterialId,
  setHasLoadedFromStorage,
  setHasHydratedLatestSnapshot
}: Params) {
  useEffect(() => {
    const storedRequirements = loadMaterialRequirements();
    setMaterialRows(
      storedRequirements.map((row, index) => ({
        id: `mr-${index + 1}`,
        product: row.product,
        material: row.material,
        quantityNeededPerProduct: row.quantityNeededPerProduct.toString()
      }))
    );
    setNextMaterialId(storedRequirements.length + 1);

    // Procurement rows intentionally start empty to avoid auto-loading pre-existing procurement data.
    setProcurementRows([]);

    setHasLoadedFromStorage(true);
  }, [setHasLoadedFromStorage, setMaterialRows, setNextMaterialId, setProcurementRows]);

  useEffect(() => {
    const refreshProductOptions = () => {
      setProductOptions(loadBusinessAnalysisProducts());
    };

    refreshProductOptions();
    window.addEventListener("storage", refreshProductOptions);
    window.addEventListener(PLANNING_DATA_UPDATED_EVENT, refreshProductOptions);

    return () => {
      window.removeEventListener("storage", refreshProductOptions);
      window.removeEventListener(PLANNING_DATA_UPDATED_EVENT, refreshProductOptions);
    };
  }, [setProductOptions]);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    const validProducts = new Set(productOptions.map((productName) => normalizePlanningLabel(productName)));
    setMaterialRows((previous) => {
      const filtered = previous.filter((row) => validProducts.has(normalizePlanningLabel(row.product)));
      return filtered.length === previous.length ? previous : filtered;
    });
  }, [productOptions, hasLoadedFromStorage, setMaterialRows]);

  useEffect(() => {
    if (hasHydratedLatestSnapshot || !hasLoadedFromStorage || authLoading || !authorized) {
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

        const payload = (await response.json()) as LatestMaterialsSnapshotResponse;
        if (cancelled) {
          return;
        }

        const hasLocalMaterialDrafts = loadMaterialRequirements().length > 0;

        const materialsFromSupabase = (payload.materials ?? [])
          .map((row, index) => {
            const product = row.product?.trim() ?? "";
            const material = row.material?.trim() ?? "";
            const quantityNeededPerProduct = typeof row.quantityNeededPerProduct === "number" ? row.quantityNeededPerProduct : null;

            if (!product || !material || quantityNeededPerProduct === null || !Number.isFinite(quantityNeededPerProduct) || quantityNeededPerProduct <= 0) {
              return null;
            }

            return {
              id: `mr-${index + 1}`,
              product,
              material,
              quantityNeededPerProduct: String(quantityNeededPerProduct)
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (!hasLocalMaterialDrafts && materialsFromSupabase.length > 0) {
          setMaterialRows(materialsFromSupabase);
          setNextMaterialId(materialsFromSupabase.length + 1);
        }
      } catch {
        // Fall back to local storage values when latest snapshot cannot be loaded.
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
    hasLoadedFromStorage,
    authLoading,
    authorized,
    setHasHydratedLatestSnapshot,
    setMaterialRows,
    setNextMaterialId
  ]);
}
