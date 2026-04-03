"use client";

import { useRef } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
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
    <main ref={pageRef} className="page-shell">
      <section className="hero">
        <h1>{state.lockedMode ? "LOCKED PAGE" : "Material Requirements"}</h1>
        <p>
          Define product-to-material usage and procurement data for deterministic break-even and procurement planning. Product options are referenced
          from Business Analysis.
        </p>
        <div className="nav">
          <a href="/">{state.lockedMode ? "Unlocked Page" : "Summary Dashboard"}</a>
          <a href="/materials">{state.lockedMode ? "Locked Page" : "Material Requirements"}</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/about">About Developer</a>
          <button type="button" onClick={state.toggleLockMode} style={{ maxWidth: "220px", marginLeft: "auto" }}>
            {state.lockedMode ? "Disable Lock" : "Enable Lock"}
          </button>
          <button type="button" onClick={state.signOut} style={{ width: "fit-content", maxWidth: "none", whiteSpace: "nowrap" }}>
            Sign Out ({state.email})
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1.25rem" }}>
        <h2>{state.lockedMode ? "LOCKED PAGE" : "MATERIAL REQUIREMENTS PAGE"}</h2>
        <p className="muted">Required structure: Product | Material | Unit | Quantity Needed per Product</p>
        <p className="muted">Products are auto-listed from Business Analysis. Use + beside each product to add material rows.</p>
        {state.lockStatusLoading ? <p className="muted">Checking lock status from Supabase...</p> : null}
        {state.lockedMode ? <p className="muted" style={{ marginTop: "0.45rem" }}>Locked mode is active from Supabase data. This page shows Materials Requirement only.</p> : null}

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
  );
}
