"use client";

import { useEffect, useMemo, useState } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";
import { useOrgAuth } from "@/hooks/useOrgAuth";
import {
  PLANNING_DATA_UPDATED_EVENT,
  buildProcurementCostPerUnitMap,
  loadBusinessAnalysisProducts,
  loadMaterialRequirements,
  loadProcurementData,
  normalizePlanningLabel,
  saveMaterialRequirements,
  saveProcurementData,
  type StoredMaterialRequirement,
  type StoredProcurementData
} from "@/lib/planningStorage";
import { seedLocalPlanningData, shouldAutofillLocalInput } from "@/testInput/localAutofill";

type MaterialRequirementRow = {
  id: string;
  product: string;
  material: string;
  quantityNeededPerProduct: string;
};

type ProcurementRow = {
  id: string;
  material: string;
  totalAvailable: string;
  totalProcurementCost: string;
};

const INITIAL_MATERIAL_ROWS: MaterialRequirementRow[] = [];

const INITIAL_PROCUREMENT_ROWS: ProcurementRow[] = [
  {
    id: "pr-1",
    material: "",
    totalAvailable: "",
    totalProcurementCost: ""
  }
];

function toNumber(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function normalizeMaterial(value: string): string {
  return value.trim().toLowerCase();
}

function formatPhp(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MaterialsWorkspace() {
  const { loading: authLoading, authorized, email, signOut } = useOrgAuth();

  const [materialRows, setMaterialRows] = useState<MaterialRequirementRow[]>(INITIAL_MATERIAL_ROWS);
  const [procurementRows, setProcurementRows] = useState<ProcurementRow[]>(INITIAL_PROCUREMENT_ROWS);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [nextMaterialId, setNextMaterialId] = useState(2);
  const [nextProcurementId, setNextProcurementId] = useState(2);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (!shouldAutofillLocalInput()) {
      return;
    }

    seedLocalPlanningData();
  }, []);

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

    const cleanRows: StoredProcurementData[] = procurementRows
      .map((row) => {
        const available = toNumber(row.totalAvailable);
        const totalCost = toNumber(row.totalProcurementCost);
        if (!row.material.trim() || available === null || available <= 0 || totalCost === null || totalCost < 0) {
          return null;
        }

        return {
          material: row.material.trim(),
          totalAvailable: available,
          totalProcurementCost: totalCost
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    saveProcurementData(cleanRows);
  }, [procurementRows, hasLoadedFromStorage]);

  const procurementMaterialOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];

    procurementRows.forEach((row) => {
      const material = row.material.trim();
      const key = normalizePlanningLabel(material);
      if (!material || seen.has(key)) {
        return;
      }

      seen.add(key);
      options.push(material);
    });

    return options;
  }, [procurementRows]);

  const materialRowsByProduct = useMemo(() => {
    const grouped = new Map<string, MaterialRequirementRow[]>();

    productOptions.forEach((productName) => {
      grouped.set(normalizePlanningLabel(productName), []);
    });

    materialRows.forEach((row) => {
      const key = normalizePlanningLabel(row.product);
      const current = grouped.get(key) ?? [];
      current.push(row);
      grouped.set(key, current);
    });

    return grouped;
  }, [materialRows, productOptions]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const productKeySet = new Set(productOptions.map((product) => normalizePlanningLabel(product)));

    if (productOptions.length === 0) {
      errors.push("No products found from Business Analysis page. Add products there first.");
    }

    if (materialRows.length === 0) {
      errors.push("No material requirements have been added yet. Use the + button beside each product.");
    }

    materialRows.forEach((row, index) => {
      const rowNo = index + 1;
      if (!row.product.trim()) {
        errors.push(`Material row ${rowNo}: Product is required.`);
      } else if (!productKeySet.has(normalizePlanningLabel(row.product))) {
        errors.push(`Material row ${rowNo}: Product must be selected from Business Analysis page products.`);
      }

      if (!row.material.trim()) {
        errors.push(`Material row ${rowNo}: Material is required.`);
      }

      const qty = toNumber(row.quantityNeededPerProduct);
      if (qty === null || qty <= 0) {
        errors.push(`Material row ${rowNo}: Quantity Needed per Product must be greater than 0.`);
      }
    });

    const procurementByMaterial = new Map<string, ProcurementRow[]>();
    procurementRows.forEach((row, index) => {
      const rowNo = index + 1;
      if (!row.material.trim()) {
        errors.push(`Procurement row ${rowNo}: Material is required.`);
      }

      const available = toNumber(row.totalAvailable);
      if (available === null || available <= 0) {
        errors.push(`Procurement row ${rowNo}: Total Available must be greater than 0.`);
      }

      const totalCost = toNumber(row.totalProcurementCost);
      if (totalCost === null || totalCost < 0) {
        errors.push(`Procurement row ${rowNo}: Total Procurement Cost must be 0 or greater.`);
      }

      const key = normalizeMaterial(row.material);
      if (key) {
        const current = procurementByMaterial.get(key) ?? [];
        current.push(row);
        procurementByMaterial.set(key, current);
      }
    });

    const requiredMaterialSet = new Set(
      materialRows
        .map((row) => normalizeMaterial(row.material))
        .filter((material) => material.length > 0)
    );

    requiredMaterialSet.forEach((materialKey) => {
      if (!procurementByMaterial.has(materialKey)) {
        errors.push(`Procurement data missing for required material: ${materialKey}.`);
      }
    });

    const cleanProcurementRows = procurementRows
      .map((row) => {
        const available = toNumber(row.totalAvailable);
        const totalCost = toNumber(row.totalProcurementCost);
        if (!row.material.trim() || available === null || available <= 0 || totalCost === null || totalCost < 0) {
          return null;
        }

        return {
          material: row.material.trim(),
          totalAvailable: available,
          totalProcurementCost: totalCost
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const procurementSummary = [...buildProcurementCostPerUnitMap(cleanProcurementRows).values()];

    return {
      errors,
      procurementSummary
    };
  }, [materialRows, procurementRows, productOptions]);

  const updateMaterialRow = (id: string, field: keyof MaterialRequirementRow, value: string) => {
    setMaterialRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addMaterialRowForProduct = (productName: string) => {
    const id = `mr-${nextMaterialId}`;
    setMaterialRows((previous) => [
      ...previous,
      {
        id,
        product: productName,
        material: "",
        quantityNeededPerProduct: ""
      }
    ]);
    setNextMaterialId((prev) => prev + 1);
  };

  const updateProcurementRow = (id: string, field: keyof ProcurementRow, value: string) => {
    setProcurementRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addProcurementRow = () => {
    const id = `pr-${nextProcurementId}`;
    setProcurementRows((previous) => [
      ...previous,
      {
        id,
        material: "",
        totalAvailable: "",
        totalProcurementCost: ""
      }
    ]);
    setNextProcurementId((prev) => prev + 1);
  };

  const removeMaterialRow = (id: string) => {
    setMaterialRows((previous) => previous.filter((row) => row.id !== id));
  };

  const removeProcurementRow = (id: string) => {
    setProcurementRows((previous) => (previous.length > 1 ? previous.filter((row) => row.id !== id) : previous));
  };

  const runValidation = () => {
    setShowValidation(true);
  };

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

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Material Requirements</h1>
        <p>
          Define product-to-material usage and procurement data before simplex minimization and production feasibility checks. Product options are
          referenced from Business Analysis.
        </p>
        <div className="nav">
          <a href="/">Business Analysis</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <button type="button" onClick={signOut} style={{ maxWidth: "220px" }}>
            Sign Out ({email})
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1.25rem" }}>
        <h2>MATERIAL REQUIREMENTS PAGE</h2>
        <p className="muted">Required structure: Product | Material | Quantity Needed per Product</p>
        <p className="muted">
          Products are auto-listed from Business Analysis. Use + beside each product to add material rows.
        </p>

        {productOptions.length === 0 ? (
          <UserErrorPanel
            title="No Business Products Found"
            message="Add products in Business Analysis first. They will auto-appear here for material assignment."
          />
        ) : (
          <div className="product-material-stack" style={{ marginTop: "0.7rem" }}>
            {productOptions.map((productName) => {
              const rows = materialRowsByProduct.get(normalizePlanningLabel(productName)) ?? [];

              return (
                <article key={`product-block-${productName}`} className="product-material-block">
                  <div className="product-material-head">
                    <h3>{productName}</h3>
                    <button
                      type="button"
                      className="plus-sign-btn"
                      onClick={() => addMaterialRowForProduct(productName)}
                      title={`Add material for ${productName}`}
                      aria-label={`Add material for ${productName}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="table-wrap" style={{ marginTop: "0.55rem" }}>
                    <table className="ops-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Quantity Needed per Product</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="material-empty-row">
                              No materials added yet for this product.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <select
                                  value={row.material}
                                  onChange={(event) => updateMaterialRow(row.id, "material", event.target.value)}
                                >
                                  <option value="">
                                    {procurementMaterialOptions.length > 0 ? "Select material from Procurement Data" : "Add procurement materials first"}
                                  </option>
                                  {procurementMaterialOptions.map((material) => (
                                    <option key={`material-option-${productName}-${material}`} value={material}>
                                      {material}
                                    </option>
                                  ))}
                                  {row.material &&
                                  !procurementMaterialOptions.some(
                                    (material) => normalizePlanningLabel(material) === normalizePlanningLabel(row.material)
                                  ) ? (
                                    <option value={row.material}>{row.material}</option>
                                  ) : null}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.quantityNeededPerProduct}
                                  onChange={(event) => updateMaterialRow(row.id, "quantityNeededPerProduct", event.target.value)}
                                  placeholder="0.00"
                                />
                              </td>
                              <td>
                                <button type="button" onClick={() => removeMaterialRow(row.id)} style={{ maxWidth: "130px" }}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Procurement Data</h2>
        <p className="muted">Required structure: Material | Total Available | Total Procurement Cost (PHP)</p>

        <div className="table-wrap" style={{ marginTop: "0.7rem" }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Total Available</th>
                <th>Total Procurement Cost (₱)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {procurementRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      value={row.material}
                      onChange={(event) => updateProcurementRow(row.id, "material", event.target.value)}
                      placeholder="Example: Sugar"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.totalAvailable}
                      onChange={(event) => updateProcurementRow(row.id, "totalAvailable", event.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.totalProcurementCost}
                      onChange={(event) => updateProcurementRow(row.id, "totalProcurementCost", event.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeProcurementRow(row.id)}
                      disabled={procurementRows.length <= 1}
                      style={{ maxWidth: "130px" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={addProcurementRow} style={{ marginTop: "0.75rem", maxWidth: "240px" }}>
          Add Procurement Row
        </button>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Validation</h2>
        <button type="button" onClick={runValidation} style={{ maxWidth: "250px" }}>
          Validate Material + Procurement Data
        </button>

        {showValidation ? (
          validation.errors.length > 0 ? (
            <UserErrorPanel title="Validation Failed" message={validation.errors.join(" ")} />
          ) : (
            <div className="formula-box" style={{ marginTop: "0.75rem" }}>
              <p>System completeness status: Complete for material + procurement pages.</p>
              <p>Simplex readiness: Ready for material-cost coefficient generation.</p>
            </div>
          )
        ) : null}

        {validation.procurementSummary.length > 0 ? (
          <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Total Available</th>
                  <th>Total Procurement Cost</th>
                  <th>Cost per Unit</th>
                </tr>
              </thead>
              <tbody>
                {validation.procurementSummary.map((row) => (
                  <tr key={`summary-${row.material}`}>
                    <td>{row.material}</td>
                    <td>{row.totalAvailable.toLocaleString("en-PH")}</td>
                    <td>{formatPhp(row.totalProcurementCost)}</td>
                    <td>{formatPhp(row.costPerUnit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
