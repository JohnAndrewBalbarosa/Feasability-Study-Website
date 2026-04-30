"use client";

import { useRef } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import PageTopBar from "@/components/PageTopBar";
import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";
import { useMaterialsActions } from "./handlers/useMaterialsActions";
import { useMaterialsWorkspaceState } from "./hooks/useMaterialsWorkspaceState";
import MaterialRequirementsSection from "./components/MaterialRequirementsSection";
import ProcurementSection from "./components/ProcurementSection";
import ValidationSection from "./components/ValidationSection";

export default function MaterialsWorkspace() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  const state = useMaterialsWorkspaceState();
  const actions = useMaterialsActions({
    nextMaterialId: state.nextMaterialId,
    setNextMaterialId: state.setNextMaterialId,
    setMaterialRows: state.setMaterialRows,
    nextProcurementId: state.nextProcurementId,
    setNextProcurementId: state.setNextProcurementId,
    setProcurementRows: state.setProcurementRows
  });

  if (state.authLoading) {
    return (
      <main className="page-shell">
        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Checking account access...</h2>
        </section>
      </main>
    );
  }

  if (!state.authorized) {
    return null;
  }

  return (
    <>
      <PageTopBar
        email={state.email}
        onSignOut={state.signOut}
        onToggleLockMode={state.toggleLockMode}
        isLocked={state.lockedMode}
        lockStatusLoading={state.lockStatusLoading}
      />
    <main ref={pageRef} className="page-shell">
      <div className="page-heading">
        <h1>Materials Setup</h1>
      </div>

      <section className="card" style={{ marginTop: "1.25rem" }}>
        <h2>Material Requirements</h2>
        <p className="muted">Each product needs a list of materials. Use the + button next to a product to add material rows.</p>
        {state.lockedMode ? <p className="muted" style={{ marginTop: "0.45rem" }}>Lock mode is active — this page is read-only.</p> : null}

        {state.productOptions.length === 0 ? (
          <UserErrorPanel
            title="No Business Products Found"
            message="Add products in Business Analysis first. They will auto-appear here for material assignment."
          />
        ) : (
          <MaterialRequirementsSection
            productOptions={state.productOptions}
            materialRowsByProduct={state.materialRowsByProduct}
            procurementMaterialOptions={state.procurementMaterialOptions}
            procurementUnitByMaterial={state.procurementUnitByMaterial}
            lockedMode={state.lockedMode}
            onAddMaterialRowForProduct={actions.addMaterialRowForProduct}
            onUpdateMaterialRow={actions.updateMaterialRow}
            onRemoveMaterialRow={actions.removeMaterialRow}
          />
        )}
      </section>

      {!state.lockedMode ? (
        <>
          <ProcurementSection
            procurementRows={state.procurementRows}
            onUpdateProcurementRow={actions.updateProcurementRow}
            onRemoveProcurementRow={actions.removeProcurementRow}
            onAddProcurementRow={actions.addProcurementRow}
          />
          <ValidationSection
            showValidation={state.showValidation}
            errors={state.validation.errors}
            procurementSummary={state.validation.procurementSummary}
            onRunValidation={() => {
              state.setShowValidation(true);
            }}
          />
        </>
      ) : null}
    </main>
    </>
  );
}
