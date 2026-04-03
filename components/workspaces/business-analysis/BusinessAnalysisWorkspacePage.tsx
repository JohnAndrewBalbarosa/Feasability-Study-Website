"use client";

import { useOrgAuth } from "@/hooks/useOrgAuth";
import UserErrorPanel from "@/components/UserErrorPanel";
import { STEP_TITLES } from "./constants";
import BusinessHero from "./components/BusinessHero";
import LockedProcurementPage from "./components/LockedProcurementPage";
import StepNavigator from "./components/StepNavigator";
import BusinessAnalysisStepSection from "./components/steps/BusinessAnalysisStepSection";
import { useBusinessAnalysisNavigationHandlers } from "./handlers/useBusinessAnalysisNavigationHandlers";
import { useBusinessAnalysisRowHandlers } from "./handlers/useBusinessAnalysisRowHandlers";
import { useBusinessAnalysisSaveHandlers } from "./handlers/useBusinessAnalysisSaveHandlers";
import { useBusinessAnalysisDerivedData } from "./hooks/useBusinessAnalysisDerivedData";
import { useBusinessLockStatusEffect } from "./hooks/useBusinessLockStatusEffect";
import { useBusinessAnalysisState } from "./hooks/useBusinessAnalysisState";
import { useBusinessAnalysisStorageEffects } from "./hooks/useBusinessAnalysisStorageEffects";
import { useLatestSnapshotPrefill } from "./hooks/useLatestSnapshotPrefill";

export default function BusinessAnalysisWorkspace() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();
  const state = useBusinessAnalysisState();

  useBusinessAnalysisStorageEffects({
    products: state.products,
    procurementRows: state.procurementRows,
    hasLoadedProcurementFromStorage: state.hasLoadedProcurementFromStorage,
    setProcurementRows: state.setProcurementRows,
    setNextProcurementId: state.setNextProcurementId,
    setHasLoadedProcurementFromStorage: state.setHasLoadedProcurementFromStorage,
    setPlanningDataVersion: state.setPlanningDataVersion,
    setLocksDisabledByUser: state.setLocksDisabledByUser
  });

  useLatestSnapshotPrefill({
    authLoading,
    authorized,
    hasHydratedLatestSnapshot: state.hasHydratedLatestSnapshot,
    setHasHydratedLatestSnapshot: state.setHasHydratedLatestSnapshot,
    setProducts: state.setProducts,
    setNextProductId: state.setNextProductId,
    setCostRows: state.setCostRows,
    setNextCostId: state.setNextCostId,
    setProcurementRows: state.setProcurementRows,
    setNextProcurementId: state.setNextProcurementId
  });

  useBusinessLockStatusEffect({
    authLoading,
    authorized,
    setLockStatusLoading: state.setLockStatusLoading,
    setServerLockEnabled: state.setServerLockEnabled
  });

  const derived = useBusinessAnalysisDerivedData(state.products, state.costRows, state.planningDataVersion);
  const businessPagesLocked = state.serverLockEnabled && !state.locksDisabledByUser;

  const rowHandlers = useBusinessAnalysisRowHandlers({
    products: state.products,
    setProducts: state.setProducts,
    nextProductId: state.nextProductId,
    setNextProductId: state.setNextProductId,
    setCostRows: state.setCostRows,
    nextCostId: state.nextCostId,
    setNextCostId: state.setNextCostId,
    procurementRows: state.procurementRows,
    setProcurementRows: state.setProcurementRows,
    nextProcurementId: state.nextProcurementId,
    setNextProcurementId: state.setNextProcurementId
  });

  const navHandlers = useBusinessAnalysisNavigationHandlers({
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
    setStepErrors: state.setStepErrors,
    businessPagesLocked,
    step1Data: derived.step1Data,
    unitsData: derived.unitsData,
    profitAnalysis: derived.profitAnalysis,
    breakEvenAnalysis: derived.breakEvenAnalysis,
    graphData: derived.graphData,
    graphPathData: derived.graphPathData,
    weightedBreakEvenSummary: derived.weightedBreakEvenSummary
  });

  const saveHandlers = useBusinessAnalysisSaveHandlers({
    currentStep: state.currentStep,
    saveStatus: state.saveStatus,
    setSaveStatus: state.setSaveStatus,
    weightedBreakEvenSummary: derived.weightedBreakEvenSummary,
    step1Data: derived.step1Data,
    setServerLockEnabled: state.setServerLockEnabled,
    setLocksDisabledByUser: state.setLocksDisabledByUser,
    businessPagesLocked,
    setCurrentStep: state.setCurrentStep,
    goNext: navHandlers.goNext
  });

  if (authLoading) {
    return (
      <main className="page-shell">
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Checking account access...</h2>
        </section>
      </main>
    );
  }

  if (!authorized) {
    return null;
  }

  if (businessPagesLocked && state.currentStep < 3) {
    return (
      <LockedProcurementPage
        email={email}
        procurementRows={state.procurementRows}
        onToggleLockMode={saveHandlers.toggleLockMode}
        onSignOut={signOut}
        onUpdateProcurementRow={rowHandlers.updateProcurementRow}
        onRemoveProcurementRow={rowHandlers.removeProcurementRow}
        onAddProcurementRow={rowHandlers.addProcurementRow}
        onGoToStep3={navHandlers.goToLockedStep3}
      />
    );
  }

  return (
    <main className="page-shell">
      <BusinessHero email={email} onToggleLockMode={saveHandlers.toggleLockMode} onSignOut={signOut} />
      <section className="card" style={{ marginTop: "1.25rem" }}>
        <StepNavigator
          stepTitles={STEP_TITLES}
          currentStep={state.currentStep}
          isLocked={businessPagesLocked}
          lockStatusLoading={state.lockStatusLoading}
          onStepChange={(step) => state.setCurrentStep(step <= state.currentStep ? step : state.currentStep)}
        />
        {state.stepErrors.length > 0 ? (
          <UserErrorPanel title="Missing or Invalid Data" message={state.stepErrors.join(" ")} actionLabel="Review Inputs" onAction={() => state.setStepErrors([])} />
        ) : null}

        <BusinessAnalysisStepSection
          currentStep={state.currentStep}
          products={state.products}
          costRows={state.costRows}
          step1Data={derived.step1Data}
          profitAnalysis={derived.profitAnalysis}
          breakEvenAnalysis={derived.breakEvenAnalysis}
          graphData={derived.graphData}
          graphPathData={derived.graphPathData}
          weightedBreakEvenSummary={derived.weightedBreakEvenSummary}
          weightedBreakEvenTotals={derived.weightedBreakEvenTotals}
          step8ProfitDisplay={derived.step8ProfitDisplay}
          materialProcurementRecommendations={derived.materialProcurementRecommendations}
          saveStatus={state.saveStatus}
          profitabilityStatus={derived.profitabilityStatus}
          breakEvenInsight={derived.breakEvenInsight}
          inferredVariableCostByProduct={derived.inferredVariableCostByProduct}
          onUpdateProduct={rowHandlers.updateProduct}
          onAddProductRow={rowHandlers.addProductRow}
          onRemoveProductRow={rowHandlers.removeProductRow}
          onUpdateCostRow={rowHandlers.updateCostRow}
          onAddCostRow={rowHandlers.addCostRow}
          onRemoveCostRow={rowHandlers.removeCostRow}
        />

        <div className="wizard-nav">
          <button type="button" onClick={navHandlers.goBack} disabled={state.currentStep === 1} style={{ maxWidth: "170px" }}>
            Previous Step
          </button>
          <button
            type="button"
            onClick={saveHandlers.handlePrimaryAction}
            disabled={state.currentStep === STEP_TITLES.length && state.saveStatus.state === "saving"}
            style={{ maxWidth: "170px", justifySelf: "end" }}
          >
            {state.currentStep === STEP_TITLES.length
              ? state.saveStatus.state === "saving"
                ? "Adding..."
                : state.saveStatus.state === "success"
                  ? "Go To Main Page"
                  : "Add to Supabase"
              : "Next Step"}
          </button>
        </div>
      </section>
    </main>
  );
}
