import { normalizePlanningLabel } from "@/lib/planningStorage";

import type { MaterialRequirementRow } from "../types";

type MaterialRequirementsSectionProps = {
  productOptions: string[];
  materialRowsByProduct: Map<string, MaterialRequirementRow[]>;
  procurementMaterialOptions: string[];
  procurementUnitByMaterial: Map<string, string>;
  lockedMode: boolean;
  onAddMaterialRowForProduct: (productName: string) => void;
  onUpdateMaterialRow: (id: string, field: keyof MaterialRequirementRow, value: string) => void;
  onRemoveMaterialRow: (id: string) => void;
};

export default function MaterialRequirementsSection({
  productOptions,
  materialRowsByProduct,
  procurementMaterialOptions,
  procurementUnitByMaterial,
  lockedMode,
  onAddMaterialRowForProduct,
  onUpdateMaterialRow,
  onRemoveMaterialRow
}: MaterialRequirementsSectionProps) {
  return (
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
                onClick={() => onAddMaterialRowForProduct(productName)}
                title={`Add material for ${productName}`}
                aria-label={`Add material for ${productName}`}
                disabled={lockedMode}
              >
                +
              </button>
            </div>

            <div className="table-wrap" style={{ marginTop: "0.55rem" }}>
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Unit</th>
                    <th>Quantity Needed per Product</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="material-empty-row">
                        No materials added yet for this product.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <select
                            value={row.material}
                            onChange={(event) => onUpdateMaterialRow(row.id, "material", event.target.value)}
                            disabled={lockedMode}
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
                        <td>{procurementUnitByMaterial.get(normalizePlanningLabel(row.material)) ?? "-"}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.quantityNeededPerProduct}
                            onChange={(event) => onUpdateMaterialRow(row.id, "quantityNeededPerProduct", event.target.value)}
                            placeholder="0.00"
                            disabled={lockedMode}
                          />
                        </td>
                        <td>
                          <button type="button" onClick={() => onRemoveMaterialRow(row.id)} style={{ maxWidth: "130px" }} disabled={lockedMode}>
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
  );
}
