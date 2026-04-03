import { getSessionAuthHeaders } from "@/lib/authClient";
import { disableAllPageLocks, enableAllPageLocks } from "@/lib/pageLocks";
import { loadMaterialRequirements, loadProcurementData, normalizePlanningLabel } from "@/lib/planningStorage";

import { STEP_TITLES } from "../constants";
import type { SaveStatus, Step1Data, WeightedBreakEvenSummary } from "../types";

type Params = {
  currentStep: number;
  saveStatus: SaveStatus;
  setSaveStatus: (value: SaveStatus) => void;
  weightedBreakEvenSummary: WeightedBreakEvenSummary | null;
  step1Data: Step1Data;
  setServerLockEnabled: (value: boolean) => void;
  setLocksDisabledByUser: (value: boolean) => void;
  businessPagesLocked: boolean;
  setCurrentStep: (value: React.SetStateAction<number>) => void;
  goNext: () => void;
};

export function useBusinessAnalysisSaveHandlers({
  currentStep,
  saveStatus,
  setSaveStatus,
  weightedBreakEvenSummary,
  step1Data,
  setServerLockEnabled,
  setLocksDisabledByUser,
  businessPagesLocked,
  setCurrentStep,
  goNext
}: Params) {
  const toggleLockMode = () => {
    if (businessPagesLocked) {
      disableAllPageLocks();
      setLocksDisabledByUser(true);
      return;
    }

    enableAllPageLocks();
    setLocksDisabledByUser(false);
    setCurrentStep(1);
  };

  const addDataToSupabase = async () => {
    if (!weightedBreakEvenSummary) {
      setSaveStatus({ state: "error", message: "Cannot save yet. Complete Step 8 outputs first." });
      return;
    }

    setSaveStatus({ state: "saving", message: "Saving data to Supabase..." });
    const materialsData = loadMaterialRequirements();
    const procurementData = loadProcurementData();

    const parsedProductByName = new Map(step1Data.parsedProducts.map((product) => [normalizePlanningLabel(product.productName), product] as const));
    const step1CostRowsSnapshot = step1Data.parsedCosts.map((cost) => ({ costName: cost.costName, amount: cost.amount, isBudget: cost.isBudget }));

    const businessDataPayload = weightedBreakEvenSummary.rows.map((row) => ({
      productName: row.productName,
      packSize: parsedProductByName.get(normalizePlanningLabel(row.productName))?.packSize ?? "",
      revenuePerItem: row.revenuePerItem,
      weightedBreakEvenUnits: row.weightedBreakEvenUnits,
      weightedTargetProfit: row.weightedTargetProfit,
      actualUnitsSoldToday: row.actualUnitsSoldToday,
      deficitUnits: row.deficitUnits,
      revenueToday: row.revenueToday,
      profitToday: row.profitToday,
      step1CostRows: step1CostRowsSnapshot
    }));

    try {
      const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/basis/save", {
        method: "POST",
        headers,
        body: JSON.stringify({ businessAnalysisData: businessDataPayload, materialsData, procurementData })
      });

      const data = (await response.json()) as { message?: string; saved?: boolean };
      if (!response.ok || !data.saved) {
        setSaveStatus({ state: "error", message: data.message ?? "Failed to save basis data to Supabase." });
        return;
      }

      setSaveStatus({ state: "success", message: "Basis data successfully inserted into Supabase." });
      const lockHeaders = await getSessionAuthHeaders({ "Content-Type": "application/json" });
      const lockResponse = await fetch("/api/locks/status", { method: "GET", headers: lockHeaders });

      if (lockResponse.ok) {
        const lockData = (await lockResponse.json()) as { lockEnabled?: boolean };
        setServerLockEnabled(Boolean(lockData.lockEnabled));
      }
    } catch {
      setSaveStatus({ state: "error", message: "Failed to save basis data to Supabase." });
    }
  };

  const handlePrimaryAction = () => {
    if (currentStep === STEP_TITLES.length && saveStatus.state === "success") {
      enableAllPageLocks();
      setLocksDisabledByUser(false);
      window.location.href = "/";
      return;
    }

    if (currentStep === STEP_TITLES.length) {
      void addDataToSupabase();
      return;
    }

    goNext();
  };

  return { toggleLockMode, addDataToSupabase, handlePrimaryAction };
}
