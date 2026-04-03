import type { CostRow, ProductRow } from "../../types";
import Step1CostsTable from "./Step1CostsTable";
import Step1ProductsTable from "./Step1ProductsTable";

type InferredVariableCost = {
  variableCostPerItem: number | null;
};

type Props = {
  products: ProductRow[];
  costRows: CostRow[];
  inferredVariableCostByProduct: Map<string, InferredVariableCost>;
  onUpdateProduct: (id: string, field: keyof ProductRow, value: string) => void;
  onRemoveProductRow: (id: string) => void;
  onAddProductRow: () => void;
  onUpdateCostRow: (id: string, field: keyof CostRow, value: string) => void;
  onRemoveCostRow: (id: string) => void;
  onAddCostRow: () => void;
};

export default function Step1Section({
  products,
  costRows,
  inferredVariableCostByProduct,
  onUpdateProduct,
  onRemoveProductRow,
  onAddProductRow,
  onUpdateCostRow,
  onRemoveCostRow,
  onAddCostRow
}: Props) {
  return (
    <div>
      <p className="muted">
        Rules: Selling Price must be entered per item only. Variable Cost per item is inferred from Material Requirements and Procurement Data on /materials.
        Pack Size is descriptive only and is not included in cost computation.
      </p>

      <h3 style={{ marginTop: "1rem" }}>Page 1A: Product Information (All Products)</h3>
      <Step1ProductsTable
        products={products}
        inferredVariableCostByProduct={inferredVariableCostByProduct}
        onUpdateProduct={onUpdateProduct}
        onRemoveProductRow={onRemoveProductRow}
      />
      <button type="button" onClick={onAddProductRow} style={{ marginTop: "0.75rem", maxWidth: "220px" }}>
        Add Product Row
      </button>

      <h3 style={{ marginTop: "1.25rem" }}>Page 1B: Fixed Costs + Budget</h3>
      <p className="muted">Budget stays in this table, but is treated as the break-even and planning constraint, not as product cost.</p>
      <Step1CostsTable costRows={costRows} onUpdateCostRow={onUpdateCostRow} onRemoveCostRow={onRemoveCostRow} />
      <button type="button" onClick={onAddCostRow} style={{ marginTop: "0.75rem", maxWidth: "220px" }}>
        Add Fixed Cost Row
      </button>
    </div>
  );
}
