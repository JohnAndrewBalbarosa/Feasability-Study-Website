import { useEffect } from "react";

import {
  loadBusinessAnalysisCostInputs,
  loadBusinessAnalysisCurrentStep,
  loadBusinessAnalysisProductInputs,
  saveBusinessAnalysisCostInputs,
  saveBusinessAnalysisCurrentStep,
  saveBusinessAnalysisProductInputs
} from "@/lib/businessAnalysisSessionStorage";

import { STEP_TITLES } from "../constants";
import type { CostRow, ProductRow } from "../types";

type RestoreParams = {
  hasLoadedProcurementFromStorage: boolean;
  setCurrentStep: (value: React.SetStateAction<number>) => void;
  setProducts: (value: React.SetStateAction<ProductRow[]>) => void;
  setCostRows: (value: React.SetStateAction<CostRow[]>) => void;
  setNextProductId: (value: React.SetStateAction<number>) => void;
  setNextCostId: (value: React.SetStateAction<number>) => void;
};

type PersistParams = {
  currentStep: number;
  products: ProductRow[];
  costRows: CostRow[];
};

export function useRestoreBusinessAnalysisSessionDrafts({
  hasLoadedProcurementFromStorage,
  setCurrentStep,
  setProducts,
  setCostRows,
  setNextProductId,
  setNextCostId
}: RestoreParams) {
  useEffect(() => {
    if (hasLoadedProcurementFromStorage) {
      return;
    }

    const storedProductInputs = loadBusinessAnalysisProductInputs();
    if (storedProductInputs.length > 0) {
      setProducts(storedProductInputs);
      const nextProductId = storedProductInputs.reduce((maxValue, row) => {
        const match = /^p-(\d+)$/.exec(row.id);
        if (!match) {
          return maxValue;
        }

        return Math.max(maxValue, Number(match[1]) + 1);
      }, 2);
      setNextProductId(nextProductId);
    }

    const storedCostInputs = loadBusinessAnalysisCostInputs();
    if (storedCostInputs.length > 0) {
      setCostRows(storedCostInputs);
      const nextCostId = storedCostInputs.reduce((maxValue, row) => {
        const match = /^cost-extra-(\d+)$/.exec(row.id);
        if (!match) {
          return maxValue;
        }

        return Math.max(maxValue, Number(match[1]) + 1);
      }, 1);
      setNextCostId(nextCostId);
    }

    const storedCurrentStep = loadBusinessAnalysisCurrentStep();
    if (storedCurrentStep !== null) {
      setCurrentStep(Math.max(1, Math.min(STEP_TITLES.length, storedCurrentStep)));
    }
  }, [
    hasLoadedProcurementFromStorage,
    setCurrentStep,
    setProducts,
    setCostRows,
    setNextProductId,
    setNextCostId
  ]);
}

export function usePersistBusinessAnalysisSessionDrafts({ currentStep, products, costRows }: PersistParams) {
  useEffect(() => {
    saveBusinessAnalysisProductInputs(products);
  }, [products]);

  useEffect(() => {
    saveBusinessAnalysisCostInputs(
      costRows.map((row) => ({
        id: row.id,
        costName: row.costName,
        amount: row.amount,
        isBudget: Boolean(row.isBudget)
      }))
    );
  }, [costRows]);

  useEffect(() => {
    saveBusinessAnalysisCurrentStep(currentStep);
  }, [currentStep]);
}
