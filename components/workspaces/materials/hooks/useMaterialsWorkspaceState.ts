"use client";

import { useEffect, useMemo, useState } from "react";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import { getSessionAuthHeaders } from "@/lib/authClient";
import { disableAllPageLocks, enableAllPageLocks, isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";
import {
  PLANNING_DATA_UPDATED_EVENT,
  loadBusinessAnalysisProducts,
  loadMaterialRequirements,
  loadProcurementData,
  normalizePlanningLabel,
  saveMaterialRequirements,
  saveProcurementData,
  type StoredMaterialRequirement
} from "@/lib/planningStorage";

import { INITIAL_MATERIAL_ROWS, INITIAL_PROCUREMENT_ROWS } from "../constants";
import {
  buildCleanProcurementRows,
  buildMaterialRowsByProduct,
  buildProcurementMaterialOptions,
  buildProcurementUnitByMaterial,
  buildValidation
} from "../derivations";
import { toNumber } from "../formatters";
import type { LatestMaterialsSnapshotResponse, MaterialRequirementRow, ProcurementRow } from "../types";

export function useMaterialsWorkspaceState() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();

  const [materialRows, setMaterialRows] = useState<MaterialRequirementRow[]>(INITIAL_MATERIAL_ROWS);
  const [procurementRows, setProcurementRows] = useState<ProcurementRow[]>(INITIAL_PROCUREMENT_ROWS);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [nextMaterialId, setNextMaterialId] = useState(2);
  const [nextProcurementId, setNextProcurementId] = useState(2);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [lockStatusLoading, setLockStatusLoading] = useState(true);
  const [serverLockEnabled, setServerLockEnabled] = useState(false);
  const [locksDisabledByUser, setLocksDisabledByUser] = useState(false);
  const [hasHydratedLatestSnapshot, setHasHydratedLatestSnapshot] = useState(false);

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

    setHasLoadedFromStorage(true);
  }, []);

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
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) {
      return;
    }

    const validProducts = new Set(productOptions.map((productName) => normalizePlanningLabel(productName)));
    setMaterialRows((previous) => {
      const filtered = previous.filter((row) => validProducts.has(normalizePlanningLabel(row.product)));
      return filtered.length === previous.length ? previous : filtered;
    });
  }, [productOptions, hasLoadedFromStorage]);

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

        if (materialsFromSupabase.length > 0) {
          setMaterialRows(materialsFromSupabase);
          setNextMaterialId(materialsFromSupabase.length + 1);
        }

        const procurementFromSupabase = (payload.procurement ?? [])
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
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (procurementFromSupabase.length > 0) {
          setProcurementRows(procurementFromSupabase);
          setNextProcurementId(procurementFromSupabase.length + 1);
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
  }, [hasHydratedLatestSnapshot, hasLoadedFromStorage, authLoading, authorized]);

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
  }, []);

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    let cancelled = false;

    const loadLockStatus = async () => {
      setLockStatusLoading(true);
      try {
        const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/locks/status", { method: "GET", headers });

        if (!response.ok) {
          if (!cancelled) {
            setServerLockEnabled(false);
          }
          return;
        }

        const data = (await response.json()) as { lockEnabled?: boolean };
        if (!cancelled) {
          setServerLockEnabled(Boolean(data.lockEnabled));
        }
      } catch {
        if (!cancelled) {
          setServerLockEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLockStatusLoading(false);
        }
      }
    };

    void loadLockStatus();
    return () => {
      cancelled = true;
    };
  }, [authLoading, authorized]);

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

  const lockedMode = serverLockEnabled && !locksDisabledByUser;
  const materialRowsByProduct = useMemo(() => buildMaterialRowsByProduct(materialRows, productOptions), [materialRows, productOptions]);
  const procurementMaterialOptions = useMemo(() => buildProcurementMaterialOptions(procurementRows), [procurementRows]);
  const procurementUnitByMaterial = useMemo(() => buildProcurementUnitByMaterial(procurementRows), [procurementRows]);
  const validation = useMemo(() => buildValidation(materialRows, procurementRows, productOptions), [materialRows, procurementRows, productOptions]);

  const toggleLockMode = () => {
    if (lockedMode) {
      disableAllPageLocks();
      setLocksDisabledByUser(true);
      return;
    }

    enableAllPageLocks();
    setLocksDisabledByUser(false);
  };

  return {
    authLoading,
    authorized,
    email,
    signOut,
    materialRows,
    setMaterialRows,
    procurementRows,
    setProcurementRows,
    productOptions,
    nextMaterialId,
    setNextMaterialId,
    nextProcurementId,
    setNextProcurementId,
    showValidation,
    setShowValidation,
    lockStatusLoading,
    lockedMode,
    materialRowsByProduct,
    procurementMaterialOptions,
    procurementUnitByMaterial,
    validation,
    toggleLockMode
  };
}
