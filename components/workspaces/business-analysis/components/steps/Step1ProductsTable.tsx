import { normalizePlanningLabel } from "@/lib/planningStorage";

import type { ProductRow } from "../../types";

type InferredVariableCost = {
  variableCostPerItem: number | null;
};

type Props = {
  products: ProductRow[];
  inferredVariableCostByProduct: Map<string, InferredVariableCost>;
  onUpdateProduct: (id: string, field: keyof ProductRow, value: string) => void;
  onRemoveProductRow: (id: string) => void;
};

export default function Step1ProductsTable({ products, inferredVariableCostByProduct, onUpdateProduct, onRemoveProductRow }: Props) {
  return (
    <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Pack Size (descriptive)</th>
            <th>Selling Price (PHP per item)</th>
            <th>Variable Cost (PHP per item)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <input
                  type="text"
                  value={product.productName}
                  onChange={(event) => onUpdateProduct(product.id, "productName", event.target.value)}
                  placeholder="Example: Product A"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={product.packSize}
                  onChange={(event) => onUpdateProduct(product.id, "packSize", event.target.value)}
                  placeholder="Example: 6-pack"
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.sellingPrice}
                  onChange={(event) => onUpdateProduct(product.id, "sellingPrice", event.target.value)}
                  placeholder="0.00"
                />
              </td>
              <td>
                {(() => {
                  const inferred = inferredVariableCostByProduct.get(normalizePlanningLabel(product.productName));
                  const inferredValue = inferred?.variableCostPerItem;

                  return (
                    <>
                      <input
                        type="text"
                        readOnly
                        disabled
                        className="inferred-cost-input"
                        value={
                          inferredValue !== null && inferredValue !== undefined && Number.isFinite(inferredValue)
                            ? inferredValue.toFixed(4)
                            : ""
                        }
                        placeholder="Inferred from /materials"
                      />
                      <p className="muted inline-help">Auto-calculated from Material Requirements and Procurement Data.</p>
                    </>
                  );
                })()}
              </td>
              <td>
                <button type="button" onClick={() => onRemoveProductRow(product.id)} disabled={products.length <= 1} style={{ maxWidth: "140px" }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
