import { useState } from "react";

import { INITIAL_COST_ROWS, INITIAL_PROCUREMENT_ROWS, INITIAL_PRODUCTS } from "../constants";
import type { CostRow, ProcurementRow, ProductRow, SaveStatus } from "../types";

export function useBusinessAnalysisState() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>(INITIAL_PRODUCTS);
  const [costRows, setCostRows] = useState<CostRow[]>(INITIAL_COST_ROWS);
  const [nextProductId, setNextProductId] = useState(2);
  const [nextCostId, setNextCostId] = useState(1);
  const [procurementRows, setProcurementRows] = useState<ProcurementRow[]>(INITIAL_PROCUREMENT_ROWS);
  const [nextProcurementId, setNextProcurementId] = useState(2);
  const [planningDataVersion, setPlanningDataVersion] = useState(0);
  const [hasLoadedProcurementFromStorage, setHasLoadedProcurementFromStorage] = useState(false);
  const [lockStatusLoading, setLockStatusLoading] = useState(true);
  const [serverLockEnabled, setServerLockEnabled] = useState(false);
  const [locksDisabledByUser, setLocksDisabledByUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "idle", message: "" });
  const [hasHydratedLatestSnapshot, setHasHydratedLatestSnapshot] = useState(false);

  return {
    currentStep,
    setCurrentStep,
    stepErrors,
    setStepErrors,
    products,
    setProducts,
    costRows,
    setCostRows,
    nextProductId,
    setNextProductId,
    nextCostId,
    setNextCostId,
    procurementRows,
    setProcurementRows,
    nextProcurementId,
    setNextProcurementId,
    planningDataVersion,
    setPlanningDataVersion,
    hasLoadedProcurementFromStorage,
    setHasLoadedProcurementFromStorage,
    lockStatusLoading,
    setLockStatusLoading,
    serverLockEnabled,
    setServerLockEnabled,
    locksDisabledByUser,
    setLocksDisabledByUser,
    saveStatus,
    setSaveStatus,
    hasHydratedLatestSnapshot,
    setHasHydratedLatestSnapshot
  };
}
