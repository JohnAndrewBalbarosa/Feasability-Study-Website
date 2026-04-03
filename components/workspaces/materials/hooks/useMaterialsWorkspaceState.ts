"use client";

import { useMemo, useState } from "react";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import { disableAllPageLocks, enableAllPageLocks, isLocksDisabledOverride, PLANNING_LOCKS_UPDATED_EVENT } from "@/lib/pageLocks";
import {
  
} from "@/lib/planningStorage";

import { INITIAL_MATERIAL_ROWS, INITIAL_PROCUREMENT_ROWS } from "../constants";
import {
  buildMaterialRowsByProduct,
  buildProcurementMaterialOptions,
  buildProcurementUnitByMaterial,
  buildValidation
} from "../derivations";
import { useMaterialsHydrationEffects } from "./useMaterialsHydrationEffects";
import { useMaterialsLockEffects } from "./useMaterialsLockEffects";
import { useMaterialsPersistenceEffects } from "./useMaterialsPersistenceEffects";
import type { MaterialRequirementRow, ProcurementRow } from "../types";

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

  useMaterialsHydrationEffects({
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
  });

  useMaterialsLockEffects({
    authLoading,
    authorized,
    setLocksDisabledByUser,
    setLockStatusLoading,
    setServerLockEnabled
  });

  useMaterialsPersistenceEffects({ materialRows, procurementRows, hasLoadedFromStorage });

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
